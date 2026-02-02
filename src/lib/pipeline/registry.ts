import { IntegrationProvider } from "@/generated/prisma/client";
import { MetricFetcher, MetricNormalizer, RawMetricData, UnifiedMetricSnapshot } from "./types";
import { SentryFetcher } from "./fetchers/sentry-fetcher";
import { VercelFetcher } from "./fetchers/vercel-fetcher";
import { PostHogFetcher } from "./fetchers/posthog-fetcher";

export class PipelineRegistry {
    private static fetchers: Record<string, MetricFetcher> = {
        [IntegrationProvider.SENTRY]: new SentryFetcher(),
        [IntegrationProvider.VERCEL]: new VercelFetcher(),
        [IntegrationProvider.POSTHOG]: new PostHogFetcher(),
    };

    static getFetcher(provider: IntegrationProvider): MetricFetcher {
        const fetcher = this.fetchers[provider];
        if (!fetcher) throw new Error(`No fetcher found for provider ${provider}`);
        return fetcher;
    }

    static getNormalizer(provider: IntegrationProvider): MetricNormalizer {
        if (provider === IntegrationProvider.VERCEL) {
            return new VercelNormalizer();
        }
        if (provider === IntegrationProvider.POSTHOG) {
            return new PostHogNormalizer();
        }
        return new SentryNormalizer();
    }
}

export class SentryNormalizer implements MetricNormalizer {
    normalize(data: RawMetricData, metricKey: string): UnifiedMetricSnapshot[] {
        const typedData = data as { count: number; timestamp: string };

        return [{
            metricKey,
            value: typedData.count,
            capturedAt: new Date(typedData.timestamp),
        }];
    }
}

export class VercelNormalizer implements MetricNormalizer {
    normalize(data: RawMetricData, metricKey: string): UnifiedMetricSnapshot[] {
        const typedData = data as { value: number; timestamp: string; meta: Record<string, unknown> };

        return [{
            metricKey,
            value: typedData.value,
            capturedAt: new Date(typedData.timestamp),
            metadata: typedData.meta
        }];
    }
}

export class PostHogNormalizer implements MetricNormalizer {
    normalize(data: RawMetricData, metricKey: string): UnifiedMetricSnapshot[] {
        const typedData = data as { value: number; timestamp: string };

        return [{
            metricKey,
            value: typedData.value,
            capturedAt: new Date(typedData.timestamp),
        }];
    }
}
