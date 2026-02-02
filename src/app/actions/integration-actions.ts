"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { Role } from "@/generated/prisma/client";

export async function deleteIntegration(formData: FormData) {
    const { userId } = await auth();
    if (!userId) {
        return { error: "Unauthorized" };
    }

    const integrationId = formData.get("integrationId") as string;
    const workspaceId = formData.get("workspaceId") as string;

    if (!integrationId || !workspaceId) {
        return { error: "Missing required fields (integrationId, workspaceId)" };
    }

    // Check permissions
    const membership = await prisma.workspaceMember.findUnique({
        where: {
            workspaceId_userId: {
                workspaceId,
                userId,
            },
        },
    });

    if (!membership || (membership.role !== Role.OWNER && membership.role !== Role.ADMIN)) {
        return { error: "Only admins can delete integrations." };
    }

    try {
        await prisma.integration.delete({
            where: { id: integrationId },
        });
    } catch (error) {
        console.error("Failed to delete integration:", error);
        return { error: "Failed to delete integration." };
    }

    revalidatePath("/dashboard");
    revalidatePath(`/dashboard/workspaces/${workspaceId}`); // if we ever have a detail page
    return { success: true };
}
