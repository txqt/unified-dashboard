import { IntegrationProvider } from "@prisma/client";

// The raw data shape returned by a provider's API
// This is untyped effectively, as every provider is different
export type RawMetricData = unknown;

// The unified snapshot shape (internal domain model)
export type UnifiedMetricSnapshot = {
    metricKey: string;
    value: number;
    capturedAt: Date;
    metadata?: Record<string, unknown>; // Extra context (e.g. error ID)
};

export interface MetricFetcher {
    fetch(
        integrationId: string,
        metricKey: string,
        settings?: unknown
    ): Promise<RawMetricData>;
}

export interface MetricNormalizer {
    normalize(
        data: RawMetricData,
        metricKey: string
    ): UnifiedMetricSnapshot | UnifiedMetricSnapshot[];
}

export interface MetricPersister {
    persist(
        seriesId: string,
        snapshots: UnifiedMetricSnapshot[]
    ): Promise<void>;
}
