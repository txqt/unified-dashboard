import { env } from "@/env";

type LogLevel = "info" | "warn" | "error" | "debug";

class Logger {
    private level: LogLevel = "info";

    constructor() {
        // Could eventually load from env, defaulting to info
    }

    private format(level: LogLevel, message: string, meta?: Record<string, unknown>) {
        return JSON.stringify({
            level,
            message,
            timestamp: new Date().toISOString(),
            environment: env.NODE_ENV,
            ...meta,
        });
    }

    info(message: string, meta?: Record<string, unknown>) {
        console.log(this.format("info", message, meta));
    }

    warn(message: string, meta?: Record<string, unknown>) {
        console.warn(this.format("warn", message, meta));
    }

    error(message: string, meta?: Record<string, unknown>) {
        console.error(this.format("error", message, meta));
    }

    debug(message: string, meta?: Record<string, unknown>) {
        if (env.NODE_ENV === "development") {
            console.debug(this.format("debug", message, meta));
        }
    }
}

export const logger = new Logger();
