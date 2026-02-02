import { prisma } from "../src/lib/prisma";
import { VaultService } from "../src/lib/vault";
import { IntegrationProvider, IntegrationStatus } from "../src/generated/prisma/client";

// MOCK DATA GENERATOR
async function main() {
    console.log("🚀 Starting Load Test Seeding...");

    // 1. Create 10 Workspaces
    console.log("Creating 10 Workspaces...");
    const workspaceIds: string[] = [];
    for (let i = 0; i < 10; i++) {
        const ws = await prisma.workspace.create({
            data: {
                name: `Load Test Workspace ${i}`,
                slug: `load-test-ws-${i}-${Date.now()}`,
            },
        });
        workspaceIds.push(ws.id);
    }

    // 2. Add Integrations to each
    console.log("Adding Integrations & Metrics...");
    const { encryptedData, iv, authTag } = await VaultService.encrypt("mock_token_123");

    // Create a reusable mock secret
    const secret = await prisma.secret.create({
        data: {
            encryptedData: new Uint8Array(encryptedData),
            iv: new Uint8Array(iv),
            authTag: new Uint8Array(authTag)
        },
    });

    for (const wsId of workspaceIds) {
        // Add Sentry
        const sentry = await prisma.integration.create({
            data: {
                workspaceId: wsId,
                provider: IntegrationProvider.SENTRY,
                status: IntegrationStatus.ACTIVE,
                secretId: secret.id,
                publicMetadata: { org: "demo", project: "demo-project" },
            },
        });

        // Add Series
        await prisma.metricSeries.create({
            data: {
                workspaceId: wsId,
                integrationId: sentry.id,
                metricKey: "sentry.unresolved_issues",
                displayName: "Sentry Issues",
                settings: { organizationSlug: "demo", projectSlug: "demo" },
            },
        });

        // Add Vercel
        const vercel = await prisma.integration.create({
            data: {
                workspaceId: wsId,
                provider: IntegrationProvider.VERCEL,
                status: IntegrationStatus.ACTIVE,
                secretId: secret.id,
            },
        });

        await prisma.metricSeries.create({
            data: {
                workspaceId: wsId,
                integrationId: vercel.id,
                metricKey: "vercel.deployment_success",
                displayName: "Production Status",
                settings: { projectId: "prj_123" },
            },
        });
    }

    // 3. Generate 1000 snapshots per series (history)
    console.log("Generating history (this may take a moment)...");
    const allSeries = await prisma.metricSeries.findMany();

    const snapshotData = [];
    const now = new Date();

    for (const series of allSeries) {
        for (let d = 0; d < 30; d++) { // 30 days history
            snapshotData.push({
                seriesId: series.id,
                value: Math.floor(Math.random() * 100),
                capturedAt: new Date(now.getTime() - d * 24 * 60 * 60 * 1000)
            });
        }
    }

    // Batch insert
    // SQLite/pg limits params, so chunk it
    const chunkSize = 1000;
    for (let i = 0; i < snapshotData.length; i += chunkSize) {
        const chunk = snapshotData.slice(i, i + chunkSize);
        await prisma.metricSnapshot.createMany({
            data: chunk
        });
    }

    console.log(`✅ Load Test Seeding Complete. Created ${workspaceIds.length} workspaces and ${snapshotData.length} snapshots.`);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
