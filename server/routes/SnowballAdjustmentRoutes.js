import {
  createSnowballAdjustmentBodySchema,
  createSnowballAdjustmentResponseSchema,
  errorSchema,
  idParamSchema,
  snowballAdjustmentInputSchema,
  snowballAdjustmentListSchema,
  snowballAdjustmentSchema
} from "../schemas.js";
import { SnowballAdjustmentService } from "../services/index.js";

/**
 * @type {import("fastify").FastifyPluginCallback}
 */
function snowballAdjustmentRoutes(fastify, opts, done) {
  fastify.get("/snowball-adjustments", {
    schema: {
      tags: ["Snowball Adjustments"],
      summary: "List snowball adjustments",
      description: "Returns all snowball adjustments for the current user.",
      response: {
        200: snowballAdjustmentListSchema
      }
    }
  }, async (_, res) => {
    return res.code(200).send(await SnowballAdjustmentService.getSnowballAdjustments());
  });

  fastify.get("/snowball-adjustments/:id", {
    schema: {
      tags: ["Snowball Adjustments"],
      summary: "Get snowball adjustment by id",
      description: "Returns a single snowball adjustment by id.",
      params: idParamSchema,
      response: {
        200: snowballAdjustmentSchema,
        404: errorSchema
      }
    }
  }, async (req, res) => {
    const { /** @type {number} */ id } = req.params;
    const snowballAdjustment = await SnowballAdjustmentService.getSnowballAdjustmentById(id);

    if (!snowballAdjustment) {
      return res.code(404).send({ msg: "Snowball adjustment not found" });
    }

    return res.code(200).send(snowballAdjustment);
  });

  fastify.post("/snowball-adjustments", {
    schema: {
      tags: ["Snowball Adjustments"],
      summary: "Create snowball adjustments",
      description: "Creates one or more snowball adjustments.",
      body: createSnowballAdjustmentBodySchema,
      response: {
        201: createSnowballAdjustmentResponseSchema,
        400: errorSchema
      }
    }
  }, async (req, res) => {
    if (!req.body) {
      return res.code(400).send({ msg: "Request body must include at least one snowball adjustment" });
    }

    const snowballAdjustments = Array.isArray(req.body) ? req.body : [req.body];

    if (snowballAdjustments.length === 0 || snowballAdjustments.some(snowballAdjustment => !snowballAdjustment)) {
      return res.code(400).send({ msg: "Request body must include at least one snowball adjustment" });
    }

    const createdSnowballAdjustments = await SnowballAdjustmentService.addSnowballAdjustment(snowballAdjustments);

    return res.code(201).send(Array.isArray(req.body) ? createdSnowballAdjustments : createdSnowballAdjustments[0]);
  });

  fastify.put("/snowball-adjustments/:id", {
    schema: {
      tags: ["Snowball Adjustments"],
      summary: "Update snowball adjustment",
      description: "Updates a snowball adjustment.",
      params: idParamSchema,
      body: snowballAdjustmentInputSchema,
      response: {
        200: snowballAdjustmentSchema,
        404: errorSchema
      }
    }
  }, async (req, res) => {
    const { /** @type {number} */ id } = req.params;
    const updatedSnowballAdjustment = await SnowballAdjustmentService.updateSnowballAdjustment({
      ...req.body,
      id
    });

    if (!updatedSnowballAdjustment) {
      return res.code(404).send({ msg: "Snowball adjustment not found" });
    }

    return res.code(200).send(updatedSnowballAdjustment);
  });

  fastify.delete("/snowball-adjustments/:id", {
    schema: {
      tags: ["Snowball Adjustments"],
      summary: "Delete snowball adjustment",
      description: "Deletes a snowball adjustment.",
      params: idParamSchema,
      response: {
        200: snowballAdjustmentSchema,
        404: errorSchema
      }
    }
  }, async (req, res) => {
    const { /** @type {number} */ id } = req.params;
    const deletedSnowballAdjustment = await SnowballAdjustmentService.deleteSnowballAdjustment(id);

    if (!deletedSnowballAdjustment) {
      return res.code(404).send({ msg: "Snowball adjustment not found" });
    }

    return res.code(200).send(deletedSnowballAdjustment);
  });

  done();
}

export { snowballAdjustmentRoutes }
