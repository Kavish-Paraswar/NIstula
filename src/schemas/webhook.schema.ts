import { z } from "zod";

export const supportedSources = ["whatsapp", "booking_com", "airbnb", "instagram", "direct"] as const;

export const webhookMessageSchema = z.object({
  source: z.enum(supportedSources, { error: "Invalid source" }),
  guest_name: z.string().trim().min(1, "guest_name is required").max(120),
  message: z.string().trim().min(1, "message is required").max(4000),
  timestamp: z.iso.datetime({ error: "timestamp must be an ISO datetime" }),
  booking_ref: z.string().trim().min(1, "booking_ref is required").max(80),
  property_id: z.string().trim().min(1, "property_id is required").max(80)
});

export type WebhookMessageInput = z.infer<typeof webhookMessageSchema>;
