import fs from "fs";

let cachedToken: string | undefined;

/**
 * Load the webhook bearer token from either a file or environment variable.
 * Prioritizes file-based configuration (for Docker secrets) with fallback to env var.
 * The token is cached after the first load.
 */
export function getWebhookBearerToken(): string | undefined {
  if (cachedToken !== undefined) {
    return cachedToken;
  }

  const tokenFile = process.env.WEBHOOK_BEARER_TOKEN_FILE;

  if (tokenFile) {
    try {
      const token = fs.readFileSync(tokenFile, "utf-8").trim();
      if (token) {
        cachedToken = token;
        return cachedToken;
      }
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error(`Failed to read token from file ${tokenFile}:`, error);
    }
  }

  cachedToken = process.env.WEBHOOK_BEARER_TOKEN;
  return cachedToken;
}
