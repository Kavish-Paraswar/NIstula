import type { UnifiedMessage } from "../schemas/unified.schema.js";
import type { QueryType } from "../types/message.types.js";

const villaB1Context = `Property: Villa B1, Assagao, North Goa
Bedrooms: 3 | Max guests: 6 | Private pool: Yes
Check-in: 2pm | Check-out: 11am
Base rate: INR 18,000 per night (up to 4 guests)
Extra guest: INR 2,000 per night per person
WiFi password: Nistula@2024
Caretaker: Available 8am to 10pm
Chef on call: Yes, pre-booking required
Availability April 20-24: Available
Cancellation: Free up to 7 days before check-in`;

export function buildGuestReplyPrompt(message: UnifiedMessage, queryType: QueryType): { system: string; user: string } {
  return {
    system: [
      "You are an AI hospitality assistant for Nistula luxury villas in Goa.",
      "Reply warmly, professionally, and concisely (max 4 short sentences).",
      "Use the property context below as the single source of truth. Do not invent details that are not in it.",
      "Never promise refunds, discounts, or financial guarantees — defer those to the operations team.",
      "For complaints, acknowledge the issue, confirm the operations team will follow up urgently, and mention the caretaker availability where relevant. Do not commit to a refund."
    ].join(" "),
    user: [
      `Property context:\n${villaB1Context}`,
      "",
      `Guest name: ${message.guest_name}`,
      `Source channel: ${message.source}`,
      `Booking reference: ${message.booking_ref}`,
      `Property ID: ${message.property_id}`,
      `Query type (already classified): ${queryType}`,
      `Guest message: ${message.message_text}`,
      "",
      "Return only the guest-facing draft reply. No preamble, no labels, no quotation marks."
    ].join("\n")
  };
}

export function buildFallbackReply(message: UnifiedMessage, queryType: QueryType): string {
  const name = message.guest_name;

  switch (queryType) {
    case "complaint":
      return `Dear ${name}, I am very sorry about this experience. I have flagged it for urgent review by our operations team, and our caretaker (available 8am to 10pm) will coordinate the fastest possible resolution. We will follow up on booking ${message.booking_ref} shortly.`;
    case "post_sales_checkin":
      return `Dear ${name}, standard check-in at Villa B1 is from 2:00 PM and check-out is by 11:00 AM. Our caretaker (8am to 10pm) can assist with arrival and WiFi access for booking ${message.booking_ref}.`;
    case "pre_sales_availability":
      return `Dear ${name}, thank you for your interest in Villa B1, Assagao. Our team will confirm availability for your preferred dates and share the latest options for booking ${message.booking_ref} shortly.`;
    case "pre_sales_pricing":
      return `Dear ${name}, our base rate at Villa B1 is INR 18,000 per night for up to 4 guests, with INR 2,000 per night for each additional guest. Our team will confirm the final quote for your dates before booking.`;
    case "special_request":
      return `Dear ${name}, thank you for sharing your request. I have noted it for our operations team, who will confirm what can be arranged (for example, our chef on call requires advance booking).`;
    default:
      return `Dear ${name}, thank you for reaching out to Nistula. I have noted your message and our team will assist you shortly.`;
  }
}
