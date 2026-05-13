import { describe, expect, it } from "vitest";
import { calculateConfidence } from "../src/services/confidence.service.js";

describe("calculateConfidence", () => {
  it("caps complaints below escalation threshold", () => {
    const score = calculateConfidence({
      messageText: "The AC is not working and this is terrible.",
      classification: { queryType: "complaint", certainty: 0.96, matchedSignals: ["complaint"] },
      draftReply: "Dear guest, I am sorry about this experience and have flagged it for urgent review.",
      usedFallback: false
    });

    expect(score).toBeLessThan(0.6);
  });

  it("keeps clear FAQ-style responses high", () => {
    const score = calculateConfidence({
      messageText: "What is the check-in time and WiFi password?",
      classification: { queryType: "post_sales_checkin", certainty: 0.92, matchedSignals: ["check-in"] },
      draftReply: "Dear guest, standard check-in is from 2:00 PM. Our team will share WiFi details before arrival.",
      usedFallback: false
    });

    expect(score).toBeGreaterThan(0.85);
  });
});
