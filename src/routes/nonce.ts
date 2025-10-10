import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import crypto from "crypto";
import { validNonces } from "../services/nonce";
import { getWebhookBearerToken } from "../services/config";

const routes = async (fastify: FastifyInstance) => {
  fastify.post("/nonce", async (req: FastifyRequest, res: FastifyReply) => {
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

    const token = authHeader.substring(7);

    // Constant-time comparison to prevent timing attacks
    if (!crypto.timingSafeEqual(Buffer.from(token), Buffer.from(bearerToken))) {
      return res.status(401).send({
        ok: false,
        error: "Invalid token",
      });
    }

    // Generate a cryptographically secure nonce
    const nonce = crypto.randomBytes(32).toString("hex");
    validNonces.add(nonce);

    return res.status(200).send({
      ok: true,
      nonce,
    });
  });
};

export default routes;
