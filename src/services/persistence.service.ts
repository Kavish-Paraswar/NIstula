import { Prisma } from "@prisma/client";
import { getPrisma } from "../config/db.js";
import type { UnifiedMessage } from "../schemas/unified.schema.js";
import type { ActionType, AiDraftResult, QueryType } from "../types/message.types.js";
import { logger } from "../utils/logger.js";

type StoreMessageInput = {
  message: UnifiedMessage;
  queryType: QueryType;
  aiDraft: AiDraftResult;
  confidenceScore: number;
  action: ActionType;
};

export async function storeProcessedMessage(input: StoreMessageInput): Promise<void> {
  const prisma = getPrisma();

  if (!prisma) {
    logger.debug("DATABASE_URL not configured — skipping persistence");
    return;
  }

  await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
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
async function resolveGuestId(tx: Prisma.TransactionClient, message: UnifiedMessage): Promise<string> {
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

async function findOrCreateConversation(
  tx: Prisma.TransactionClient,
  guestId: string,
  reservationId: string,
  source: string
) {
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
