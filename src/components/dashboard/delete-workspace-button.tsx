"use client";

import { useState } from "react";
import { deleteWorkspace } from "@/app/actions/workspace-actions";
import { useRouter } from "next/navigation";

interface DeleteWorkspaceButtonProps {
    workspaceId: string;
}

export function DeleteWorkspaceButton({ workspaceId }: DeleteWorkspaceButtonProps) {
    const [isPending, setIsPending] = useState(false);
    const router = useRouter();

    const handleDelete = async () => {
        if (!confirm("Are you sure you want to delete this workspace? This action cannot be undone.")) {
            return;
        }

        setIsPending(true);
        try {
            const formData = new FormData();
            formData.append("workspaceId", workspaceId);
            await deleteWorkspace(formData);
            router.push("/dashboard/workspaces");
            router.refresh();
        } catch (error) {
            console.error("Failed to delete workspace", error);
            alert("Failed to delete workspace");
        } finally {
            setIsPending(false);
        }
    };

    return (
        <button
            type="button"
            onClick={handleDelete}
            disabled={isPending}
            className="bg-red-500/10 hover:bg-red-500 hover:text-white text-red-500 border border-red-500/50 px-4 py-2 rounded transition-all disabled:opacity-50 cursor-pointer"
        >
            {isPending ? "Deleting..." : "Delete Workspace"}
        </button>
    );
}
