"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorMiddleware = exports.AppError = void 0;
const zod_1 = require("zod");
const logger_js_1 = require("../utils/logger.js");
class AppError extends Error {
    statusCode;
    constructor(statusCode, message) {
        super(message);
        this.statusCode = statusCode;
    }
}
exports.AppError = AppError;
const errorMiddleware = (error, _req, res, _next) => {
    if (error instanceof zod_1.ZodError) {
        const firstIssue = error.issues[0];
        res.status(400).json({
            success: false,
            error: firstIssue?.message ?? "Invalid payload"
        });
        return;
    }
    if (error instanceof AppError) {
        res.status(error.statusCode).json({
            success: false,
            error: error.message
        });
        return;
    }
    logger_js_1.logger.error({ error }, "Unhandled application error");
    res.status(500).json({
        success: false,
        error: "Internal server error"
    });
};
exports.errorMiddleware = errorMiddleware;
