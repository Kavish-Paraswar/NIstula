"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.clamp = clamp;
exports.isComplaintLike = isComplaintLike;
exports.normalizeWhitespace = normalizeWhitespace;
function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
}
function isComplaintLike(message) {
    return /\b(not working|broken|refund|angry|terrible|dirty|unsafe|no hot water|ac not|issue|complain|complaint)\b/i.test(message);
}
function normalizeWhitespace(value) {
    return value.replace(/\s+/g, " ").trim();
}
