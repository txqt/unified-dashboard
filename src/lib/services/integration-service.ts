import { prisma } from "@/lib/prisma";
import { VaultService } from "@/lib/vault";
import { IntegrationProvider, IntegrationStatus } from "@prisma/client";

export class IntegrationService {
    /**
     * input: Plain text secret (e.g. API Key)
     * action: Encrypts it, stores in Secret table, creates Integration record linked to it.
     */
    static async createIntegration({
        workspaceId,
        provider,
        secretValue,
        publicMetadata,
    }: {
        workspaceId: string;
        provider: IntegrationProvider;
        secretValue: string;
        publicMetadata?: Record<string, unknown>;
    }) {
        // 1. Encrypt the secret
        const { encryptedData, iv, authTag } = await VaultService.encrypt(secretValue);

        // 2. Transactionally save Secret and Integration
        return await prisma.$transaction(async (tx) => {
            const secret = await tx.secret.create({
                data: {
                    encryptedData: new Uint8Array(encryptedData),
                    iv: new Uint8Array(iv),
                    authTag: new Uint8Array(authTag),
                },
            });

            const integration = await tx.integration.create({
                data: {
                    workspaceId,
                    provider,
                    status: IntegrationStatus.ACTIVE,
                    secretId: secret.id,
                    // @ts-expect-error - Json in Prisma is tricky with generic records
                    publicMetadata: publicMetadata,
                },
            });

            // 3. Auto-provision default metrics
            // 3. Auto-provision default metrics
            const settings = {
                organizationSlug: (publicMetadata?.organizationSlug as string) || "",
                projectSlug: (publicMetadata?.projectSlug as string) || "",
                projectId: (publicMetadata?.projectSlug as string) || "" // Vercel/PostHog often use projectSlug as ID
            };

            const metricsToCreate: { key: string, name: string }[] = [];

            switch (provider) {
                case "SENTRY":
                    metricsToCreate.push(
                        { key: "sentry.unresolved_issues", name: "Unresolved Issues" },
                        { key: "sentry.critical_errors_24h", name: "Critical Errors" },
                        { key: "sentry.error_spike", name: "Error Spike Detection" }
                    );
                    break;
                case "VERCEL":
                    metricsToCreate.push(
                        { key: "vercel.deployment_success", name: "Production Deployment" },
                        { key: "vercel.downtime_minutes", name: "Downtime Minutes" }
                    );
                    break;
                case "POSTHOG":
                    metricsToCreate.push(
                        { key: "posthog.events_last_hour", name: "Total Events (1h)" },
                        { key: "posthog.user_signups", name: "User Signups" },
                        { key: "posthog.conversion_rate", name: "Conversion Rate" }
                    );
                    break;
                case "STRIPE":
                    metricsToCreate.push(
                        { key: "stripe.revenue", name: "Today Revenue" },
                        { key: "stripe.mrr", name: "MRR" },
                        { key: "stripe.churn", name: "Churn" },
                        { key: "stripe.new_trials", name: "New Trials" }
                    );
                    break;
                case "INTERCOM":
                    metricsToCreate.push(
                        { key: "intercom.open_tickets", name: "Open Tickets" },
                        { key: "intercom.average_reply_time", name: "Avg Reply Time" }
                    );
                    break;
            }

            for (const m of metricsToCreate) {
                await tx.metricSeries.create({
                    data: {
                        workspaceId,
                        integrationId: integration.id,
                        metricKey: m.key,
                        displayName: m.name,
                        settings: settings
                    }
                });
            }

            return integration;
        });
    }

    /**
     * Retrieves the decrypted secret for a given integration.
     * critical: Never expose this to the client. Only for internal workers.
     */
    static async getDecryptedSecret(integrationId: string): Promise<string | null> {
        const integration = await prisma.integration.findUnique({
            where: { id: integrationId },
            include: {
                // We can't include Secret directly because there's no relation in Prisma schema yet?
                // Wait, I didn't add a direct relation in schema defined in Step 68.
                // It has `secretId` String.
            },
        });

        if (!integration || !integration.secretId) {
            return null;
        }

        const secret = await prisma.secret.findUnique({
            where: { id: integration.secretId },
        });

        if (!secret) return null;

        return await VaultService.decrypt(
            Buffer.from(secret.encryptedData),
            Buffer.from(secret.iv),
            Buffer.from(secret.authTag)
        );
    }
}
