import { prisma } from "@/lib/prisma";
import { Integration, IntegrationStatus, MetricSeries } from "@prisma/client";
import { PipelineRegistry } from "./registry";
import { PrismaMetricPersister } from "./persister";
import { logger } from "@/lib/logger";

type SeriesWithIntegration = MetricSeries & { integration: Integration };

export class PipelineWorker {
    private persister = new PrismaMetricPersister();
    private readonly BATCH_SIZE = 20;

    async runSync() {
        logger.info("[Pipeline] Starting sync...");

        // 1. Fetch active metric series WITH nested integration data
        // Optimization: Fetch everything needed in one go instead of N+1 SELECTs
        const allSeries = await prisma.metricSeries.findMany({
            where: {
                integration: {
                    status: IntegrationStatus.ACTIVE,
                },
            },
            include: {
                integration: true,
            },
        });

        logger.info(`[Pipeline] Found ${allSeries.length} series to process.`);

        const results: PromiseSettledResult<{ seriesId: string; status: string; count: number; }>[] = [];

        // 2. Process in batches
        for (let i = 0; i < allSeries.length; i += this.BATCH_SIZE) {
            const batch = allSeries.slice(i, i + this.BATCH_SIZE);
            logger.info(`[Pipeline] Processing batch ${Math.floor(i / this.BATCH_SIZE) + 1}/${Math.ceil(allSeries.length / this.BATCH_SIZE)}...`);

            const batchResults = await Promise.allSettled(
                batch.map(async (series) => {
                    return this.processSeries(series);
                })
            );
            results.push(...batchResults);
        }

        const summary = {
            total: results.length,
            success: results.filter(r => r.status === "fulfilled").length,
            failed: results.filter(r => r.status === "rejected").length
        };

        logger.info("[Pipeline] Sync complete.", summary);
        return summary;
    }

    // Now accepts the full series object, avoiding a DB call
    private async processSeries(series: SeriesWithIntegration) {
        try {
            // No need to fetch series again here!
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
            logger.error(`[Pipeline] Error processing series ${series.id}:`, { error: String(error) });
            throw error;
        }
    }
}
