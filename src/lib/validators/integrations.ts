import { z } from "zod";
import { IntegrationProvider } from "@prisma/client";

export const integrationProviderSchema = z.nativeEnum(IntegrationProvider);

export const createIntegrationSchema = z.object({
    workspaceId: z.string().cuid(),
    provider: integrationProviderSchema,
    // We might receive extra metadata depending on the provider, 
    // but initial creation usually just needs provider + workspace + encrypted secrets (handled separately or passed here)
    encryptedSecrets: z.object({
        encryptedData: z.string(),
        iv: z.string(),
        authTag: z.string()
    }).optional(), // Optional because some might be OAuth flow based where we swap code for tokens later
    metadata: z.record(z.string(), z.any()).optional(),
});

export const workspaceIdSchema = z.object({
    workspaceId: z.string().cuid()
});

export const integrationIdSchema = z.object({
    integrationId: z.string().cuid(),
    workspaceId: z.string().cuid() // Usually need context to verify ownership
});
