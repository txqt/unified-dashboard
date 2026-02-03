import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { IntegrationProvider } from "@prisma/client";

export async function GET() {
    try {
        const integrations = await prisma.integration.findMany({
            include: { metricSeries: true }
        });

        const results = [];

        for (const integration of integrations) {
            const missingMetrics: { key: string, name: string }[] = [];
            const existingKeys = new Set(integration.metricSeries.map(s => s.metricKey));

            switch (integration.provider) {
                case "SENTRY":
                    if (!existingKeys.has("sentry.unresolved_issues")) missingMetrics.push({ key: "sentry.unresolved_issues", name: "Unresolved Issues" });
                    if (!existingKeys.has("sentry.critical_errors_24h")) missingMetrics.push({ key: "sentry.critical_errors_24h", name: "Critical Errors" });
                    if (!existingKeys.has("sentry.error_spike")) missingMetrics.push({ key: "sentry.error_spike", name: "Error Spike Detection" });
                    break;
                case "VERCEL":
                    if (!existingKeys.has("vercel.deployment_success")) missingMetrics.push({ key: "vercel.deployment_success", name: "Production Deployment" });
                    if (!existingKeys.has("vercel.downtime_minutes")) missingMetrics.push({ key: "vercel.downtime_minutes", name: "Downtime Minutes" });
                    break;
                case "POSTHOG":
                    if (!existingKeys.has("posthog.events_last_hour")) missingMetrics.push({ key: "posthog.events_last_hour", name: "Total Events (1h)" });
                    if (!existingKeys.has("posthog.user_signups")) missingMetrics.push({ key: "posthog.user_signups", name: "User Signups" });
                    if (!existingKeys.has("posthog.conversion_rate")) missingMetrics.push({ key: "posthog.conversion_rate", name: "Conversion Rate" });
                    break;
                case "STRIPE":
                    if (!existingKeys.has("stripe.revenue")) missingMetrics.push({ key: "stripe.revenue", name: "Today Revenue" });
                    if (!existingKeys.has("stripe.mrr")) missingMetrics.push({ key: "stripe.mrr", name: "MRR" });
                    if (!existingKeys.has("stripe.churn")) missingMetrics.push({ key: "stripe.churn", name: "Churn" });
                    if (!existingKeys.has("stripe.new_trials")) missingMetrics.push({ key: "stripe.new_trials", name: "New Trials" });
                    break;
                case "INTERCOM":
                    if (!existingKeys.has("intercom.open_tickets")) missingMetrics.push({ key: "intercom.open_tickets", name: "Open Tickets" });
                    if (!existingKeys.has("intercom.average_reply_time")) missingMetrics.push({ key: "intercom.average_reply_time", name: "Avg Reply Time" });
                    break;
            }

            for (const m of missingMetrics) {
                await prisma.metricSeries.create({
                    data: {
                        workspaceId: integration.workspaceId,
                        integrationId: integration.id,
                        metricKey: m.key,
                        displayName: m.name,
                        settings: {} // Use defaults or infer from integration metadata if complex
                    }
                });
            }
            results.push({ id: integration.id, provider: integration.provider, added: missingMetrics.map(m => m.key) });
        }

        return NextResponse.json({ success: true, results });
    } catch (e) {
        return NextResponse.json({ success: false, error: String(e) });
    }
}
