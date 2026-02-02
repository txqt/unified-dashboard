"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { Role } from "@/generated/prisma/client";

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
