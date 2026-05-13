import { describe, expect, it } from "vitest";
import { decideAction } from "../src/services/action.service.js";

describe("decideAction", () => {
  it("escalates complaints", () => {
    expect(decideAction("complaint", 0.95)).toBe("escalate");
  });

  it("auto sends high confidence replies", () => {
    expect(decideAction("post_sales_checkin", 0.91)).toBe("auto_send");
  });

  it("routes medium confidence replies to review", () => {
    expect(decideAction("pre_sales_pricing", 0.75)).toBe("agent_review");
  });

  it("escalates low confidence replies", () => {
    expect(decideAction("general_enquiry", 0.45)).toBe("escalate");
  });
});
