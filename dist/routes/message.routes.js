"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.messageRouter = void 0;
const express_1 = require("express");
const message_controller_js_1 = require("../controllers/message.controller.js");
exports.messageRouter = (0, express_1.Router)();
exports.messageRouter.post("/message", message_controller_js_1.handleInboundMessage);
