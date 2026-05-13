"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.requestLogger = void 0;
const pino_http_1 = __importDefault(require("pino-http"));
const logger_js_1 = require("../utils/logger.js");
exports.requestLogger = (0, pino_http_1.default)({
    logger: logger_js_1.logger,
    serializers: {
        req(req) {
            return {
                id: req.id,
                method: req.method,
                url: req.url
            };
        }
    }
});
