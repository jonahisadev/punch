import { webhookQueue, WebhookPayload } from "./queue";
import { broadcastToTopic } from "./websocket";

// Process jobs from the Bull queue and broadcast to WebSocket clients
export const startWorker = () => {
  webhookQueue.process(async (job) => {
    const { topic, data } = job.data;

    console.log(`Processing webhook event for topic: ${topic}`);

    // Broadcast to all WebSocket clients subscribed to this topic
    broadcastToTopic(topic, data);

    return { success: true };
  });

  console.log("Bull worker started and processing webhook events");
};
