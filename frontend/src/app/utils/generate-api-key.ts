// utils/generateApiKey.ts
import { randomBytes } from "crypto";

/**
 * Generates a secure, random API key.
 * @param length Number of bytes to generate. The resulting string will be twice as long since each byte is represented by two hex characters.
 * @returns A hexadecimal string representing the API key.
 */
export function generateApiKey(length: number = 32): string {
  return randomBytes(length).toString("hex"); // 64 characters
}
