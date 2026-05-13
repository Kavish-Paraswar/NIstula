"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.calculateConfidence = calculateConfidence;
const helpers_js_1 = require("../utils/helpers.js");
function calculateConfidence(input) {
    let score = input.classification.certainty;
    const wordCount = input.messageText.split(/\s+/).filter(Boolean).length;
    if (wordCount < 3) {
        score -= 0.18;
    }
    if (input.draftReply.length < 40) {
        score -= 0.12;
    }
    if (input.usedFallback) {
        score -= 0.05;
    }
    if (input.classification.queryType === "complaint" || (0, helpers_js_1.isComplaintLike)(input.messageText)) {
        score = Math.min(score, 0.55);
    }
    return Number((0, helpers_js_1.clamp)(score, 0.2, 0.98).toFixed(2));
}
