export const queryTypes = [
  "pre_sales_availability",
  "pre_sales_pricing",
  "post_sales_checkin",
  "special_request",
  "complaint",
  "general_enquiry"
] as const;

export type QueryType = (typeof queryTypes)[number];

export const actionTypes = ["auto_send", "agent_review", "escalate"] as const;

export type ActionType = (typeof actionTypes)[number];

export type ClassificationResult = {
  queryType: QueryType;
  certainty: number;
  matchedSignals: string[];
};

export type AiDraftResult = {
  draftReply: string;
  model: string;
  latencyMs: number;
  promptTokens?: number;
  responseTokens?: number;
  usedFallback: boolean;
};
