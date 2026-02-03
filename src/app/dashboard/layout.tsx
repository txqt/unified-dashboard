import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { UserButton } from "@clerk/nextjs";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { WorkspaceSwitcher } from "@/components/dashboard/workspace-switcher";
import { cookies } from "next/headers";

export default async function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const { userId } = await auth();

    if (!userId) {
        redirect("/sign-in");
    }

    // Fetch user's workspaces
    const memberships = await prisma.workspaceMember.findMany({
        where: { userId },
        include: { workspace: true },
        orderBy: { workspace: { createdAt: 'desc' } }
    });

    const workspaces = memberships.map((m) => m.workspace);

    // Determine active workspace
    const cookieStore = await cookies();
    const cookieWorkspaceId = cookieStore.get("unified_workspace_id")?.value;

    // Validate that user is actually a member of the cookie workspace
    const validCookieWorkspace = workspaces.find(w => w.id === cookieWorkspaceId);

    // Default to first workspace if no valid cookie
    const currentWorkspaceId = validCookieWorkspace?.id || workspaces[0]?.id;

    // If we fell back to a default and there wasn't a valid cookie, 
    // we technically "should" set the cookie, but purely server-side layout rendering 
    // shouldn't perform mutations (like setting cookies) easily without middleware/actions.
    // We'll rely on the client or subsequent actions to set it if needed, 
    // or just treat "no cookie" as "viewing default".

    return (
        <div className="min-h-screen bg-slate-950">
            {/* Top Navigation */}
            <nav className="fixed top-0 z-50 w-full border-b border-slate-800 bg-slate-950/80 backdrop-blur-sm">
                <div className="flex h-16 items-center justify-between px-4 lg:px-8">
                    {/* Logo & Workspace Switcher */}
                    <div className="flex items-center gap-4">
                        <Link href="/dashboard" className="flex items-center gap-2">
                            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600" />
                            <span className="text-lg font-bold text-white hidden sm:block">
                                Unified
                            </span>
                        </Link>

                        {/* Workspace Switcher */}
                        <WorkspaceSwitcher
                            workspaces={workspaces}
                            currentWorkspaceId={currentWorkspaceId}
                        />
                    </div>

                    {/* Right Side */}
                    <div className="flex items-center gap-4">
                        {/* Notifications */}
                        <button className="relative rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors">
                            <svg
                                className="h-5 w-5"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                                />
                            </svg>
                            <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-red-500" />
                        </button>

                        {/* User Button */}
                        <UserButton
                            appearance={{
                                elements: {
                                    avatarBox: "h-8 w-8",
                                    userButtonPopoverCard: "bg-slate-900 border-slate-800",
                                    userButtonPopoverActionButton: "text-slate-300 hover:bg-slate-800",
                                    userButtonPopoverActionButtonText: "text-slate-300",
                                    userButtonPopoverFooter: "hidden",
                                },
                            }}
                        />
                    </div>
                </div>
            </nav>

            {/* Sidebar */}
            <aside className="fixed left-0 top-16 z-40 h-[calc(100vh-4rem)] w-64 border-r border-slate-800 bg-slate-950 hidden lg:block">
                <nav className="flex flex-col gap-1 p-4">
                    <SidebarLink href="/dashboard" icon="home" label="Overview" />
                    <SidebarLink href="/dashboard/workspaces" icon="plus" label="Workspaces" />
                    <SidebarLink href="/dashboard/integrations" icon="plug" label="Integrations" />
                    <SidebarLink href="/dashboard/alerts" icon="bell" label="Alerts" />
                    <SidebarLink href="/dashboard/settings" icon="settings" label="Settings" />
                </nav>
            </aside>

            {/* Main Content */}
            <main className="pt-16 lg:pl-64">
                <div className="p-4 lg:p-8">{children}</div>
            </main>
        </div>
    );
}

function SidebarLink({
    href,
    icon,
    label,
}: {
    href: string;
    icon: "home" | "plug" | "bell" | "settings" | "plus";
    label: string;
}) {
    const icons = {
        home: (
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
        ),
        plug: (
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
            </svg>
        ),
        bell: (
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
        ),
        settings: (
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
        ),
        plus: (
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
        ),
    };

    return (
        <Link
            href={href}
            className="flex items-center gap-3 rounded-lg px-3 py-2 text-slate-400 hover:bg-slate-900 hover:text-white transition-colors"
        >
            {icons[icon]}
            <span className="text-sm font-medium">{label}</span>
        </Link>
    );
}
