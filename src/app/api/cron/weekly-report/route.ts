import { ReportService } from "@/lib/services/report-service";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
    // Basic auth protection (e.g. check for a query param or header)
    // For Vercel Cron, usually checks 'Authorization' header "Bearer ${CRON_SECRET}"
    // For MVP, allow open access or just a simple check

    // Fetch all workspaces
    const workspaces = await prisma.workspace.findMany();

    const results = [];

    for (const workspace of workspaces) {
        try {
            const res = await ReportService.sendWeeklyReport(workspace.id);
            results.push({ workspace: workspace.slug, status: "sent", preview: res.preview });
        } catch (error) {
            console.error(`Failed to send report for ${workspace.slug}`, error);
            results.push({ workspace: workspace.slug, status: "failed", error: String(error) });
        }
    }

    return NextResponse.json({ success: true, results });
}
