import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { NewIntegrationForm } from "./client/integration-form";

export default async function NewIntegrationPage() {
    const { userId } = await auth();
    if (!userId) redirect("/sign-in");

    // Fetch workspaces for selection
    const members = await prisma.workspaceMember.findMany({
        where: { userId },
        include: { workspace: true },
    });

    return (
        <div className="mx-auto max-w-2xl text-white">
            <div className="mb-8">
                <h1 className="text-2xl font-bold">Add New Integration</h1>
                <p className="text-slate-400">Connect a new provider to your workspace</p>
            </div>

            <NewIntegrationForm members={members as any} />
        </div>
    );
}
