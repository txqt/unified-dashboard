import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { createWorkspace } from "@/app/actions/workspace-actions";

export default async function NewWorkspacePage() {
    const { userId } = await auth();
    if (!userId) redirect("/sign-in");

    return (
        <div className="mx-auto max-w-md text-white">
            <div className="mb-8">
                <h1 className="text-2xl font-bold">Create Workspace</h1>
                <p className="text-slate-400">Set up a new workspace for your SaaS projects</p>
            </div>

            <div className="rounded-xl border border-slate-800 bg-slate-900 p-6">
                <form action={createWorkspace} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-300">
                            Workspace Name
                        </label>
                        <input
                            type="text"
                            name="name"
                            placeholder="e.g. Acme Corp"
                            className="mt-1 block w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white focus:border-indigo-500 focus:outline-none"
                            required
                            autoFocus
                        />
                    </div>

                    <div className="pt-2">
                        <button
                            type="submit"
                            className="w-full rounded-lg bg-indigo-600 px-4 py-2 font-medium text-white hover:bg-indigo-700 transition-colors"
                        >
                            Create Workspace
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
