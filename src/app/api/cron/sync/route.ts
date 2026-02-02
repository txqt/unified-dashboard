import { NextResponse } from "next/server";
import { PipelineWorker } from "@/lib/pipeline/worker";

export const dynamic = "force-dynamic"; // Ensure not cached

export async function GET(request: Request) {
    // Simple auth check for Cron
    const authHeader = request.headers.get("authorization");
    if (
        process.env.CRON_SECRET &&
        authHeader !== `Bearer ${process.env.CRON_SECRET}`
    ) {
        return new NextResponse("Unauthorized", { status: 401 });
    }

    const worker = new PipelineWorker();
    try {
        const summary = await worker.runSync();
        return NextResponse.json({ success: true, summary });
    } catch (error) {
        console.error("Cron Job Failed:", error);
        return NextResponse.json(
            { success: false, error: String(error) },
            { status: 500 }
        );
    }
}
