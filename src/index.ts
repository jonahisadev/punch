import "dotenv/config";
import Fastify from "fastify";
import fastifyWebsocket from "@fastify/websocket";
import root from "./routes/root";
import webhook from "./routes/webhook";
import nonce from "./routes/nonce";
import { setupWebSocket } from "./services/websocket";
import { startWorker } from "./services/worker";

const fastify = Fastify({
  logger: true,
});

const main = async () => {
  // Register WebSocket plugin
  await fastify.register(fastifyWebsocket);

  // Register routes
  fastify.register(root);
  fastify.register(webhook, { prefix: "/webhook" });
  fastify.register(nonce);

  // Setup WebSocket handlers
  await setupWebSocket(fastify);

  // Start Bull queue worker
  startWorker();

  const port = parseInt(process.env.PORT || "3000");
  await fastify.listen({ host: "0.0.0.0", port });
};

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error(err);
});
