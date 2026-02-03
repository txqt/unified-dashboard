"use server";

import { z } from "zod";
import { auth } from "@clerk/nextjs/server";

const VERCEL_API_URL = "https://api.vercel.com/v9/projects";

const ResponseSchema = z.object({
    projects: z.array(
        z.object({
            id: z.string(),
            name: z.string(),
        })
    ),
});

export type VercelProject = {
    id: string;
    name: string;
};

type FetchResult = {
    success: boolean;
    projects?: VercelProject[];
    error?: string;
};

export async function fetchVercelProjects(apiKey: string): Promise<FetchResult> {
    const { userId } = await auth();
    if (!userId) {
        return { success: false, error: "Unauthorized" };
    }

    if (!apiKey || apiKey.length < 20) {
        return { success: false, error: "Invalid API Key format" };
    }

    try {
        const response = await fetch(VERCEL_API_URL, {
            headers: {
                Authorization: `Bearer ${apiKey}`,
            },
            next: { revalidate: 0 }, // Don't cache this
        });

        if (!response.ok) {
            if (response.status === 403 || response.status === 401) {
                return { success: false, error: "Invalid API Key or insufficient permissions" };
            }
            return { success: false, error: `Vercel API Error: ${response.statusText}` };
        }

        const data = await response.json();
        const parsed = ResponseSchema.safeParse(data);

        if (!parsed.success) {
            console.error("Vercel API schema mismatch:", parsed.error);
            return { success: false, error: "Failed to parse Vercel projects response" };
        }

        return { success: true, projects: parsed.data.projects };
    } catch (error) {
        console.error("Error fetching Vercel projects:", error);
        return { success: false, error: "Network error occurred while fetching projects" };
    }
}
