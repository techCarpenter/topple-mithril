import { UserService } from "../services/index.js";

/**
 * @type {import("fastify").FastifyPluginCallback}
 */
function userRoutes(fastify, opts, done) {
  fastify.get("/users", async (_, res) => {
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