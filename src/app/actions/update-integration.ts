"use server";

import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { logger } from "@/lib/logger";

export async function updateIntegration(
    integrationId: string,
    data: { publicMetadata: Record<string, unknown> }
) {
    const { userId } = await auth();
    if (!userId) {
        return { error: "Unauthorized" };
    }

    try {
        // Verify ownership via WorkspaceMember
        // We need to find the integration first to get the workspaceId
        const integration = await prisma.integration.findUnique({
            where: { id: integrationId },
        });

        if (!integration) {
            return { error: "Integration not found" };
        }

        const membership = await prisma.workspaceMember.findUnique({
            where: {
                workspaceId_userId: {
                    workspaceId: integration.workspaceId,
                    userId,
                },
            },
        });

        if (!membership) {
            return { error: "Unauthorized access to this workspace" };
        }

        // Merge existing metadata with new data
        // casting to known type for prisma json field
        const currentMetadata = (integration.publicMetadata as Record<string, unknown>) || {};
        const updatedMetadata = { ...currentMetadata, ...data.publicMetadata };

        await prisma.integration.update({
            where: { id: integrationId },
            data: {
                publicMetadata: updatedMetadata as any,
            },
        });

        revalidatePath("/dashboard");
        revalidatePath(`/dashboard/integrations/${integrationId}`);

        return { success: true };
    } catch (error) {
        logger.error("Failed to update integration:", { error: String(error) });
        return { error: "Failed to update integration" };
    }
}
