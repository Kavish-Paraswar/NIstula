"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildGuestReplyPrompt = buildGuestReplyPrompt;
exports.buildFallbackReply = buildFallbackReply;
const propertyContext = {
    brand: "Nistula luxury villas",
    checkIn: "Standard check-in is 2:00 PM and check-out is 11:00 AM.",
    amenities: "WiFi, parking, housekeeping support, curated local recommendations, and villa operations assistance.",
    policy: "Availability, pricing, early check-in, airport pickup, and refunds must be confirmed by the operations team before commitment."
};
function buildGuestReplyPrompt(message, queryType) {
    return {
        system: "You are an AI hospitality assistant for luxury villas. Reply warmly, professionally, and concisely. Do not promise unavailable services, refunds, discounts, or financial guarantees. For complaints, acknowledge the issue and say the operations team will review urgently.",
        user: [
            `Property context: ${propertyContext.brand}. ${propertyContext.checkIn} Amenities include ${propertyContext.amenities} ${propertyContext.policy}`,
            `Guest name: ${message.guest_name}`,
            `Property ID: ${message.property_id}`,
            `Booking reference: ${message.booking_ref}`,
            `Query type: ${queryType}`,
            `Guest message: ${message.message_text}`,
            "Return only the guest-facing draft reply."
        ].join("\n")
    };
}
function buildFallbackReply(message, queryType) {
    const name = message.guest_name;
    switch (queryType) {
        case "complaint":
            return `Dear ${name}, I am sorry about this experience. I have flagged it for urgent review by our operations team, and someone will follow up shortly.`;
        case "post_sales_checkin":
            return `Dear ${name}, standard check-in is from 2:00 PM and check-out is by 11:00 AM. Our team can also help with arrival details for booking ${message.booking_ref}.`;
        case "pre_sales_availability":
            return `Dear ${name}, thank you for your interest in ${message.property_id}. I will check availability for your preferred dates and have the team confirm the latest options.`;
        case "pre_sales_pricing":
            return `Dear ${name}, thank you for checking. Pricing can vary by dates, guest count, and villa availability, so our team will confirm the latest rate before booking.`;
        case "special_request":
            return `Dear ${name}, thank you for sharing your request. I have noted it for the operations team, who will confirm what can be arranged.`;
        default:
            return `Dear ${name}, thank you for reaching out to Nistula. I have noted your message and our team will assist you shortly.`;
    }
}
