import express from "express";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import swaggerUi from "swagger-ui-express";
import { env } from "./config/env.js";
import { errorMiddleware } from "./middleware/error.middleware.js";
import { requestLogger } from "./middleware/logger.middleware.js";
import { messageRouter } from "./routes/message.routes.js";

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
                message: "Is the villa available from April 20 to 24? What is the rate for 2 adults?",
                timestamp: "2026-05-05T10:30:00Z",
                booking_ref: "NIS-2024-0891",
                property_id: "villa-b1"
              }
            }
          }
        },
        responses: {
          "200": {
            description: "Draft reply generated",
            content: {
              "application/json": {
                example: {
                  message_id: "5b6d9f62-46a9-4f43-9f7c-e9a0b97bfc1e",
                  query_type: "pre_sales_availability",
                  drafted_reply: "Hi Rahul! Great news — Villa B1 is available from April 20 to 24...",
                  confidence_score: 0.91,
                  action: "auto_send"
                }
              }
            }
          },
          "400": { description: "Invalid payload" },
          "500": { description: "Server error" }
        }
      }
    }
  }
};

export function createApp() {
  const app = express();

  app.use(helmet());
  app.use(
    rateLimit({
      windowMs: env.RATE_LIMIT_WINDOW_MS,
      limit: env.RATE_LIMIT_MAX,
      standardHeaders: true,
      legacyHeaders: false
    })
  );
  app.use(express.json({ limit: "1mb" }));
  app.use(requestLogger);

  app.get("/health", (_req, res) => {
    res.json({ status: "ok" });
  });

  app.use("/docs", swaggerUi.serve, swaggerUi.setup(openApiDocument));
  app.use("/webhook", messageRouter);
  app.use(errorMiddleware);

  return app;
}
