import {
  createExtraPaymentBodySchema,
  createExtraPaymentResponseSchema,
  errorSchema,
  extraPaymentInputSchema,
  extraPaymentListSchema,
  extraPaymentSchema,
  idParamSchema
} from "../schemas.js";
import { ExtraPaymentService } from "../services/index.js";

/**
 * @type {import("fastify").FastifyPluginCallback}
 */
function extraPaymentRoutes(fastify, opts, done) {
  fastify.get("/extra-payments", {
    schema: {
      tags: ["Extra Payments"],
      summary: "List extra payments",
      description: "Returns all extra payments for the current user.",
      response: {
        200: extraPaymentListSchema
      }
    }
  }, async (_, res) => {
    return res.code(200).send(await ExtraPaymentService.getExtraPayments());
  });

  fastify.get("/extra-payments/:id", {
    schema: {
      tags: ["Extra Payments"],
      summary: "Get extra payment by id",
      description: "Returns a single extra payment by id.",
      params: idParamSchema,
      response: {
        200: extraPaymentSchema,
        404: errorSchema
      }
    }
  }, async (req, res) => {
    const { /** @type {number} */ id } = req.params;
    const extraPayment = await ExtraPaymentService.getExtraPaymentById(id);

    if (!extraPayment) {
      return res.code(404).send({ msg: "Extra payment not found" });
    }

    return res.code(200).send(extraPayment);
  });

  fastify.post("/extra-payments", {
    schema: {
      tags: ["Extra Payments"],
      summary: "Create extra payments",
      description: "Creates one or more extra payments.",
      body: createExtraPaymentBodySchema,
      response: {
        201: createExtraPaymentResponseSchema,
        400: errorSchema
      }
    }
  }, async (req, res) => {
    if (!req.body) {
      return res.code(400).send({ msg: "Request body must include at least one extra payment" });
    }

    const extraPayments = Array.isArray(req.body) ? req.body : [req.body];

    if (extraPayments.length === 0 || extraPayments.some(extraPayment => !extraPayment)) {
      return res.code(400).send({ msg: "Request body must include at least one extra payment" });
    }

    const createdExtraPayments = await ExtraPaymentService.addExtraPayment(extraPayments);

    return res.code(201).send(Array.isArray(req.body) ? createdExtraPayments : createdExtraPayments[0]);
  });

  fastify.put("/extra-payments/:id", {
    schema: {
      tags: ["Extra Payments"],
      summary: "Update extra payment",
      description: "Updates an extra payment.",
      params: idParamSchema,
      body: extraPaymentInputSchema,
      response: {
        200: extraPaymentSchema,
        404: errorSchema
      }
    }
  }, async (req, res) => {
    const { /** @type {number} */ id } = req.params;
    const updatedExtraPayment = await ExtraPaymentService.updateExtraPayment({
      ...req.body,
      id
    });

    if (!updatedExtraPayment) {
      return res.code(404).send({ msg: "Extra payment not found" });
    }

    return res.code(200).send(updatedExtraPayment);
  });

  fastify.delete("/extra-payments/:id", {
    schema: {
      tags: ["Extra Payments"],
      summary: "Delete extra payment",
      description: "Deletes an extra payment.",
      params: idParamSchema,
      response: {
        200: extraPaymentSchema,
        404: errorSchema
      }
    }
  }, async (req, res) => {
    const { /** @type {number} */ id } = req.params;
    const deletedExtraPayment = await ExtraPaymentService.deleteExtraPayment(id);

    if (!deletedExtraPayment) {
      return res.code(404).send({ msg: "Extra payment not found" });
    }

    return res.code(200).send(deletedExtraPayment);
  });

  done();
}

export { extraPaymentRoutes }
