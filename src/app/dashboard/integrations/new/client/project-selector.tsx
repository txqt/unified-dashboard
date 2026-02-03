"use client";

import * as React from "react";
import { Check, ChevronsUpDown, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface Project {
    id: string;
    name: string;
}

interface ProjectSelectorProps {
    projects: Project[];
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    onSelect: (projectId: string, projectName: string) => void;
    isLoading?: boolean;
    disabled?: boolean;
}

export function ProjectSelector({
    projects,
    isOpen,
    onOpenChange,
    onSelect,
    isLoading,
    disabled
}: ProjectSelectorProps) {
    const [selectedId, setSelectedId] = React.useState<string>("");
    const dropdownRef = React.useRef<HTMLDivElement>(null);

    React.useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                onOpenChange(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [onOpenChange]);

    const handleSelect = (project: Project) => {
        setSelectedId(project.id);
        onSelect(project.id, project.name); // passing name as slug for now, or fetch full details if needed
        onOpenChange(false);
    };

    const selectedName = projects.find(p => p.id === selectedId)?.name;

    return (
        <div className="relative" ref={dropdownRef}>
            <Button
                type="button"
                variant="outline"
                role="combobox"
                aria-expanded={isOpen}
                disabled={disabled}
                onClick={() => onOpenChange(!isOpen)}
                className="w-full justify-between border-slate-700 bg-slate-950 text-slate-200 hover:bg-slate-900 hover:text-white"
            >
                {isLoading ? (
                    <div className="flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin text-indigo-500" />
                        <span>Fetching projects...</span>
                    </div>
                ) : selectedName ? (
                    selectedName
                ) : (
                    "Select a Vercel project..."
                )}
                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>

            {isOpen && projects.length > 0 && (
                <div className="absolute top-full mt-2 w-full rounded-md border border-slate-700 bg-slate-950 p-1 shadow-lg z-50 max-h-60 overflow-y-auto">
                    {projects.map((project) => (
                        <button
                            key={project.id}
                            type="button"
                            onClick={() => handleSelect(project)}
                            className={cn(
                                "relative flex w-full cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors hover:bg-slate-800 hover:text-white",
                                selectedId === project.id ? "text-white bg-slate-800" : "text-slate-400"
                            )}
                        >
                            <span className="truncate flex-1 text-left">{project.name}</span>
                            {selectedId === project.id && (
                                <Check className="ml-2 h-4 w-4 text-indigo-500" />
                            )}
                        </button>
                    ))}
                </div>
            )}

            {isOpen && !isLoading && projects.length === 0 && (
                <div className="absolute top-full mt-2 w-full rounded-md border border-slate-700 bg-slate-950 p-3 text-sm text-slate-500 z-50">
                    No projects found. Check your API key.
                </div>
            )}
        </div>
    );
}
