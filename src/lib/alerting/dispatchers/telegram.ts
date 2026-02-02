import { Alert, AlertHistory } from "@/generated/prisma/client";
import { AlertDispatcher } from "../dispatcher";

export class TelegramDispatcher implements AlertDispatcher {
    private token: string;
    private chatId: string;

    constructor() {
        this.token = process.env.TELEGRAM_BOT_TOKEN || "";
        this.chatId = process.env.TELEGRAM_CHAT_ID || "";
    }

    async dispatch(alert: Alert, history: AlertHistory): Promise<void> {
        if (!this.token || !this.chatId) {
            console.warn("[TelegramDispatcher] Missing token or chat ID. Skipping.");
            return;
        }

        const message = `🚨 *Unified Dashboard Alert*\n\n**Message:** ${history.message}\n**Value:** ${history.value}\n**Time:** ${new Date().toLocaleTimeString()}`;

        try {
            await fetch(`https://api.telegram.org/bot${this.token}/sendMessage`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    chat_id: this.chatId,
                    text: message,
                    parse_mode: "Markdown",
                }),
            });
        } catch (error) {
            console.error("[TelegramDispatcher] Failed to send message:", error);
        }
    }
}
