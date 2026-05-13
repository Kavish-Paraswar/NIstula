import type { WebhookMessageInput } from "../schemas/webhook.schema.js";
import type { UnifiedMessage } from "../schemas/unified.schema.js";
import type { QueryType } from "../types/message.types.js";
import { createUuid } from "../utils/uuid.js";
import { normalizeWhitespace } from "../utils/helpers.js";

export function normalizeInboundMessage(payload: WebhookMessageInput, queryType: QueryType): UnifiedMessage {
  return {
    message_id: createUuid(),
    source: payload.source,
    guest_name: normalizeWhitespace(payload.guest_name),
    message_text: normalizeWhitespace(payload.message),
    timestamp: payload.timestamp,
    booking_ref: normalizeWhitespace(payload.booking_ref),
    property_id: normalizeWhitespace(payload.property_id),
    query_type: queryType
  };
}
