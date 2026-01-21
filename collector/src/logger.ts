import fs from "node:fs";
import path from "node:path";

import winston from "winston";

import settings from "settings";

// Ensure logs directory exists
const logsPath = path.join(settings.APP_ROOT_PATH, "logs");
if (!fs.existsSync(logsPath)) {
  fs.mkdirSync(logsPath, { recursive: true });
}

const pid = process.pid;

// Define log format for file output
const fileFormat = winston.format.combine(
  winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
  winston.format.errors({ stack: true }),
  winston.format.splat(),
  winston.format.printf((info) => {
    const { timestamp, level, message } = info;
    const stack = info.stack as string | undefined;
    if (stack) {
      return `${timestamp} [${level.toUpperCase()}] [PID:${pid}]: ${message}\n${stack}`;
    }
    return `${timestamp} [${level.toUpperCase()}] [PID:${pid}]: ${message}`;
  }),
);

// Define log format for console output (colorize must be applied last)
const consoleFormat = winston.format.combine(
  winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
  winston.format.errors({ stack: true }),
  winston.format.splat(),
  winston.format.colorize(),
  winston.format.printf((info) => {
    const { timestamp, level, message } = info;
    const stack = info.stack as string | undefined;
    if (stack) {
      return `${timestamp} [${level}] [PID:${pid}]: ${message}\n${stack}`;
    }
    return `${timestamp} [${level}] [PID:${pid}]: ${message}`;
  }),
);

// Create the logger instance
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || "info",
  transports: [
    // Console transport with colors
    new winston.transports.Console({
      format: consoleFormat,
    }),
    // File transport for all logs
    new winston.transports.File({
      filename: path.join(logsPath, "combined.log"),
      format: fileFormat,
      maxsize: 5 * 1024 * 1024, // 5MB
      maxFiles: 5,
    }),
    // File transport for errors only
    new winston.transports.File({
      filename: path.join(logsPath, "error.log"),
      level: "error",
      format: fileFormat,
      maxsize: 5 * 1024 * 1024, // 5MB
      maxFiles: 5,
    }),
  ],
});

export default logger;
