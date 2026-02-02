import { Alert, AlertHistory } from "@/generated/prisma/client";
import { TelegramDispatcher } from "./dispatchers/telegram";

export interface AlertDispatcher {
    dispatch(alert: Alert, history: AlertHistory): Promise<void>;
}

export class ConsoleDispatcher implements AlertDispatcher {
    async dispatch(alert: Alert, history: AlertHistory): Promise<void> {
        console.log(`[ALERT DISPATCH] Alert ${alert.id} triggered!`);
        console.log(`Message: ${history.message}`);
        console.log(`Value: ${history.value}, Threshold: ${alert.threshold}`);
    }
}

// Registry for dispatchers
export class DispatcherRegistry {
    // In future, we might map dispatchers to user preferences or alert types
    private static dispatchers: AlertDispatcher[] = [
        new ConsoleDispatcher(),
        new TelegramDispatcher(),
    ];

    static async dispatchAll(alert: Alert, history: AlertHistory) {
        await Promise.all(
            this.dispatchers.map((d) => d.dispatch(alert, history))
        );
    }
}
