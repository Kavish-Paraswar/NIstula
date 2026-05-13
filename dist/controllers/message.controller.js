"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleInboundMessage = handleInboundMessage;
const action_service_js_1 = require("../services/action.service.js");
const ai_service_js_1 = require("../services/ai.service.js");
const classification_service_js_1 = require("../services/classification.service.js");
const confidence_service_js_1 = require("../services/confidence.service.js");
const normalization_service_js_1 = require("../services/normalization.service.js");
const persistence_service_js_1 = require("../services/persistence.service.js");
const webhook_schema_js_1 = require("../schemas/webhook.schema.js");
const logger_js_1 = require("../utils/logger.js");
async function handleInboundMessage(req, res, next) {
    try {
        const payload = webhook_schema_js_1.webhookMessageSchema.parse(req.body);
        const classification = (0, classification_service_js_1.classifyMessage)(payload.message);
        const unifiedMessage = (0, normalization_service_js_1.normalizeInboundMessage)(payload, classification.queryType);
        const aiDraft = await (0, ai_service_js_1.generateGuestDraft)(unifiedMessage, classification.queryType);
        const confidenceScore = (0, confidence_service_js_1.calculateConfidence)({
            messageText: unifiedMessage.message_text,
            classification,
            draftReply: aiDraft.draftReply,
            usedFallback: aiDraft.usedFallback
        });
        const action = (0, action_service_js_1.decideAction)(classification.queryType, confidenceScore);
        try {
            await (0, persistence_service_js_1.storeProcessedMessage)({
                message: unifiedMessage,
                queryType: classification.queryType,
                aiDraft,
                confidenceScore,
                action
            });
        }
        catch (persistenceError) {
            logger_js_1.logger.error({ err: persistenceError, messageId: unifiedMessage.message_id }, "Persistence failed — returning draft without storing");
        }
        logger_js_1.logger.info({
            messageId: unifiedMessage.message_id,
            queryType: classification.queryType,
            confidenceScore,
            action,
            aiLatencyMs: aiDraft.latencyMs,
            aiFallback: aiDraft.usedFallback
        }, "Processed inbound guest message");
        res.status(200).json({
            message_id: unifiedMessage.message_id,
            query_type: classification.queryType,
            drafted_reply: aiDraft.draftReply,
            confidence_score: confidenceScore,
            action
        });
    }
    catch (error) {
        next(error);
    }
}
