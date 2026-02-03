import { randomBytes, createCipheriv, createDecipheriv } from "crypto";
import { env } from "@/env";

const ALGORITHM = "aes-256-gcm";
const KEY_LENGTH = 32; // 256 bits
const IV_LENGTH = 12; // 96 bits for GCM


// Ensure ENCRYPTION_KEY is set and valid
const getMasterKey = () => {
    const keyBase64 = env.ENCRYPTION_KEY;
    // Key presence is guaranteed by src/env.ts validation
    const key = Buffer.from(keyBase64, "base64");
    if (key.length !== KEY_LENGTH) {
        throw new Error(
            `Invalid ENCRYPTION_KEY length. Expected ${KEY_LENGTH} bytes, got ${key.length}.`
        );
    }
    return key;
};

export type EncryptedResult = {
    encryptedData: Buffer;
    iv: Buffer;
    authTag: Buffer;
};

export class VaultService {
    /**
     * Encrypts a sensitive string (token/secret) using AES-256-GCM.
     */
    static async encrypt(text: string): Promise<EncryptedResult> {
        const key = getMasterKey();
        const iv = randomBytes(IV_LENGTH);
        const cipher = createCipheriv(ALGORITHM, key, iv);

        const encrypted = Buffer.concat([
            cipher.update(text, "utf8"),
            cipher.final(),
        ]);

        const authTag = cipher.getAuthTag();

        return {
            encryptedData: encrypted,
            iv,
            authTag,
        };
    }

    /**
     * Decrypts ciphertext back to the original string.
     */
    static async decrypt(
        encryptedData: Buffer,
        iv: Buffer,
        authTag: Buffer
    ): Promise<string> {
        const key = getMasterKey();
        const decipher = createDecipheriv(ALGORITHM, key, iv);

        decipher.setAuthTag(authTag);

        const decrypted = Buffer.concat([
            decipher.update(encryptedData),
            decipher.final(),
        ]);

        return decrypted.toString("utf8");
    }
}
