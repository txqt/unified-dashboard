import { IntegrationService } from "@/lib/services/integration-service";
import { MetricFetcher, RawMetricData } from "../types";

type VercelSettings = {
    projectId: string; // Vercel Project ID
};

export class VercelFetcher implements MetricFetcher {
    private readonly BASE_URL = "https://api.vercel.com/v6";

    async fetch(
        integrationId: string,
        metricKey: string,
        settings: unknown
    ): Promise<RawMetricData> {
        const { projectId } = settings as VercelSettings;

        // 1. Get Decrypted Token
        const token = await IntegrationService.getDecryptedSecret(integrationId);

        // --- SANDBOX MODE ---
        if (token === "sandbox") {
            return {
                metric: "deployment_success",
                value: 1, // Always success in sandbox
                meta: { readyState: "READY", url: "https://sandbox-preview.vercel.app" },
                timestamp: new Date().toISOString(),
            };
        }

        if (token === "sandbox" && metricKey === "vercel.downtime_minutes") {
            return {
                metric: "downtime_minutes",
                value: 0,
                timestamp: new Date().toISOString(),
                meta: { unit: "minutes" }
            };
        }
        // --------------------

        if (!token) {
            throw new Error(`No secret found for integration ${integrationId}`);
        }

        if (metricKey === "vercel.deployment_success") {
            return this.fetchDeploymentStatus(token, projectId);
        }

        if (metricKey === "vercel.downtime_minutes") {
            // Mock: Vercel doesn't give "downtime" directly. We assume 0 if latest deployment is READY.
            return this.fetchDowntime(token, projectId);
        }

        throw new Error(`Unsupported metric key: ${metricKey}`);
    }

    private async fetchDeploymentStatus(token: string, projectId: string) {
        // Fetch latest deployment
        const url = `${this.BASE_URL}/deployments?projectId=${projectId}&limit=1`;

        const response = await fetch(url, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Vercel API Error ${response.status}: ${errorText}`);
        }

        const data = await response.json();
        const deployments = data.deployments || [];
        const latest = deployments[0];

        return {
            metric: "deployment_success",
            value: latest?.readyState === "READY" ? 1 : 0, // 1 = Success, 0 = Failed/Building
            meta: {
                readyState: latest?.readyState,
                url: latest?.url,
            },
            timestamp: latest?.created ? new Date(latest.created).toISOString() : new Date().toISOString(),
        };
    }
    private async fetchDowntime(token: string, projectId: string) {
        // Proxy for downtime: If latest deployment is ERROR, counting minutes since created?
        // True "Downtime" requires external monitoring (cron/uptime robot).
        // For MVP Use Case: Return 0.
        return {
            metric: "downtime_minutes",
            value: 0,
            timestamp: new Date().toISOString(),
            meta: { unit: "minutes" }
        };
    }
}
