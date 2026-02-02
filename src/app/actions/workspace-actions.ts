"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { Role } from "@prisma/client";

export async function createWorkspace(formData: FormData) {
    const { userId } = await auth();
    if (!userId) {
        throw new Error("Unauthorized");
    }

    const name = formData.get("name") as string;
    if (!name || name.trim().length === 0) {
        throw new Error("Workspace name is required");
    }

    // Simple slug generation
    const slug = name
        .toLowerCase()
        .replace(/ /g, "-")
        .replace(/[^\w-]+/g, "") + "-" + Math.random().toString(36).substring(2, 7);

    try {
        await prisma.$transaction(async (tx) => {
            const workspace = await tx.workspace.create({
                data: {
                    name,
                    slug,
                },
            });

            await tx.workspaceMember.create({
                data: {
                    workspaceId: workspace.id,
                    userId,
                    role: Role.OWNER,
                },
            });
        });
    } catch (error) {
        console.error("Failed to create workspace:", error);
        throw new Error("Failed to create workspace. Slug might already be taken.");
    }

    revalidatePath("/dashboard");
    redirect("/dashboard/integrations/new");
}

export async function updateWorkspace(formData: FormData) {
    const { userId } = await auth();
    if (!userId) {
        throw new Error("Unauthorized");
    }

    const workspaceId = formData.get("workspaceId") as string;
    const name = formData.get("name") as string;

    if (!workspaceId || !name || name.trim().length === 0) {
        throw new Error("Workspace ID and name are required");
    }

    // Check permissions (must be OWNER)
    const membership = await prisma.workspaceMember.findUnique({
        where: {
            workspaceId_userId: {
                workspaceId,
                userId,
            },
        },
    });

    if (!membership || membership.role !== Role.OWNER) {
        throw new Error("Only workspace owners can update settings.");
    }

    const slug = name
        .toLowerCase()
        .replace(/ /g, "-")
        .replace(/[^\w-]+/g, "") + "-" + Math.random().toString(36).substring(2, 7);

    await prisma.workspace.update({
        where: { id: workspaceId },
        data: { name, slug },
    });

    revalidatePath("/dashboard");
    revalidatePath(`/dashboard/workspaces`);
    return { success: true };
}

export async function deleteWorkspace(formData: FormData) {
    const { userId } = await auth();
    if (!userId) {
        throw new Error("Unauthorized");
    }

    const workspaceId = formData.get("workspaceId") as string;
    if (!workspaceId) {
        throw new Error("Workspace ID is required");
    }

    // Check permissions (must be OWNER)
    const membership = await prisma.workspaceMember.findUnique({
        where: {
            workspaceId_userId: {
                workspaceId,
                userId,
            },
        },
    });

    if (!membership || membership.role !== Role.OWNER) {
        throw new Error("Only workspace owners can delete workspaces.");
    }

    await prisma.workspace.delete({
        where: { id: workspaceId },
    });

    revalidatePath("/dashboard");
    return { success: true };
}
