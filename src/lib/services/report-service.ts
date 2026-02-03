import { prisma } from "@/lib/prisma";
import { IntegrationProvider } from "@prisma/client";

export class ReportService {
    /**
     * Generates and sends (mocks) a weekly report for a specific workspace.
     */
    static async sendWeeklyReport(workspaceId: string) {
        // 1. Fetch Workspace & Integrations
        const workspace = await prisma.workspace.findUnique({
            where: { id: workspaceId },
            include: {
                metricSeries: {
                    include: {
                        snapshots: {
                            orderBy: { capturedAt: 'desc' },
                            take: 2 // Take 2 to calculate trend
                        },
                        integration: true
                    }
                }
            }
        });

        if (!workspace) throw new Error("Workspace not found");

        // 2. Aggregate Data
        const getMetricData = (key: string) => {
            const series = workspace.metricSeries.find(s => s.metricKey === key);
            if (!series) return null;

            const current = series.snapshots[0];
            const previous = series.snapshots[1];

            let changePercent = 0;
            if (current && previous && previous.value !== 0) {
                changePercent = ((current.value - previous.value) / previous.value) * 100;
            }

            return {
                value: current?.value ?? 0,
                change: changePercent,
                hasData: !!current
            };
        };

        const revenue = getMetricData("stripe.revenue");
        const errors = getMetricData("sentry.unresolved_issues");
        const support = getMetricData("intercom.open_tickets");
        const traffic = getMetricData("posthog.events_last_hour"); // proxy for traffic

        // 3. Generate HTML Content
        const html = `
            <div style="font-family: sans-serif; max-w-600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px;">
                <h1 style="color: #4F46E5;">State of Your SaaS 🚀</h1>
                <p>Weekly report for <strong>${workspace.name}</strong></p>
                <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />
                
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
                    ${this.renderMetricHtml("💰 Revenue", revenue?.value, revenue?.change, "$")}
                    ${this.renderMetricHtml("🐛 Critical Errors", errors?.value, errors?.change, "", true)}
                    ${this.renderMetricHtml("💬 Support Tickets", support?.value, support?.change, "", true)}
                    ${this.renderMetricHtml("📈 Traffic (1h)", traffic?.value, traffic?.change)}
                </div>

                <div style="margin-top: 30px; padding: 15px; background: #f9fafb; border-radius: 8px; text-align: center;">
                    <a href="http://localhost:3000/dashboard" style="color: #4F46E5; text-decoration: none; font-weight: bold;">View Full Dashboard &rarr;</a>
                </div>
            </div>
        `;

        // 4. "Send" Email (Mock)
        console.log(`[EMAIL SENT] To: owner@${workspace.slug}.com`);
        console.log(`[EMAIL JOB] Generating report for ${workspace.name}...`);
        // In real app: await resend.emails.send({ ... })

        return { success: true, preview: html };
    }

    private static renderMetricHtml(title: string, value: number | undefined, change: number | undefined, prefix = "", inverse = false) {
        if (value === undefined) return "";

        let color = "gray";
        let arrow = "•";

        if (change && change !== 0) {
            const isGood = inverse ? change < 0 : change > 0;
            color = isGood ? "green" : "red";
            arrow = change > 0 ? "↑" : "↓";
        }

        const valueStr = prefix + value.toLocaleString();
        const changeStr = change ? `${arrow} ${Math.abs(change).toFixed(1)}%` : "-";

        return `
            <div style="padding: 15px; background: #fff; border: 1px solid #eee; border-radius: 8px;">
                <div style="font-size: 14px; color: #666;">${title}</div>
                <div style="font-size: 24px; font-weight: bold; margin: 5px 0;">${valueStr}</div>
                <div style="font-size: 12px; color: ${color};">${changeStr} vs last week</div>
            </div>
        `;
    }
}
