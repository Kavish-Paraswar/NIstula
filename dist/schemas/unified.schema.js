"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.unifiedMessageSchema = void 0;
const zod_1 = require("zod");
const message_types_js_1 = require("../types/message.types.js");
const webhook_schema_js_1 = require("./webhook.schema.js");
exports.unifiedMessageSchema = zod_1.z.object({
    message_id: zod_1.z.uuid(),
    source: zod_1.z.enum(webhook_schema_js_1.supportedSources),
    guest_name: zod_1.z.string(),
    message_text: zod_1.z.string(),
    timestamp: zod_1.z.iso.datetime(),
    booking_ref: zod_1.z.string(),
    property_id: zod_1.z.string(),
    query_type: zod_1.z.enum(message_types_js_1.queryTypes)
});
