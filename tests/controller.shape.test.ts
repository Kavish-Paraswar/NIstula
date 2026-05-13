import { describe, expect, it, vi } from "vitest";

vi.mock("../src/services/ai.service.js", () => ({
  generateGuestDraft: vi.fn(async () => ({
    draftReply:
      "Dear Rahul Sharma, Villa B1 is available from April 20 to 24. Our team will confirm pricing for 2 adults shortly.",
    model: "test-stub",
    latencyMs: 1,
    promptTokens: 10,
    responseTokens: 20,
    usedFallback: false
  }))
}));

vi.mock("../src/services/persistence.service.js", () => ({
  storeProcessedMessage: vi.fn(async () => {})
}));

import { handleInboundMessage } from "../src/controllers/message.controller.js";

type CapturedResponse = {
  status: number;
  body: Record<string, unknown> | null;
};

function makeMockRes(captured: CapturedResponse) {
  return {
    status(code: number) {
      captured.status = code;
      return this;
    },
    json(payload: Record<string, unknown>) {
      captured.body = payload;
      return this;
    }
  };
}

describe("POST /webhook/message response shape", () => {
  it("returns the exact flat object the brief specifies (HTTP 200, no wrapper)", async () => {
    const req = {
      body: {
        source: "whatsapp",
        guest_name: "Rahul Sharma",
        message: "Is the villa available from April 20 to 24?",
        timestamp: "2026-05-05T10:30:00Z",
        booking_ref: "NIS-2024-0891",
        property_id: "villa-b1"
      }
    } as unknown as Parameters<typeof handleInboundMessage>[0];

    const captured: CapturedResponse = { status: 0, body: null };
    const res = makeMockRes(captured) as unknown as Parameters<typeof handleInboundMessage>[1];
    const next = vi.fn();

    await handleInboundMessage(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(captured.status).toBe(200);
    expect(captured.body).not.toBeNull();

    const body = captured.body!;
    expect(Object.keys(body).sort()).toEqual([
      "action",
      "confidence_score",
      "drafted_reply",
      "message_id",
      "query_type"
    ]);

    expect(body).not.toHaveProperty("success");
    expect(body).not.toHaveProperty("data");
    expect(body).not.toHaveProperty("draft_reply");

    expect(typeof body.message_id).toBe("string");
    expect(body.message_id as string).toMatch(/^[0-9a-f-]{36}$/i);
    expect(typeof body.query_type).toBe("string");
    expect(typeof body.drafted_reply).toBe("string");
    expect((body.drafted_reply as string).length).toBeGreaterThan(0);
    expect(typeof body.confidence_score).toBe("number");
    expect(body.confidence_score as number).toBeGreaterThanOrEqual(0);
    expect(body.confidence_score as number).toBeLessThanOrEqual(1);
    expect(["auto_send", "agent_review", "escalate"]).toContain(body.action);
  });
});
