import { IntegrationProvider } from "@prisma/client";
import { MetricFetcher, MetricNormalizer, RawMetricData, UnifiedMetricSnapshot } from "./types";
import { SentryFetcher } from "./fetchers/sentry-fetcher";
import { VercelFetcher } from "./fetchers/vercel-fetcher";
import { PostHogFetcher } from "./fetchers/posthog-fetcher";
import { StripeFetcher } from "./fetchers/stripe-fetcher";
import { IntercomFetcher } from "./fetchers/intercom-fetcher";

export class PipelineRegistry {
    private static fetchers: Record<string, MetricFetcher> = {
        [IntegrationProvider.SENTRY]: new SentryFetcher(),
        [IntegrationProvider.VERCEL]: new VercelFetcher(),
        [IntegrationProvider.POSTHOG]: new PostHogFetcher(),
        [IntegrationProvider.STRIPE]: new StripeFetcher(),
        [IntegrationProvider.INTERCOM]: new IntercomFetcher(),
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
        // Default handle generic value/count metrics
        return new GenericNormalizer();
    }
}

export class GenericNormalizer implements MetricNormalizer {
    normalize(data: RawMetricData, metricKey: string): UnifiedMetricSnapshot[] {
        const typedData = data as { value?: number; count?: number; timestamp: string; currency?: string };
        const val = typedData.value ?? typedData.count ?? 0;

        return [{
            metricKey,
            value: val,
            capturedAt: new Date(typedData.timestamp),
            metadata: typedData.currency ? { currency: typedData.currency } : undefined
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

