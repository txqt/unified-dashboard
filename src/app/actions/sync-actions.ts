"use server";

import { PipelineWorker } from "@/lib/pipeline/worker";
import { revalidatePath } from "next/cache";
import { auth } from "@clerk/nextjs/server";

export async function triggerSync() {
    const { userId } = await auth();
    if (!userId) {
        throw new Error("Unauthorized");
    }

    try {
        console.log("[SyncAction] Triggering manual sync for user:", userId);
        const worker = new PipelineWorker();
        const summary = await worker.runSync();

        console.log("[SyncAction] Sync complete:", summary);
        revalidatePath("/dashboard");
        return { success: true, summary };
    } catch (error) {
        console.error("[SyncAction] Failed to sync:", error);
        return { success: false, error: String(error) };
    }
}
