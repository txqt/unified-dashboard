import { prisma } from "@/lib/prisma";
import { EmailService } from "@/lib/email/email-service";
import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        // 1. Authenticate (optional: could be a cron secret for automation)
        const { userId } = await auth();

        // Allow if userId exists OR if a specific cron secret matches (omitted for MVP)
        if (!userId && process.env.NODE_ENV === 'production') {
            // allow build to pass - return 200 but with unauthorized message
            return NextResponse.json({ message: "Unauthorized (No Session)" }, { status: 401 });
        }

        if (!userId) {
            // For dev/test manual trigger
            // Just return a message instead of failing hard during build static generation attempts
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        // 2. Mock: Get data for the first workspace of the user (or all if cron)
        const member = await prisma.workspaceMember.findFirst({
            where: { userId: userId },
            include: { workspace: true }
        });

        if (!member) {
            return NextResponse.json({ message: "No workspace found" });
        }

        const workspaceId = member.workspaceId;

        // 3. Fetch latest metrics for this workspace
        const series = await prisma.metricSeries.findMany({
            where: { workspaceId },
            include: {
                snapshots: {
                    orderBy: { capturedAt: 'desc' },
                    take: 1
                }
            }
        });

        const getVal = (key: string) => series.find(s => s.metricKey === key)?.snapshots[0]?.value || 0;

        const metrics = {
            revenue: getVal("stripe.revenue"),
            mrr: getVal("stripe.mrr"),
            errors: getVal("sentry.critical_errors_24h") || getVal("sentry.unresolved_issues"),
            traffic: getVal("posthog.events_last_hour"),
            signups: getVal("posthog.user_signups")
        };

        // 4. Send Email
        const userEmail = "test@example.com";

        await EmailService.sendWeeklyReport(userEmail, member.workspace.name, metrics);

        return NextResponse.json({ success: true, message: "Report sent to console (or email if configured)" });

    } catch (error) {
        console.error("Cron Error:", error);
        return NextResponse.json({ success: false, error: String(error) }, { status: 200 });
    }
}
