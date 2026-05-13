"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.webhookMessageSchema = exports.supportedSources = void 0;
const zod_1 = require("zod");
exports.supportedSources = ["whatsapp", "airbnb", "booking.com", "email", "sms", "website"];
exports.webhookMessageSchema = zod_1.z.object({
    source: zod_1.z.enum(exports.supportedSources, { error: "Invalid source" }),
    guest_name: zod_1.z.string().trim().min(1, "guest_name is required").max(120),
    message: zod_1.z.string().trim().min(1, "message is required").max(4000),
    timestamp: zod_1.z.iso.datetime({ error: "timestamp must be an ISO datetime" }),
    booking_ref: zod_1.z.string().trim().min(1, "booking_ref is required").max(80),
    property_id: zod_1.z.string().trim().min(1, "property_id is required").max(80),
    phone: zod_1.z.string().trim().max(40).optional(),
    email: zod_1.z.email().optional()
});
