import { Router } from "express";
import { handleInboundMessage } from "../controllers/message.controller.js";

export const messageRouter = Router();

messageRouter.post("/message", handleInboundMessage);
