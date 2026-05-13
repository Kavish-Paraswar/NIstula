"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createApp = createApp;
const express_1 = __importDefault(require("express"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const helmet_1 = __importDefault(require("helmet"));
const swagger_ui_express_1 = __importDefault(require("swagger-ui-express"));
const env_js_1 = require("./config/env.js");
const error_middleware_js_1 = require("./middleware/error.middleware.js");
const logger_middleware_js_1 = require("./middleware/logger.middleware.js");
const message_routes_js_1 = require("./routes/message.routes.js");
const openApiDocument = {
    openapi: "3.0.0",
    info: {
        title: "Nistula Guest Messaging API",
        version: "1.0.0"
    },
    paths: {
        "/webhook/message": {
            post: {
                summary: "Process an inbound guest message",
                requestBody: {
                    required: true,
                    content: {
                        "application/json": {
                            example: {
                                source: "whatsapp",
                                guest_name: "Rahul Sharma",
                                message: "What is the check-in time and WiFi password?",
                                timestamp: "2026-05-05T10:30:00Z",
                                booking_ref: "NIS-2024-0891",
                                property_id: "villa-b1"
                            }
                        }
                    }
                },
                responses: {
                    "201": { description: "Draft reply generated" },
                    "400": { description: "Invalid payload" },
                    "500": { description: "Server or persistence error" }
                }
            }
        }
    }
};
function createApp() {
    const app = (0, express_1.default)();
    app.use((0, helmet_1.default)());
    app.use((0, express_rate_limit_1.default)({
        windowMs: env_js_1.env.RATE_LIMIT_WINDOW_MS,
        limit: env_js_1.env.RATE_LIMIT_MAX,
        standardHeaders: true,
        legacyHeaders: false
    }));
    app.use(express_1.default.json({ limit: "1mb" }));
    app.use(logger_middleware_js_1.requestLogger);
    app.get("/health", (_req, res) => {
        res.json({ success: true, status: "ok" });
    });
    app.use("/docs", swagger_ui_express_1.default.serve, swagger_ui_express_1.default.setup(openApiDocument));
    app.use("/webhook", message_routes_js_1.messageRouter);
    app.use(error_middleware_js_1.errorMiddleware);
    return app;
}
