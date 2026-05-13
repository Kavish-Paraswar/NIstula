import { describe, expect, it } from "vitest";
import { classifyMessage } from "../src/services/classification.service.js";

describe("classifyMessage", () => {
  it("classifies availability messages", () => {
    expect(classifyMessage("Is the villa available from 20 to 24 May?").queryType).toBe("pre_sales_availability");
  });

  it("classifies pricing messages", () => {
    expect(classifyMessage("What is the rate for 5 guests?").queryType).toBe("pre_sales_pricing");
  });

  it("classifies check-in messages", () => {
    expect(classifyMessage("What is the check-in time and WiFi password?").queryType).toBe("post_sales_checkin");
  });

  it("classifies special requests", () => {
    expect(classifyMessage("Can you arrange airport pickup?").queryType).toBe("special_request");
  });

  it("prioritizes complaints", () => {
    expect(classifyMessage("The AC is not working and I want to complain.").queryType).toBe("complaint");
  });

  it("falls back to general enquiry", () => {
    expect(classifyMessage("Do you have parking?").queryType).toBe("general_enquiry");
  });
});
