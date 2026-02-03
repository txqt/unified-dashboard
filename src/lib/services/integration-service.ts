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
            if (provider === "SENTRY") {
                await tx.metricSeries.create({
                    data: {
                        workspaceId,
                        integrationId: integration.id,
                        metricKey: "sentry.unresolved_issues",
                        displayName: "Unresolved Issues",
                        settings: {
                            organizationSlug: (publicMetadata?.organizationSlug as string) || "",
                            projectSlug: (publicMetadata?.projectSlug as string) || ""
                        }
                    }
                });
            } else if (provider === "VERCEL") {
                await tx.metricSeries.create({
                    data: {
                        workspaceId,
                        integrationId: integration.id,
                        metricKey: "vercel.deployment_success",
                        displayName: "Production Deployment",
                        settings: {
                            projectId: (publicMetadata?.projectSlug as string) || ""
                        }
                    }
                });
            } else if (provider === "POSTHOG") {
                await tx.metricSeries.create({
                    data: {
                        workspaceId,
                        integrationId: integration.id,
                        metricKey: "posthog.events_last_hour",
                        displayName: "Total Events (1h)",
                        settings: {
                            projectId: (publicMetadata?.projectSlug as string) || ""
                        }
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
