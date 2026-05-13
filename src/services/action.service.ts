import type { ActionType, QueryType } from "../types/message.types.js";

export function decideAction(queryType: QueryType, confidenceScore: number): ActionType {
  if (queryType === "complaint") {
    return "escalate";
  }

  if (confidenceScore > 0.85) {
    return "auto_send";
  }

  if (confidenceScore >= 0.6) {
    return "agent_review";
  }

  return "escalate";
}
