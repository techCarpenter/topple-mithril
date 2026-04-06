import { apiIndexSchema } from "../schemas.js";

/**
 * @type {import("fastify").FastifyPluginCallback}
 */
function apiRoutes(fastify, opts, done) {
  fastify.get("/", {
    schema: {
      tags: ["Meta"],
      summary: "API index",
      description: "Lists the current resource entry points and the generated documentation URL.",
      response: {
        200: apiIndexSchema
      }
    }
  }, async () => ({
    name: "Topple API",
    docs: "/docs",
    routes: {
      users: "/api/v1/users",
      loans: "/api/v1/loans",
      snapshots: "/api/v1/snapshots",
      extraPayments: "/api/v1/extra-payments",
      snowballAdjustments: "/api/v1/snowball-adjustments"
    }
  }));

  done();
}

export { apiRoutes }
