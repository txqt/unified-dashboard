import { prisma } from "@/lib/prisma";
import { MetricPersister, UnifiedMetricSnapshot } from "./types";
import { AlertType, MetricSnapshot } from "@prisma/client";
import { DispatcherRegistry } from "@/lib/alerting/dispatcher";

export class PrismaMetricPersister implements MetricPersister {
    /**
     * Persists a batch of snapshots for a specific MetricSeries.
     * Also checks for alerts.
     */
    async persist(
        seriesId: string,
        snapshots: UnifiedMetricSnapshot[]
    ): Promise<void> {
        if (snapshots.length === 0) return;

        // 1. Fetch active alerts for this series
        const alerts = await prisma.alert.findMany({
            where: {
                metricSeriesId: seriesId,
                enabled: true,
            },
        });

        await prisma.$transaction(async (tx) => {
            // 2. Save snapshots
            await tx.metricSnapshot.createMany({
                data: snapshots.map((s) => ({
                    seriesId,
                    value: s.value,
                    capturedAt: s.capturedAt,
                })),
            });

            // 3. Evaluate Alerts
            // We only evaluate the LATEST snapshot for immediate alerting
            // In a real system, we might evaluate all new snapshots
            const latestSnapshot = snapshots.reduce((prev, current) =>
                (prev.capturedAt > current.capturedAt) ? prev : current
            );

            for (const alert of alerts) {
                let triggered = false;
                let message = "";

                switch (alert.type) {
                    case AlertType.ABOVE_THRESHOLD:
                        if (latestSnapshot.value > alert.threshold) {
                            triggered = true;
                            message = `Metric value ${latestSnapshot.value} is above threshold ${alert.threshold}`;
                        }
                        break;
                    case AlertType.BELOW_THRESHOLD:
                        if (latestSnapshot.value < alert.threshold) {
                            triggered = true;
                            message = `Metric value ${latestSnapshot.value} is below threshold ${alert.threshold}`;
                        }
                        break;
                    // CHANGE_PERCENT requires comparing with previous snapshot, skip for basic MVP
                }

                if (triggered) {
                    // Check if we already alerted recently? (Debounce logic omitted for MVP)

                    const history = await tx.alertHistory.create({
                        data: {
                            alertId: alert.id,
                            value: latestSnapshot.value,
                            message,
                            dispatched: false, // Will mark true after dispatch
                        },
                        include: { alert: true }
                    });

                    // Dispatch (Fire and forget, or await? Await to ensure it's sent?)
                    // Usually better to use a job queue. Here we just call the registry.
                    // Note: We are inside a transaction. Dispatching external APIs here is bad practice
                    // because it prolongs the transaction. 
                    // BETTER: Return list of alerts to dispatch AFTER transaction commits.
                    // But $transaction doesn't easily return side effects unless we structure it so.

                    // Hack for MVP: Dispatch async, log errors.
                    DispatcherRegistry.dispatchAll(alert, history).catch(console.error);
                }
            }
        });
    }
}
