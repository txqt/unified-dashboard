import { IntegrationService } from "@/lib/services/integration-service";
import { MetricFetcher, RawMetricData } from "../types";

export class IntercomFetcher implements MetricFetcher {
    private readonly BASE_URL = "https://api.intercom.io";

    async fetch(
        integrationId: string,
        metricKey: string,
        settings: unknown
    ): Promise<RawMetricData> {
        // 1. Get Decrypted Token
        const token = await IntegrationService.getDecryptedSecret(integrationId);

        // --- SANDBOX MODE ---
        if (token === "sandbox") {
            return {
                metric: "open_tickets",
                count: Math.floor(Math.random() * 20), // 0-20 open tickets
                timestamp: new Date().toISOString()
            };
        }
        // --------------------

        if (!token) {
            throw new Error(`No secret found for integration ${integrationId}`);
        }

        if (metricKey === "intercom.open_tickets") {
            return this.fetchOpenTickets(token);
        }

        throw new Error(`Unsupported metric key: ${metricKey}`);
    }

    private async fetchOpenTickets(token: string) {
        // Search for conversations where state is 'open'
        const url = `${this.BASE_URL}/conversations/search`;

        const response = await fetch(url, {
            method: "POST",
            headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
                "Accept": "application/json"
            },
            body: JSON.stringify({
                query: {
                    field: "state",
                    operator: "=",
                    value: "open"
                }
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Intercom API Error ${response.status}: ${errorText}`);
        }

        const data = await response.json();
        const total = data.total_count || 0;

        return {
            metric: "open_tickets",
            count: total,
            timestamp: new Date().toISOString()
        };
    }
}
