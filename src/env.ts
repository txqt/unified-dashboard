import { z } from "zod";

const envSchema = z.object({
    DATABASE_URL: z.string().url(),
    NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
    ENCRYPTION_KEY: z.string().min(32, "ENCRYPTION_KEY must be at least 32 characters"), // Base64 check could be added if strictly needed
    // Opional integrations
    TELEGRAM_BOT_TOKEN: z.string().optional(),
    TELEGRAM_CHAT_ID: z.string().optional(),
    CRON_SECRET: z.string().optional(),
    // Client-side vars would go here if we needed them validated on server too, 
    // but for now focusing on server secrets.
});

// Validate process.env
const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
    console.error("❌ Invalid environment variables:", JSON.stringify(parsed.error.format(), null, 2));
    throw new Error("Invalid environment variables");
}

export const env = parsed.data;
