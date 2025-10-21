import { FastifyInstance } from "fastify";
import { WebSocket } from "@fastify/websocket";
import { validNonces } from "./nonce";

interface WebSocketClient {
  socket: WebSocket;
  topics: Set<string>;
  authenticated: boolean;
}

// Store all connected WebSocket clients
export const clients = new Map<WebSocket, WebSocketClient>();

// Map topics to sets of clients subscribed to them
export const topicSubscriptions = new Map<string, Set<WebSocket>>();

export const setupWebSocket = async (fastify: FastifyInstance) => {
  fastify.get("/ws", { websocket: true }, (socket, _req) => {
    const client: WebSocketClient = {
      socket,
      topics: new Set(),
      authenticated: false,
    };

    clients.set(socket, client);

    socket.on("message", (message: Buffer) => {
      try {
        const data = JSON.parse(message.toString());

        switch (data.type) {
          case "CONNECT":
            handleConnect(socket, client, data.nonce);
            break;

          case "SUBSCRIBE":
            if (!client.authenticated) {
              socket.send(
                JSON.stringify({
                  type: "ERROR",
                  error: "Not authenticated",
                })
              );
              return;
            }
            handleSubscribe(socket, client, data.topic);
            break;

          case "UNSUBSCRIBE":
            if (!client.authenticated) {
              socket.send(
                JSON.stringify({
                  type: "ERROR",
                  error: "Not authenticated",
                })
              );
              return;
            }
            handleUnsubscribe(socket, client, data.topic);
            break;

          default:
            socket.send(
              JSON.stringify({
                type: "ERROR",
                error: "Unknown message type",
              })
            );
        }
      } catch {
        socket.send(
          JSON.stringify({
            type: "ERROR",
            error: "Invalid message format",
          })
        );
      }
    });

    socket.on("close", () => {
      handleDisconnect(socket, client);
    });
  });
};

function handleConnect(
  socket: WebSocket,
  client: WebSocketClient,
  nonce: string
) {
  if (!nonce) {
    socket.send(
      JSON.stringify({
        type: "ERROR",
        error: "Nonce required",
      })
    );
    socket.terminate();
    return;
  }

  if (!validNonces.has(nonce)) {
    socket.send(
      JSON.stringify({
        type: "ERROR",
        error: "Invalid nonce",
      })
    );
    socket.terminate();
    return;
  }

  // Valid nonce - authenticate and remove from valid list
  validNonces.delete(nonce);
  client.authenticated = true;

  socket.send(
    JSON.stringify({
      type: "CONNECTED",
      message: "Successfully authenticated",
    })
  );
}

function handleSubscribe(
  socket: WebSocket,
  client: WebSocketClient,
  topic: string
) {
  if (!topic) {
    socket.send(
      JSON.stringify({
        type: "ERROR",
        error: "Topic required",
      })
    );
    return;
  }

  client.topics.add(topic);

  if (!topicSubscriptions.has(topic)) {
    topicSubscriptions.set(topic, new Set());
  }
  const topicSubs = topicSubscriptions.get(topic);
  if (topicSubs) {
    topicSubs.add(socket);
  }

  socket.send(
    JSON.stringify({
      type: "SUBSCRIBED",
      topic,
    })
  );
}

function handleUnsubscribe(
  socket: WebSocket,
  client: WebSocketClient,
  topic: string
) {
  if (!topic) {
    socket.send(
      JSON.stringify({
        type: "ERROR",
        error: "Topic required",
      })
    );
    return;
  }

  client.topics.delete(topic);

  const topicSubs = topicSubscriptions.get(topic);
  if (topicSubs) {
    topicSubs.delete(socket);
    if (topicSubs.size === 0) {
      topicSubscriptions.delete(topic);
    }
  }

  socket.send(
    JSON.stringify({
      type: "UNSUBSCRIBE",
      topic,
    })
  );
}

function handleDisconnect(socket: WebSocket, client: WebSocketClient) {
  // Remove from all topic subscriptions
  for (const topic of client.topics) {
    const topicSubs = topicSubscriptions.get(topic);
    if (topicSubs) {
      topicSubs.delete(socket);
      if (topicSubs.size === 0) {
        topicSubscriptions.delete(topic);
      }
    }
  }

  // Remove client
  clients.delete(socket);
}

// Broadcast a message to all clients subscribed to a topic
export function broadcastToTopic(topic: string, data: Record<string, unknown>) {
  const subscribers = topicSubscriptions.get(topic);
  if (!subscribers) return;

  const message = JSON.stringify({
    type: "EVENT",
    topic,
    data,
  });

  for (const socket of subscribers) {
    try {
      socket.send(message);
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error("Error sending message to client:", err);
    }
  }
}
