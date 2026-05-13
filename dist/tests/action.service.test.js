"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const action_service_js_1 = require("../src/services/action.service.js");
(0, vitest_1.describe)("decideAction", () => {
    (0, vitest_1.it)("escalates complaints", () => {
        (0, vitest_1.expect)((0, action_service_js_1.decideAction)("complaint", 0.95)).toBe("escalate");
    });
    (0, vitest_1.it)("auto sends high confidence replies", () => {
        (0, vitest_1.expect)((0, action_service_js_1.decideAction)("post_sales_checkin", 0.91)).toBe("auto_send");
    });
    (0, vitest_1.it)("routes medium confidence replies to review", () => {
        (0, vitest_1.expect)((0, action_service_js_1.decideAction)("pre_sales_pricing", 0.75)).toBe("agent_review");
    });
    (0, vitest_1.it)("escalates low confidence replies", () => {
        (0, vitest_1.expect)((0, action_service_js_1.decideAction)("general_enquiry", 0.45)).toBe("escalate");
    });
});
