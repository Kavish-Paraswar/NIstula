import type { ClassificationResult, QueryType } from "../types/message.types.js";

const categorySignals: Record<QueryType, RegExp[]> = {
  complaint: [
    /\b(ac not|not working|broken|dirty|unsafe|terrible|angry|complaint|complain|refund|no hot water|leak|smell)\b/i
  ],
  post_sales_checkin: [
    /\b(check[- ]?in|check[- ]?out|wifi|wi-fi|password|arrival|directions|key|gate|address)\b/i
  ],
  pre_sales_availability: [
    /\b(available|availability|vacant|can i book|book from|dates|stay from|reserve)\b/i
  ],
  pre_sales_pricing: [
    /\b(price|pricing|rate|cost|tariff|charges|how much|discount|quote)\b/i
  ],
  special_request: [
    /\b(airport pickup|early check[- ]?in|late check[- ]?out|birthday|anniversary|decor|chef|extra bed|special request)\b/i
  ],
  general_enquiry: [
    /\b(pets|parking|pool|breakfast|amenities|allowed|nearby|rules|policy)\b/i
  ]
};

const priority: QueryType[] = [
  "complaint",
  "post_sales_checkin",
  "pre_sales_availability",
  "pre_sales_pricing",
  "special_request",
  "general_enquiry"
];

export function classifyMessage(messageText: string): ClassificationResult {
  const matches = priority
    .map((queryType) => {
      const matchedSignals = categorySignals[queryType]
        .filter((pattern) => pattern.test(messageText))
        .map((pattern) => pattern.source);

      return { queryType, matchedSignals };
    })
    .filter((match) => match.matchedSignals.length > 0);

  if (matches.length === 0) {
    return {
      queryType: "general_enquiry",
      certainty: 0.58,
      matchedSignals: []
    };
  }

  const bestMatch = matches[0];
  const certainty = bestMatch.queryType === "complaint" ? 0.96 : Math.min(0.92, 0.72 + bestMatch.matchedSignals.length * 0.2);

  return {
    queryType: bestMatch.queryType,
    certainty,
    matchedSignals: bestMatch.matchedSignals
  };
}
