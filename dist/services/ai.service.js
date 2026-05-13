"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateGuestDraft = generateGuestDraft;
const sdk_1 = __importDefault(require("@anthropic-ai/sdk"));
const env_js_1 = require("../config/env.js");
const guestReply_prompt_js_1 = require("../prompts/guestReply.prompt.js");
const logger_js_1 = require("../utils/logger.js");
const model = "claude-sonnet-4-20250514";
const maxRetries = 3;
function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}
function extractText(content) {
    return content
        .filter((part) => part.type === "text")
        .map((part) => part.text)
        .join("\n")
        .trim();
}
async function generateGuestDraft(message, queryType) {
    const startedAt = Date.now();
    if (!env_js_1.env.ANTHROPIC_API_KEY) {
        return {
            draftReply: (0, guestReply_prompt_js_1.buildFallbackReply)(message, queryType),
            model: "fallback-template",
            latencyMs: Date.now() - startedAt,
            usedFallback: true
        };
    }
    const anthropic = new sdk_1.default({ apiKey: env_js_1.env.ANTHROPIC_API_KEY });
    const prompt = (0, guestReply_prompt_js_1.buildGuestReplyPrompt)(message, queryType);
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
        }
        catch (error) {
            logger_js_1.logger.warn({ error, attempt }, "Claude draft generation failed");
            if (attempt === maxRetries) {
                return {
                    draftReply: (0, guestReply_prompt_js_1.buildFallbackReply)(message, queryType),
                    model: "fallback-template",
                    latencyMs: Date.now() - startedAt,
                    usedFallback: true
                };
            }
            await sleep(200 * 2 ** (attempt - 1));
        }
    }
    return {
        draftReply: (0, guestReply_prompt_js_1.buildFallbackReply)(message, queryType),
        model: "fallback-template",
        latencyMs: Date.now() - startedAt,
        usedFallback: true
    };
}
