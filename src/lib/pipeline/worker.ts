import { prisma } from "@/lib/prisma";
import { IntegrationStatus } from "@prisma/client";
import { PipelineRegistry } from "./registry";
import { PrismaMetricPersister } from "./persister";

export class PipelineWorker {
    private persister = new PrismaMetricPersister();
    private readonly BATCH_SIZE = 20;

    async runSync() {
        console.log("[Pipeline] Starting sync...");

        // 1. Fetch active metric series IDs only (lighter query)
        const seriesIds = await prisma.metricSeries.findMany({
            where: {
                integration: {
                    status: IntegrationStatus.ACTIVE,
                },
            },
            select: { id: true },
        });

        console.log(`[Pipeline] Found ${seriesIds.length} series to process.`);

        const results: PromiseSettledResult<{ seriesId: string; status: string; count: number; }>[] = [];

        // 2. Process in batches
        for (let i = 0; i < seriesIds.length; i += this.BATCH_SIZE) {
            const batch = seriesIds.slice(i, i + this.BATCH_SIZE);
            console.log(`[Pipeline] Processing batch ${Math.floor(i / this.BATCH_SIZE) + 1}/${Math.ceil(seriesIds.length / this.BATCH_SIZE)}...`);

            const batchResults = await Promise.allSettled(
                batch.map(async ({ id }) => {
                    return this.processSeries(id);
                })
            );
            results.push(...batchResults);
        }

        const summary = {
            total: results.length,
            success: results.filter(r => r.status === "fulfilled").length,
            failed: results.filter(r => r.status === "rejected").length
        };

        console.log("[Pipeline] Sync complete.", summary);
        return summary;
    }

    private async processSeries(seriesId: string) {
        try {
            // Fetch full details for this single series
            const series = await prisma.metricSeries.findUnique({
                where: { id: seriesId },
                include: { integration: true }
            });

            if (!series) throw new Error(`Series ${seriesId} not found`);

            const { integration, metricKey, settings } = series;
            const provider = integration.provider;

            // 2. Get Fetcher & Normalizer
            const fetcher = PipelineRegistry.getFetcher(provider);
            const normalizer = PipelineRegistry.getNormalizer(provider);

            // 3. Pipeline Execution
            // A. Fetch
            const rawData = await fetcher.fetch(integration.id, metricKey, settings);

            // B. Normalize
            const result = normalizer.normalize(rawData, metricKey);
            const snapshots = Array.isArray(result) ? result : [result];

            // C. Persist
            await this.persister.persist(series.id, snapshots);

            return { seriesId: series.id, status: "success", count: snapshots.length };
        } catch (error) {
            console.error(`[Pipeline] Error processing series ${seriesId}:`, error);
            throw error;
        }
    }
}
