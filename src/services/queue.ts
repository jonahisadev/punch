import Queue from "bull";

export interface WebhookPayload {
  topic: string;
  data: Record<string, any>;
}

// Create Bull queue with Redis connection from environment variables
export const webhookQueue = new Queue<WebhookPayload>("webhook-events", {
  redis: {
    host: process.env.REDIS_HOST || "localhost",
    port: parseInt(process.env.REDIS_PORT || "6379"),
    password: process.env.REDIS_PASSWORD,
  },
});
