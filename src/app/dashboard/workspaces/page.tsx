import { prisma } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";

export default async function WorkspacesPage() {
    const { userId } = await auth();
    if (!userId) redirect("/sign-in");

    // Fetch workspaces for user
    const members = await prisma.workspaceMember.findMany({
        where: { userId },
        include: {
            workspace: {
                include: {
                    _count: {
                        select: { integrations: true, members: true }
                    }
                }
            }
        },
        orderBy: { workspace: { createdAt: 'desc' } }
    });

    return (
        <div className="max-w-4xl mx-auto py-8 px-4">
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-2xl font-bold">Workspaces</h1>
                <Link
                    href="/dashboard/workspaces/new"
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md transition-colors"
                >
                    Create Workspace
                </Link>
            </div>

            <div className="grid gap-4">
                {members.map(({ workspace, role }) => (
                    <div
                        key={workspace.id}
                        className="bg-white/5 border border-white/10 rounded-lg p-6 flex justify-between items-center"
                    >
                        <div>
                            <div className="flex items-center gap-3">
                                <h2 className="text-xl font-semibold">{workspace.name}</h2>
                                <span className={`text-xs px-2 py-0.5 rounded-full ${role === 'OWNER' ? 'bg-purple-500/20 text-purple-300' :
                                        role === 'ADMIN' ? 'bg-blue-500/20 text-blue-300' : 'bg-gray-500/20 text-gray-300'
                                    }`}>
                                    {role}
                                </span>
                            </div>
                            <div className="text-sm text-gray-400 mt-1 flex gap-4">
                                <span>{workspace._count.integrations} Integrations</span>
                                <span>{workspace._count.members} Members</span>
                                <span>Created {formatDistanceToNow(workspace.createdAt)} ago</span>
                            </div>
                        </div>

                        <div className="flex gap-3">
                            <Link
                                href={`/dashboard?workspace=${workspace.id}`}
                                className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded text-sm transition-colors"
                            >
                                View
                            </Link>
                            {role === 'OWNER' && (
                                <Link
                                    href={`/dashboard/workspaces/${workspace.id}/edit`}
                                    className="px-4 py-2 text-gray-400 hover:text-white hover:bg-white/10 rounded text-sm transition-colors"
                                >
                                    Settings
                                </Link>
                            )}
                        </div>
                    </div>
                ))}

                {members.length === 0 && (
                    <div className="text-center py-12 text-gray-500 bg-white/5 rounded-lg border border-dashed border-white/10">
                        <p>No workspaces found. Create one to get started.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
