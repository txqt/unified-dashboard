"use server";

import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { Role } from "@prisma/client";

export async function deleteIntegration(formData: FormData) {
    const { userId } = await auth();
    if (!userId) {
        return { error: "Unauthorized" };
    }

    const validation = z.object({
        integrationId: z.string().cuid(),
        workspaceId: z.string().cuid()
    }).safeParse({
        integrationId: formData.get("integrationId"),
        workspaceId: formData.get("workspaceId")
    });

    if (!validation.success) {
        return { error: "Invalid ID format" };
    }

    const { integrationId, workspaceId } = validation.data;

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
