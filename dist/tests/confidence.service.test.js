"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const confidence_service_js_1 = require("../src/services/confidence.service.js");
(0, vitest_1.describe)("calculateConfidence", () => {
    (0, vitest_1.it)("caps complaints below escalation threshold", () => {
        const score = (0, confidence_service_js_1.calculateConfidence)({
            messageText: "The AC is not working and this is terrible.",
            classification: { queryType: "complaint", certainty: 0.96, matchedSignals: ["complaint"] },
            draftReply: "Dear guest, I am sorry about this experience and have flagged it for urgent review.",
            usedFallback: false
        });
        (0, vitest_1.expect)(score).toBeLessThan(0.6);
    });
    (0, vitest_1.it)("keeps clear FAQ-style responses high", () => {
        const score = (0, confidence_service_js_1.calculateConfidence)({
            messageText: "What is the check-in time and WiFi password?",
            classification: { queryType: "post_sales_checkin", certainty: 0.92, matchedSignals: ["check-in"] },
            draftReply: "Dear guest, standard check-in is from 2:00 PM. Our team will share WiFi details before arrival.",
            usedFallback: false
        });
        (0, vitest_1.expect)(score).toBeGreaterThan(0.85);
    });
});
