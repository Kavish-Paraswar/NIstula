"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.storeProcessedMessage = storeProcessedMessage;
const db_js_1 = require("../config/db.js");
const logger_js_1 = require("../utils/logger.js");
async function storeProcessedMessage(input) {
    const prisma = (0, db_js_1.getPrisma)();
    if (!prisma) {
        logger_js_1.logger.debug("DATABASE_URL not configured — skipping persistence");
        return;
    }
    await prisma.$transaction(async (tx) => {
        const guestId = await resolveGuestId(tx, input.message);
        const reservation = await tx.reservation.upsert({
            where: { bookingRef: input.message.booking_ref },
            update: { propertyId: input.message.property_id, guestId },
            create: { bookingRef: input.message.booking_ref, propertyId: input.message.property_id, guestId }
        });
        const conversation = await findOrCreateConversation(tx, guestId, reservation.id, input.message.source);
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
    });
}
// Honors "one record per guest across all channels": reuse an existing guest if
// the booking_ref already maps to one, otherwise match by case-insensitive
// full_name. Only as a last resort do we create a new guest.
async function resolveGuestId(tx, message) {
    const existingReservation = await tx.reservation.findUnique({
        where: { bookingRef: message.booking_ref }
    });
    if (existingReservation) {
        return existingReservation.guestId;
    }
    const existingGuest = await tx.guest.findFirst({
        where: { fullName: { equals: message.guest_name, mode: "insensitive" } }
    });
    if (existingGuest) {
        return existingGuest.id;
    }
    const created = await tx.guest.create({
        data: { fullName: message.guest_name }
    });
    return created.id;
}
async function findOrCreateConversation(tx, guestId, reservationId, source) {
    const existing = await tx.conversation.findFirst({
        where: { guestId, reservationId, source }
    });
    if (existing) {
        return existing;
    }
    return tx.conversation.create({
        data: { guestId, reservationId, source }
    });
}
