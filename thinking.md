# Part 3 — Thinking

## Question A — The Immediate Response

Drafted reply (sent verbatim at 3am):

> Dear [Guest], I am so sorry — no hot water at 3am with guests arriving in 4 hours is exactly what we never want you to wake up to. Our caretaker is on the way to Villa B1 now and will message you on arrival (ETA 30 min). Our operations lead, Priya, will also call you personally within the hour. On the refund: please let me sort the hot water first, and we will discuss compensation properly once you and your guests are looked after. — Nistula Operations

**Why this wording:** Acknowledge the specific 3am pain (not a generic apology), commit to one concrete action with an ETA the system can actually deliver, and name the human who owns the follow-up. The refund line is intentional — silence would feel dismissive, but promising it would be outside policy and beyond what an AI should commit to.

## Question B — The System Design

`action == "escalate"` + `query_type == "complaint"` fires an escalation chain. Within 60 seconds: PagerDuty + SMS to the on-call ops lead, a WhatsApp template to the on-property caretaker, and a Slack post in `#vip-incidents` with `booking_ref`, `property_id`, and the verbatim message. An `incidents` row is inserted, FK'd to `messages.id`, with `status = 'open'` and the assigned ops lead. `auto_sent` stays `false` — no AI draft reaches a complaining guest without a human in the loop.

A 30-minute watchdog (BullMQ delayed job) checks `incidents.first_human_response_at`. If still null, it pages the property manager and GM, and sends the guest a status-only update ("Our team is on the way"). Every step is timestamped for SLA audit.

## Question C — The Learning

The signals are already in `messages`: `query_type = 'complaint'` plus the text. A nightly analytics job groups complaints by `property_id` + keyword tokens over a rolling 60-day window. Any property crossing 3 hits on the same keyword writes to a `recurring_issues` view that surfaces on the ops dashboard.

On a fresh write the system auto-creates a preventive-maintenance ticket against that property and stages a pre-arrival WhatsApp for the next 5 bookings ("Villa B1's water heater was serviced on [date]; the caretaker is on call"). The ticket cannot be closed without an `evidence` field — plumber report or photo — before the recurring-issue flag clears. A recurring apology becomes a closed loop with a paper trail.
