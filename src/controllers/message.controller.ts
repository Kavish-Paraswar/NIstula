import type { Request, Response, NextFunction } from "express";
import { decideAction } from "../services/action.service.js";
import { generateGuestDraft } from "../services/ai.service.js";
import { classifyMessage } from "../services/classification.service.js";
import { calculateConfidence } from "../services/confidence.service.js";
import { normalizeInboundMessage } from "../services/normalization.service.js";
import { storeProcessedMessage } from "../services/persistence.service.js";
import { webhookMessageSchema } from "../schemas/webhook.schema.js";
import { logger } from "../utils/logger.js";

export async function handleInboundMessage(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const payload = webhookMessageSchema.parse(req.body);
    const classification = classifyMessage(payload.message);
    const unifiedMessage = normalizeInboundMessage(payload, classification.queryType);
    const aiDraft = await generateGuestDraft(unifiedMessage, classification.queryType);
    const confidenceScore = calculateConfidence({
      messageText: unifiedMessage.message_text,
      classification,
      draftReply: aiDraft.draftReply,
      usedFallback: aiDraft.usedFallback
    });
    const action = decideAction(classification.queryType, confidenceScore);

    try {
      await storeProcessedMessage({
        message: unifiedMessage,
        queryType: classification.queryType,
        aiDraft,
        confidenceScore,
        action
      });
    } catch (persistenceError) {
      logger.error(
        { err: persistenceError, messageId: unifiedMessage.message_id },
        "Persistence failed — returning draft without storing"
      );
    }

    logger.info(
      {
        messageId: unifiedMessage.message_id,
        queryType: classification.queryType,
        confidenceScore,
        action,
        aiLatencyMs: aiDraft.latencyMs,
        aiFallback: aiDraft.usedFallback
      },
      "Processed inbound guest message"
    );

    res.status(200).json({
      message_id: unifiedMessage.message_id,
      query_type: classification.queryType,
      drafted_reply: aiDraft.draftReply,
      confidence_score: confidenceScore,
      action
    });
  } catch (error) {
    next(error);
  }
}
