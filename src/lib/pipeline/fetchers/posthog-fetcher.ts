import { IntegrationService } from "@/lib/services/integration-service";
import { MetricFetcher, RawMetricData } from "../types";

type PostHogSettings = {
    projectId: string;
    host?: string; // Default: app.posthog.com
};

export class PostHogFetcher implements MetricFetcher {
    async fetch(
        integrationId: string,
        metricKey: string,
        settings: unknown
    ): Promise<RawMetricData> {
        const { projectId, host = "https://app.posthog.com" } = settings as PostHogSettings;

        // 1. Get Decrypted Token
        const token = await IntegrationService.getDecryptedSecret(integrationId);

        // --- SANDBOX MODE ---
        if (token === "sandbox") {
            return {
                metric: "events_last_hour",
                value: Math.floor(Math.random() * 1000),
                timestamp: new Date().toISOString(),
            };
        }
        // --------------------

        if (!token) {
            throw new Error(`No secret found for integration ${integrationId}`);
        }

        if (metricKey === "posthog.events_last_hour") {
            return this.fetchEventsCount(token, projectId, host);
        }

        if (metricKey === "posthog.user_signups") {
            return this.fetchUserSignups(token, projectId, host);
        }

        throw new Error(`Unsupported metric key: ${metricKey}`);
    }

    private async fetchEventsCount(token: string, projectId: string, host: string) {
        // Use HogQL to get precise count
        const url = `${host}/api/projects/${projectId}/query/`;

        const query = {
            kind: "HogQLQuery",
            query: "select count() from events where timestamp > now() - interval 1 hour"
        };

        const response = await fetch(url, {
            method: "POST",
            headers: {
                Authorization: `Bearer ${token}`, // Personal API Key
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ query })
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`PostHog API Error ${response.status}: ${errorText}`);
        }

        const data = await response.json();
        // data.results is usually [[count]]
        const count = data.results?.[0]?.[0] ?? 0;

        return {
            metric: "events_last_hour",
            value: Number(count),
            timestamp: new Date().toISOString(),
        };
    }

    private async fetchUserSignups(token: string, projectId: string, host: string) {
        // Count 'User Signed Up' events in last 24h
        const url = `${host}/api/projects/${projectId}/query/`;

        const query = {
            kind: "HogQLQuery",
            query: "select count() from events where event = 'User Signed Up' and timestamp > now() - interval 24 hour"
        };

        const response = await fetch(url, {
            method: "POST",
            headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ query })
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`PostHog API Error ${response.status}: ${errorText}`);
        }

        const data = await response.json();
        const count = data.results?.[0]?.[0] ?? 0;

        return {
            metric: "user_signups",
            value: Number(count),
            timestamp: new Date().toISOString(),
        };
    }
}
