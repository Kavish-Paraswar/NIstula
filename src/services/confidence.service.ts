import type { ClassificationResult } from "../types/message.types.js";
import { clamp, isComplaintLike } from "../utils/helpers.js";

type ConfidenceInput = {
  messageText: string;
  classification: ClassificationResult;
  draftReply: string;
  usedFallback: boolean;
};

export function calculateConfidence(input: ConfidenceInput): number {
  let score = input.classification.certainty;
  const wordCount = input.messageText.split(/\s+/).filter(Boolean).length;

  if (wordCount < 3) {
    score -= 0.18;
  }

  if (input.draftReply.length < 40) {
    score -= 0.12;
  }

  if (input.usedFallback) {
    score -= 0.05;
  }

  if (input.classification.queryType === "complaint" || isComplaintLike(input.messageText)) {
    score = Math.min(score, 0.55);
  }

  return Number(clamp(score, 0.2, 0.98).toFixed(2));
}
