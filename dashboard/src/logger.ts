/**
 * Browser-compatible logger utility
 * Provides consistent logging with levels and timestamps
 * Logs to both console and local storage (persisted for file export)
 */

type LogLevel = "debug" | "info" | "warn" | "error";

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  args?: any[];
}

class Logger {
  private level: LogLevel;
  private readonly maxLogEntries: number = 1000;
  private readonly storageKey: string = "dashboard_logs";

  constructor(level: LogLevel = "info") {
    this.level = level;
  }

  private shouldLog(level: LogLevel): boolean {
    const levels: LogLevel[] = ["debug", "info", "warn", "error"];
    const currentLevelIndex = levels.indexOf(this.level);
    const messageLevelIndex = levels.indexOf(level);
    return messageLevelIndex >= currentLevelIndex;
  }

  private formatMessage(level: LogLevel, message: string): string {
    const timestamp = new Date().toISOString();
    return `[${timestamp}] [${level.toUpperCase()}]: ${message}`;
  }

  private saveToStorage(entry: LogEntry): void {
    try {
      const logs = this.getLogs();
      logs.push(entry);

      // Keep only the latest entries to avoid storage limits
      if (logs.length > this.maxLogEntries) {
        logs.splice(0, logs.length - this.maxLogEntries);
      }

      localStorage.setItem(this.storageKey, JSON.stringify(logs));
    } catch (error) {
      // If storage is full or unavailable, silently fail
      console.warn("Failed to save log to storage:", error);
    }
  }

  private log(level: LogLevel, message: string, ...args: any[]): void {
    if (!this.shouldLog(level)) {
      return;
    }

    const formattedMessage = this.formatMessage(level, message);
    const timestamp = new Date().toISOString();

    // Log to console
    switch (level) {
      case "debug":
        console.debug(formattedMessage, ...args);
        break;
      case "info":
        console.info(formattedMessage, ...args);
        break;
      case "warn":
        console.warn(formattedMessage, ...args);
        break;
      case "error":
        console.error(formattedMessage, ...args);
        break;
    }

    // Save to storage for file export
    this.saveToStorage({
      timestamp,
      level,
      message,
      args: args.length > 0 ? args : undefined,
    });
  }

  debug(message: string, ...args: any[]): void {
    this.log("debug", message, ...args);
  }

  info(message: string, ...args: any[]): void {
    this.log("info", message, ...args);
  }

  warn(message: string, ...args: any[]): void {
    this.log("warn", message, ...args);
  }

  error(message: string, ...args: any[]): void {
    this.log("error", message, ...args);
  }

  setLevel(level: LogLevel): void {
    this.level = level;
  }

  getLevel(): LogLevel {
    return this.level;
  }

  /**
   * Get all stored logs
   */
  getLogs(): LogEntry[] {
    try {
      const stored = localStorage.getItem(this.storageKey);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.warn("Failed to retrieve logs from storage:", error);
      return [];
    }
  }

  /**
   * Clear all stored logs
   */
  clearLogs(): void {
    try {
      localStorage.removeItem(this.storageKey);
    } catch (error) {
      console.warn("Failed to clear logs:", error);
    }
  }

  /**
   * Export logs as a formatted string
   */
  exportLogs(): string {
    const logs = this.getLogs();
    return logs
      .map((entry) => {
        const argsStr = entry.args ? " " + entry.args.map((arg) => JSON.stringify(arg)).join(" ") : "";
        return `[${entry.timestamp}] [${entry.level.toUpperCase()}]: ${entry.message}${argsStr}`;
      })
      .join("\n");
  }

  /**
   * Download logs as a file
   */
  downloadLogs(filename?: string): void {
    const logContent = this.exportLogs();
    const blob = new Blob([logContent], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename || `dashboard-logs-${new Date().toISOString().split("T")[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }
}

// Get log level from environment variable or default to 'info'
const logLevel = (import.meta.env.VITE_LOG_LEVEL as LogLevel) || "info";

// Create and export a singleton logger instance
const logger = new Logger(logLevel);

export default logger;
