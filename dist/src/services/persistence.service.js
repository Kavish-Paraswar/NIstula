"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.storeProcessedMessage = storeProcessedMessage;
const db_js_1 = require("../config/db.js");
async function storeProcessedMessage(input) {
    const prisma = (0, db_js_1.getPrisma)();
    const result = await prisma.$transaction(async (tx) => {
        const guest = await tx.guest.create({
            data: {
                fullName: input.message.guest_name,
                phone: input.message.phone,
                email: input.message.email
            }
        });
        const reservation = await tx.reservation.upsert({
            where: { bookingRef: input.message.booking_ref },
            update: {
                propertyId: input.message.property_id,
                guestId: guest.id
            },
            create: {
                bookingRef: input.message.booking_ref,
                propertyId: input.message.property_id,
                guestId: guest.id
            }
        });
        const conversation = await tx.conversation.create({
            data: {
                guestId: guest.id,
                reservationId: reservation.id,
                source: input.message.source
            }
        });
        const storedMessage = await tx.message.create({
            data: {
                id: input.message.message_id,
                conversationId: conversation.id,
                source: input.message.source,
                messageType: "inbound",
                messageText: input.message.message_text,
                queryType: input.queryType,
                draftReply: input.aiDraft.draftReply,
                confidenceScore: input.confidenceScore,
                action: input.action,
                aiGenerated: !input.aiDraft.usedFallback,
                autoSent: input.action === "auto_send"
            }
        });
        await tx.aiLog.create({
            data: {
                messageId: storedMessage.id,
                promptTokens: input.aiDraft.promptTokens,
                responseTokens: input.aiDraft.responseTokens,
                model: input.aiDraft.model,
                latencyMs: input.aiDraft.latencyMs
            }
        });
        return storedMessage.id;
    });
    return result;
}
