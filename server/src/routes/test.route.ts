import { FastifyInstance, FastifyPluginOptions } from "fastify";

export default async function testRoutes(fastify: FastifyInstance, _options: FastifyPluginOptions) {
  fastify.get("/", async (request, reply) => {
    reply.send({
      message: "Hello from test route 5!",
    });
  });
}
