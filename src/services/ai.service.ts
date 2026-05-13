import Anthropic from "@anthropic-ai/sdk";
import { env } from "../config/env.js";
import { buildFallbackReply, buildGuestReplyPrompt } from "../prompts/guestReply.prompt.js";
import type { UnifiedMessage } from "../schemas/unified.schema.js";
import type { AiDraftResult, QueryType } from "../types/message.types.js";
import { logger } from "../utils/logger.js";

const model = "claude-sonnet-4-20250514";
const maxRetries = 3;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function extractText(content: Anthropic.Messages.Message["content"]): string {
  return content
    .filter((part) => part.type === "text")
    .map((part) => part.text)
    .join("\n")
    .trim();
}

export async function generateGuestDraft(message: UnifiedMessage, queryType: QueryType): Promise<AiDraftResult> {
  const startedAt = Date.now();

  if (!env.ANTHROPIC_API_KEY) {
    return {
      draftReply: buildFallbackReply(message, queryType),
      model: "fallback-template",
      latencyMs: Date.now() - startedAt,
      usedFallback: true
    };
  }

  const anthropic = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY });
  const prompt = buildGuestReplyPrompt(message, queryType);

  for (let attempt = 1; attempt <= maxRetries; attempt += 1) {
    try {
      const response = await anthropic.messages.create({
        model,
        max_tokens: 350,
        temperature: 0.3,
        system: prompt.system,
        messages: [{ role: "user", content: prompt.user }]
      });

      const draftReply = extractText(response.content);

      if (!draftReply) {
        throw new Error("Claude returned an empty draft reply.");
      }

      return {
        draftReply,
        model,
        latencyMs: Date.now() - startedAt,
        promptTokens: response.usage.input_tokens,
        responseTokens: response.usage.output_tokens,
        usedFallback: false
      };
    } catch (error) {
      logger.warn({ error, attempt }, "Claude draft generation failed");

      if (attempt === maxRetries) {
        return {
          draftReply: buildFallbackReply(message, queryType),
          model: "fallback-template",
          latencyMs: Date.now() - startedAt,
          usedFallback: true
        };
      }

      await sleep(200 * 2 ** (attempt - 1));
    }
  }

  return {
    draftReply: buildFallbackReply(message, queryType),
    model: "fallback-template",
    latencyMs: Date.now() - startedAt,
    usedFallback: true
  };
}
