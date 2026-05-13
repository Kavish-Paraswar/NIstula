import type { ErrorRequestHandler } from "express";
import { ZodError } from "zod";
import { logger } from "../utils/logger.js";

export class AppError extends Error {
  constructor(
    public readonly statusCode: number,
    message: string
  ) {
    super(message);
  }
}

export const errorMiddleware: ErrorRequestHandler = (error, _req, res, _next) => {
  if (error instanceof ZodError) {
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

  logger.error({ error }, "Unhandled application error");

  res.status(500).json({
    success: false,
    error: "Internal server error"
  });
};
