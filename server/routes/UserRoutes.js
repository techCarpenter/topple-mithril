import { UserService } from "../services/index.js";
import { userListSchema } from "../schemas.js";

/**
 * @type {import("fastify").FastifyPluginCallback}
 */
function userRoutes(fastify, opts, done) {
  fastify.get("/users", {
    schema: {
      tags: ["Users"],
      summary: "List users",
      description: "Returns all users in the database.",
      response: {
        200: userListSchema
      }
    }
  }, async (_, res) => {
    res
      .code(200)
      .send(await UserService.getUsers());
  });
  // fastify.get("/users/:id", (req, res) => { return "/users/:id" });
  // fastify.post("/users", () => { return "/users" });
  // fastify.put("/users/:id", () => { return "/users/:id" });
  // fastify.delete("/users/:id", () => { return "/users/:id" });
  done();
}

export { userRoutes }
