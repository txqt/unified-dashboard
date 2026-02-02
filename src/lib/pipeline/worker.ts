import { prisma } from "@/lib/prisma";
import { IntegrationStatus } from "@prisma/client";
import { PipelineRegistry } from "./registry";
import { PrismaMetricPersister } from "./persister";

export class PipelineWorker {
    private persister = new PrismaMetricPersister();

    async runSync() {
        console.log("[Pipeline] Starting sync...");

        // 1. Fetch active metric series
        const seriesList = await prisma.metricSeries.findMany({
            where: {
                integration: {
                    status: IntegrationStatus.ACTIVE,
                },
            },
            include: {
                integration: true,
            },
        });

        console.log(`[Pipeline] Found ${seriesList.length} series into process.`);

        const results = await Promise.allSettled(
            seriesList.map(async (series) => {
                try {
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
                    console.error(`[Pipeline] Error processing series ${series.id}:`, error);
                    throw error;
                }
            })
        );

        const summary = {
            total: results.length,
            success: results.filter(r => r.status === "fulfilled").length,
            failed: results.filter(r => r.status === "rejected").length
        };

        console.log("[Pipeline] Sync complete.", summary);
        return summary;
    }
}
