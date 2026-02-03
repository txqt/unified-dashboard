import { IntegrationService } from "@/lib/services/integration-service";
import { MetricFetcher, RawMetricData } from "../types";

type StripeSettings = {
    accountId?: string; // Optional: for Connect platforms
};

export class StripeFetcher implements MetricFetcher {
    private readonly BASE_URL = "https://api.stripe.com/v1";

    async fetch(
        integrationId: string,
        metricKey: string,
        settings: unknown
    ): Promise<RawMetricData> {
        // 1. Get Decrypted Token
        const token = await IntegrationService.getDecryptedSecret(integrationId);

        // --- SANDBOX MODE ---
        if (token === "sandbox") {
            return this.getSandboxData(metricKey);
        }
        // --------------------

        if (!token) {
            throw new Error(`No secret found for integration ${integrationId}`);
        }

        switch (metricKey) {
            case "stripe.mrr":
            case "stripe.revenue":
            case "stripe.churn":
            case "stripe.new_trials":
                return this.fetchRevenue(token, metricKey);
            default:
                throw new Error(`Unsupported metric key: ${metricKey}`);
        }
    }

    private getSandboxData(metricKey: string): RawMetricData {
        const baseRevenue = 5000 + Math.floor(Math.random() * 2000); // Random $5000-$7000

        if (metricKey === "stripe.mrr") {
            return {
                metric: "mrr",
                value: baseRevenue,
                currency: "usd",
                timestamp: new Date().toISOString()
            };
        } else if (metricKey === "stripe.churn") {
            return {
                metric: "churn",
                value: Math.floor(Math.random() * 3), // 0-2 users
                timestamp: new Date().toISOString()
            };
        } else if (metricKey === "stripe.new_trials") {
            return {
                metric: "new_trials",
                value: Math.floor(Math.random() * 10), // 0-9 users
                timestamp: new Date().toISOString()
            };
        } else {
            return {
                metric: "revenue",
                value: baseRevenue * 12, // Annualized roughly
                currency: "usd",
                timestamp: new Date().toISOString()
            };
        }
    }

    private async fetchRevenue(token: string, metricKey: string) {
        // Fetch Balance (Proxy for revenue/cash on hand for MVP)
        // Real MRR calculation requires Subscription API analysis which is complex.
        // For MVP, we'll just check "Balance" or "Payouts" or calculate from recent charges.
        // Let's use Balance for simplicity as "Current Available".

        if (metricKey === "stripe.churn" || metricKey === "stripe.new_trials") {
            // Mocking these for now as they require complex subscription analysis
            return {
                metric: metricKey.replace("stripe.", ""),
                value: metricKey === "stripe.churn" ? 1 : 7, // Fixed mock values for live api (mvp)
                currency: "usd",
                timestamp: new Date().toISOString()
            };
        }

        const url = `${this.BASE_URL}/balance`;

        const response = await fetch(url, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Stripe API Error ${response.status}: ${errorText}`);
        }

        const data = await response.json();

        // available[0].amount is in cents
        const available = data.available?.[0];
        const amount = available ? available.amount / 100 : 0; // Convert to dollars/main currency unit
        const currency = available ? available.currency : "usd";

        return {
            metric: metricKey.replace("stripe.", ""),
            value: amount,
            currency: currency,
            timestamp: new Date().toISOString()
        };
    }
}
