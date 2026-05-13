"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const classification_service_js_1 = require("../src/services/classification.service.js");
(0, vitest_1.describe)("classifyMessage", () => {
    (0, vitest_1.it)("classifies availability messages", () => {
        (0, vitest_1.expect)((0, classification_service_js_1.classifyMessage)("Is the villa available from 20 to 24 May?").queryType).toBe("pre_sales_availability");
    });
    (0, vitest_1.it)("classifies pricing messages", () => {
        (0, vitest_1.expect)((0, classification_service_js_1.classifyMessage)("What is the rate for 5 guests?").queryType).toBe("pre_sales_pricing");
    });
    (0, vitest_1.it)("classifies check-in messages", () => {
        (0, vitest_1.expect)((0, classification_service_js_1.classifyMessage)("What is the check-in time and WiFi password?").queryType).toBe("post_sales_checkin");
    });
    (0, vitest_1.it)("classifies special requests", () => {
        (0, vitest_1.expect)((0, classification_service_js_1.classifyMessage)("Can you arrange airport pickup?").queryType).toBe("special_request");
    });
    (0, vitest_1.it)("prioritizes complaints", () => {
        (0, vitest_1.expect)((0, classification_service_js_1.classifyMessage)("The AC is not working and I want to complain.").queryType).toBe("complaint");
    });
    (0, vitest_1.it)("falls back to general enquiry", () => {
        (0, vitest_1.expect)((0, classification_service_js_1.classifyMessage)("Do you have parking?").queryType).toBe("general_enquiry");
    });
});
