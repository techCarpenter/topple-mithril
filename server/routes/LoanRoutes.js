/** @import * as types from "../types.js" */
import { LoanService } from "../services/index.js";

/**
 * @type {import("fastify").FastifyPluginCallback}
 */
function loanRoutes(fastify, opts, done) {
  fastify.get("/loans", async (_, res) => {
    return res.code(200).send(await LoanService.getLoans());
  });
  fastify.get("/loans/:id", {
    schema: {
      params: {
        type: "object",
        properties: {
          id: { type: "number" }
        }
      }
    }
  }, async (req, res) => {
    let { /** @type {number} */ id } = req.params;
    return res.code(200).send(await LoanService.getLoanById(id));
  });
  fastify.post("/loans", async (req, res) => {
    if (!req.body.length) return res.code(400).send({ msg: "Request body must be an array of loans" });

    return res.code(200).send(await LoanService.addLoan(/** @type {types.Loan} */(req.body)));
  });
  fastify.put("/loans/:id", {
    schema: {
      params: {
        type: "object",
        properties: {
          id: { type: "integer" }
        }
      },
      body: {
        type: "object",
        properties: {
          id: { type: "integer" },
          userId: { type: "integer" },
          apr: { type: "number" },
          name: { type: "string" },
          isClosed: { type: "boolean" },
          minPayment: { type: "number" },
        }
      }
    }
  }, (req, res) => {

  });
  // fastify.delete("/users/:id", () => { return "/users/:id" });
  done();
}

export { loanRoutes }