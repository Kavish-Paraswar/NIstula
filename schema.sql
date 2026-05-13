-- Nistula Unified Messaging Platform — PostgreSQL schema.
-- All primary keys are UUIDs (gen_random_uuid) so writes can scale horizontally
-- without coordination and IDs are safe to expose to external systems. We use
-- pgcrypto for gen_random_uuid().

CREATE EXTENSION IF NOT EXISTS "pgcrypto";


-- guests: one row per real-world guest, regardless of which channel they wrote
-- in on. Phone and email are nullable because not every channel surfaces them
-- (e.g. an Instagram DM only gives us a handle). The application layer is
-- responsible for find-or-create dedup across channels — see DESIGN NOTES.
CREATE TABLE guests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);


-- reservations: a booking on a specific property tied to a specific guest.
-- booking_ref is the external identifier from the booking system, so it must
-- be UNIQUE — it is the natural join key from incoming webhooks. property_id
-- is denormalized as TEXT because Nistula's property catalog lives in a
-- separate system; we accept whatever identifier the channel sends.
CREATE TABLE reservations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_ref TEXT NOT NULL UNIQUE,
  property_id TEXT NOT NULL,
  check_in TIMESTAMPTZ,
  check_out TIMESTAMPTZ,
  guest_id UUID NOT NULL REFERENCES guests(id),
  status TEXT NOT NULL DEFAULT 'unknown',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);


-- conversations: groups messages by (guest, reservation, source). We model
-- this as an explicit join rather than implying it from booking_ref because
-- the same guest can talk to us on multiple channels for the same booking
-- (WhatsApp before arrival, Airbnb afterwards) — each channel is its own
-- thread. reservation_id is nullable so pre-sales enquiries (no booking yet)
-- still get a conversation row.
CREATE TABLE conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  guest_id UUID NOT NULL REFERENCES guests(id),
  reservation_id UUID REFERENCES reservations(id),
  source TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);


-- messages: every guest message, inbound or outbound, lives in this single
-- table. Channel-specific quirks are captured by `source`, not by separate
-- tables — that keeps analytics simple (one GROUP BY query covers everything)
-- and reflects that messages are semantically the same object regardless of
-- channel. ai_generated / agent_edited / auto_sent are tri-state flags rather
-- than a single enum because a draft can be AI-generated AND agent-edited AND
-- auto-sent — these are independent facts about the same row.
-- confidence_score is DOUBLE PRECISION with no DB-level CHECK constraint;
-- the [0.20, 0.98] clamp is enforced in the application so we can adjust the
-- range later without a migration.
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES conversations(id),
  source TEXT NOT NULL,
  message_type TEXT NOT NULL,         -- 'inbound' | 'outbound'
  message_text TEXT NOT NULL,
  query_type TEXT NOT NULL,           -- classifier output
  draft_reply TEXT,                   -- AI / template draft (null for outbound human-only)
  confidence_score DOUBLE PRECISION NOT NULL,
  action TEXT NOT NULL,               -- 'auto_send' | 'agent_review' | 'escalate'
  ai_generated BOOLEAN NOT NULL DEFAULT false,
  agent_edited BOOLEAN NOT NULL DEFAULT false,
  auto_sent BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);


-- ai_logs: one row per Claude (or fallback) call, joined back to the message
-- it produced. Kept separate from `messages` so the message table stays narrow
-- and so we can rotate / archive ai_logs independently — token counts and
-- latency are operational data, not customer data.
CREATE TABLE ai_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID NOT NULL REFERENCES messages(id),
  prompt_tokens INTEGER,
  response_tokens INTEGER,
  model TEXT NOT NULL,
  latency_ms INTEGER NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);


-- Indexes are chosen for the read patterns we actually run:
-- find a reservation by its booking_ref (every inbound webhook does this),
-- list a guest's conversations, render a conversation chronologically,
-- and slice messages by source / query_type for analytics dashboards.
CREATE INDEX idx_reservations_booking_ref ON reservations(booking_ref);
CREATE INDEX idx_reservations_guest_id ON reservations(guest_id);
CREATE INDEX idx_conversations_guest_id ON conversations(guest_id);
CREATE INDEX idx_conversations_reservation_id ON conversations(reservation_id);
CREATE INDEX idx_conversations_source ON conversations(source);
CREATE INDEX idx_conversations_created_at ON conversations(created_at);
CREATE INDEX idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX idx_messages_created_at ON messages(created_at);
CREATE INDEX idx_messages_source ON messages(source);
CREATE INDEX idx_messages_query_type ON messages(query_type);
CREATE INDEX idx_ai_logs_message_id ON ai_logs(message_id);
CREATE INDEX idx_ai_logs_created_at ON ai_logs(created_at);


-- =====================================================================
-- DESIGN NOTES — hardest decision
-- =====================================================================
-- The hardest call was guest deduplication across channels. The brief
-- requires "one record per guest across all channels", but the channels we
-- receive give us wildly inconsistent identifying data: WhatsApp gives a
-- phone, Booking.com gives an email, Instagram gives only a handle and a
-- name, and direct enquiries may have neither. A strict UNIQUE constraint on
-- phone or email would reject perfectly valid inbound messages from any
-- channel that does not carry that field, and a composite UNIQUE on
-- (full_name, phone, email) would still merge two distinct guests who happen
-- to share a name. We chose to keep guests.phone and guests.email as plain
-- nullable columns without uniqueness, and enforce dedup at the application
-- layer with a priority cascade: first reuse the guest already linked to the
-- incoming booking_ref (via reservations), then fall back to a case-
-- insensitive full_name match, then create a new row. This keeps writes
-- non-blocking, lets the dedup rules evolve without a migration, and
-- accepts that some duplicate-name guests will need a manual merge in the
-- ops console — which we consider the right trade for never rejecting a
-- legitimate inbound message.
