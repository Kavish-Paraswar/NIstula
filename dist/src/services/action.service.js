"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.decideAction = decideAction;
function decideAction(queryType, confidenceScore) {
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
