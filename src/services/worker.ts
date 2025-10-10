import { getWebhookQueue } from "./queue";
import { broadcastToTopic } from "./websocket";

// Process jobs from the Bull queue and broadcast to WebSocket clients
export const startWorker = () => {
  getWebhookQueue().process(async (job) => {
    const { topic, data } = job.data;

    // eslint-disable-next-line no-console
    console.log(`Processing webhook event for topic: ${topic}`);

    // Broadcast to all WebSocket clients subscribed to this topic
    broadcastToTopic(topic, data);

    return { success: true };
  });

  // eslint-disable-next-line no-console
  console.log("Bull worker started and processing webhook events");
};
