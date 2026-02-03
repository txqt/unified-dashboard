import { NextResponse } from "next/server";
import { PipelineWorker } from "@/lib/pipeline/worker";

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const worker = new PipelineWorker();
        const result = await worker.runSync();
        return NextResponse.json({ success: true, result });
    } catch (error) {
        return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
    }
}
