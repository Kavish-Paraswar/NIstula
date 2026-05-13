"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.normalizeInboundMessage = normalizeInboundMessage;
const uuid_js_1 = require("../utils/uuid.js");
const helpers_js_1 = require("../utils/helpers.js");
function normalizeInboundMessage(payload) {
    return {
        message_id: (0, uuid_js_1.createUuid)(),
        source: payload.source,
        guest_name: (0, helpers_js_1.normalizeWhitespace)(payload.guest_name),
        message_text: (0, helpers_js_1.normalizeWhitespace)(payload.message),
        timestamp: payload.timestamp,
        booking_ref: (0, helpers_js_1.normalizeWhitespace)(payload.booking_ref),
        property_id: (0, helpers_js_1.normalizeWhitespace)(payload.property_id),
        phone: payload.phone ? (0, helpers_js_1.normalizeWhitespace)(payload.phone) : undefined,
        email: payload.email
    };
}
