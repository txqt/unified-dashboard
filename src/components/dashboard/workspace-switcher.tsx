"use client";

import { switchWorkspace } from "@/app/actions/workspace-actions";

import * as React from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { Check, ChevronsUpDown, Plus, Layout } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface Workspace {
    id: string;
    name: string;
}

interface WorkspaceSwitcherProps {
    workspaces: Workspace[];
    currentWorkspaceId?: string;
}

export function WorkspaceSwitcher({
    workspaces,
    currentWorkspaceId,
}: WorkspaceSwitcherProps) {
    const router = useRouter();
    const [isOpen, setIsOpen] = React.useState(false);
    const dropdownRef = React.useRef<HTMLDivElement>(null);

    const selectedWorkspace =
        workspaces.find((w) => w.id === currentWorkspaceId) || workspaces[0];

    React.useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }

        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleSelect = async (workspaceId: string) => {
        setIsOpen(false);
        try {
            await switchWorkspace(workspaceId);
            router.refresh();
        } catch (error) {
            console.error("Failed to switch workspace:", error);
        }
    };

    return (
        <div className="relative" ref={dropdownRef}>
            <Button
                variant="outline"
                role="combobox"
                aria-expanded={isOpen}
                aria-haspopup="listbox"
                onClick={() => setIsOpen(!isOpen)}
                className="w-[200px] justify-between border-slate-800 bg-slate-900 text-slate-200 hover:bg-slate-800 hover:text-white"
            >
                <div className="flex items-center gap-2 truncate">
                    <div className="flex h-5 w-5 items-center justify-center rounded bg-indigo-600 text-[10px] font-bold text-white">
                        {selectedWorkspace?.name?.charAt(0).toUpperCase() || "W"}
                    </div>
                    <span className="truncate">{selectedWorkspace?.name || "Select Workspace"}</span>
                </div>
                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>

            {isOpen && (
                <div className="absolute top-full mt-2 w-[200px] rounded-md border border-slate-800 bg-slate-900 p-1 shadow-lg ring-1 ring-black ring-opacity-5 z-50">
                    <div className="px-2 py-1.5 text-xs font-semibold text-slate-500">
                        My Workspaces
                    </div>
                    <div className="space-y-0.5">
                        {workspaces.map((workspace) => (
                            <button
                                key={workspace.id}
                                onClick={() => handleSelect(workspace.id)}
                                className={cn(
                                    "relative flex w-full cursor-pointer select-none items-center rounded-sm py-1.5 pl-2 pr-8 text-sm outline-none transition-colors hover:bg-slate-800 hover:text-white",
                                    selectedWorkspace?.id === workspace.id ? "text-white" : "text-slate-400"
                                )}
                            >
                                <div className="flex items-center gap-2">
                                    <Layout className="h-4 w-4" />
                                    <span className="truncate">{workspace.name}</span>
                                </div>
                                {selectedWorkspace?.id === workspace.id && (
                                    <span className="absolute right-2 flex h-3.5 w-3.5 items-center justify-center">
                                        <Check className="h-4 w-4 text-indigo-500" />
                                    </span>
                                )}
                            </button>
                        ))}
                    </div>
                    <div className="my-1 h-px bg-slate-800" />
                    <Link
                        href="/dashboard/workspaces/new"
                        onClick={() => setIsOpen(false)}
                        className="relative flex w-full cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm font-medium text-slate-400 outline-none hover:bg-slate-800 hover:text-white transition-colors"
                    >
                        <Plus className="mr-2 h-4 w-4" />
                        Create Workspace
                    </Link>
                </div>
            )}
        </div>
    );
}
