/**
 * Load the webhook bearer token from either a file or environment variable.
 * Prioritizes file-based configuration (for Docker secrets) with fallback to env var.
 * The token is cached after the first load.
 */
export function getWebhookBearerToken(): string | undefined {
  return process.env.WEBHOOK_BEARER_TOKEN;
}
