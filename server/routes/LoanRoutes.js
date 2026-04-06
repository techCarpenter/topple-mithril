/** @import * as types from "../types.js" */
import { LoanService } from "../services/index.js";
import {
  createLoanBodySchema,
  createLoanResponseSchema,
  errorSchema,
  idParamSchema,
  loanInputSchema,
  loanListSchema,
  loanSchema
} from "../schemas.js";

/**
 * @type {import("fastify").FastifyPluginCallback}
 */
function loanRoutes(fastify, opts, done) {
  fastify.get("/loans", {
    schema: {
      tags: ["Loans"],
      summary: "List loans",
      description: "Returns all loans for the current user.",
      response: {
        200: loanListSchema
      }
    }
  }, async (_, res) => {
    return res.code(200).send(await LoanService.getLoans());
  });
  fastify.get("/loans/:id", {
    schema: {
      tags: ["Loans"],
      summary: "Get loan by id",
      params: idParamSchema,
      response: {
        200: loanSchema,
        404: errorSchema
      }
    }
  }, async (req, res) => {
    let { /** @type {number} */ id } = req.params;
    const loan = await LoanService.getLoanById(id);

    if (!loan) {
      return res.code(404).send({ msg: "Loan not found" });
    }

    return res.code(200).send(loan);
  });
  fastify.post("/loans", {
    schema: {
      tags: ["Loans"],
      summary: "Create loans",
      description: "Creates one loan or multiple loans in a single request.",
      body: createLoanBodySchema,
      response: {
        201: createLoanResponseSchema,
        400: errorSchema
      }
    }
  }, async (req, res) => {
    if (!req.body) {
      return res.code(400).send({ msg: "Request body must include at least one loan" });
    }

    const loans = Array.isArray(req.body) ? req.body : [req.body];

    if (loans.length === 0 || loans.some(loan => !loan)) {
      return res.code(400).send({ msg: "Request body must include at least one loan" });
    }

    const createdLoans = await LoanService.addLoan(/** @type {types.Loan[]} */ (loans));

    return res.code(201).send(Array.isArray(req.body) ? createdLoans : createdLoans[0]);
  });
  fastify.put("/loans/:id", {
    schema: {
      tags: ["Loans"],
      summary: "Update loan",
      params: idParamSchema,
      body: loanInputSchema,
      response: {
        200: loanSchema,
        404: errorSchema
      }
    }
  }, async (req, res) => {
    const { /** @type {number} */ id } = req.params;
    const updatedLoan = await LoanService.updateLoan({
      .../** @type {types.Loan} */ (req.body),
      id
    });

    if (!updatedLoan) {
      return res.code(404).send({ msg: "Loan not found" });
    }

    return res.code(200).send(updatedLoan);
  });
  fastify.delete("/loans/:id", {
    schema: {
      tags: ["Loans"],
      summary: "Delete loan",
      params: idParamSchema,
      response: {
        200: loanSchema,
        404: errorSchema
      }
    }
  }, async (req, res) => {
    const { /** @type {number} */ id } = req.params;
    const deletedLoan = await LoanService.deleteLoan(id);

    if (!deletedLoan) {
      return res.code(404).send({ msg: "Loan not found" });
    }

    return res.code(200).send(deletedLoan);
  });
  done();
}

export { loanRoutes }
