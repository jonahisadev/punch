import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import crypto from "crypto";
import { getWebhookQueue } from "../services/queue";
import { getWebhookBearerToken } from "../services/config";

interface WebhookRequestBody {
  topic: string;
  data: Record<string, unknown>;
}

const routes = async (fastify: FastifyInstance) => {
  fastify.post("/", async (req: FastifyRequest<{ Body: WebhookRequestBody }>, res: FastifyReply) => {
    const authHeader = req.headers.authorization;
    const bearerToken = getWebhookBearerToken();

    if (!bearerToken) {
      return res.status(500).send({
        ok: false,
        error: "Bearer token not configured",
      });
    }

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).send({
        ok: false,
        error: "Missing or invalid Authorization header",
      });
    }

    const token = authHeader.substring(7); // Remove "Bearer " prefix

    // Constant-time comparison to prevent timing attacks
    if (!crypto.timingSafeEqual(Buffer.from(token), Buffer.from(bearerToken))) {
      return res.status(401).send({
        ok: false,
        error: "Invalid token",
      });
    }

    // Validate request body
    const { topic, data } = req.body;
    if (!topic || !data) {
      return res.status(400).send({
        ok: false,
        error: "Topic and data are required",
      });
    }

    // Publish to Bull queue
    await getWebhookQueue().add({ topic, data });

    return res.status(200).send({
      ok: true,
    });
  });
};

export default routes;
