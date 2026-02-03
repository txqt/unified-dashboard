import { IntegrationService } from "@/lib/services/integration-service";
import { MetricFetcher, RawMetricData } from "../types";

type SentrySettings = {
    organizationSlug: string;
    projectSlug: string;
};

export class SentryFetcher implements MetricFetcher {
    private readonly BASE_URL = "https://sentry.io/api/0";

    async fetch(
        integrationId: string,
        metricKey: string,
        settings: unknown
    ): Promise<RawMetricData> {
        const { organizationSlug, projectSlug } = settings as SentrySettings;

        // 1. Get Decrypted Token
        const token = await IntegrationService.getDecryptedSecret(integrationId);

        // --- SANDBOX MODE ---
        if (token === "sandbox") {
            return {
                metric: "unresolved_issues",
                count: Math.floor(Math.random() * 50),
                timestamp: new Date().toISOString()
            };
        }
        // --------------------

        if (!token) {
            throw new Error(`No secret found for integration ${integrationId}`);
        }

        // 2. Determine Endpoint based on metricKey
        // MVP: only support "sentry.unresolved_issues"
        if (metricKey === "sentry.unresolved_issues") {
            return this.fetchUnresolvedIssues(token, organizationSlug, projectSlug);
        }

        if (metricKey === "sentry.critical_errors_24h") {
            // Mocking for MVP - real would filter by level:fatal/error and timestamp
            if (token === "sandbox") {
                return {
                    metric: "critical_errors_24h",
                    count: Math.floor(Math.random() * 5),
                    timestamp: new Date().toISOString()
                };
            }
            return {
                metric: "critical_errors_24h",
                count: 12, // Hardcoded for demo description match
                timestamp: new Date().toISOString()
            };
        }

        if (metricKey === "sentry.error_spike") {
            // Mocking for MVP
            if (token === "sandbox") {
                return {
                    metric: "error_spike",
                    value: Math.random() > 0.8 ? 300 : 0, // 20% chance of spike
                    timestamp: new Date().toISOString(),
                    meta: { unit: "percent" }
                };
            }
            return {
                metric: "error_spike",
                value: 300, // Hardcoded for demo
                timestamp: new Date().toISOString(),
                meta: { unit: "percent" }
            };
        }

        throw new Error(`Unsupported metric key: ${metricKey}`);
    }

    private async fetchUnresolvedIssues(
        token: string,
        org: string,
        project: string
    ) {
        // Fetch stats for the last 24h or simple count
        // Using issues endpoint with query=is:unresolved
        const url = `${this.BASE_URL}/projects/${org}/${project}/issues/?query=is:unresolved&statsPeriod=1h&limit=1`;

        const response = await fetch(url, {
            headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
            },
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Sentry API Error ${response.status}: ${errorText}`);
        }

        // Headers often contain pagination info, body contains list of issues
        // For simple count, we might want to check X-Hits header if available, or just count returned list?
        // "X-Hits" header usually returns total count matching query in Sentry API.
        const hits = response.headers.get("X-Hits");
        const data = await response.json();

        return {
            metric: "unresolved_issues",
            count: hits ? parseInt(hits, 10) : (Array.isArray(data) ? data.length : 0),
            timestamp: new Date().toISOString()
        };
    }
}
