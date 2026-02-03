"use server";

import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function updateIntegration(
    integrationId: string,
    data: { publicMetadata: Record<string, any> }
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
        // casting to any for prisma json field
        const currentMetadata = (integration.publicMetadata as Record<string, any>) || {};
        const updatedMetadata = { ...currentMetadata, ...data.publicMetadata };

        await prisma.integration.update({
            where: { id: integrationId },
            data: {
                publicMetadata: updatedMetadata,
            },
        });

        revalidatePath("/dashboard");
        revalidatePath(`/dashboard/integrations/${integrationId}`);

        return { success: true };
    } catch (error) {
        console.error("Failed to update integration:", error);
        return { error: "Failed to update integration" };
    }
}
