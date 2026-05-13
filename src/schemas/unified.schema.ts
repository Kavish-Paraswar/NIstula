import { z } from "zod";
import { queryTypes } from "../types/message.types.js";
import { supportedSources } from "./webhook.schema.js";

export const unifiedMessageSchema = z.object({
  message_id: z.uuid(),
  source: z.enum(supportedSources),
  guest_name: z.string(),
  message_text: z.string(),
  timestamp: z.iso.datetime(),
  booking_ref: z.string(),
  property_id: z.string(),
  query_type: z.enum(queryTypes)
});

export type UnifiedMessage = z.infer<typeof unifiedMessageSchema>;
