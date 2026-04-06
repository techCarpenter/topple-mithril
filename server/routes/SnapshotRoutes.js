import {
  createSnapshotBodySchema,
  createSnapshotResponseSchema,
  errorSchema,
  idParamSchema,
  snapshotInputSchema,
  snapshotListSchema,
  snapshotSchema
} from "../schemas.js";
import { SnapshotService } from "../services/index.js";

/**
 * @type {import("fastify").FastifyPluginCallback}
 */
function snapshotRoutes(fastify, opts, done) {
  fastify.get("/snapshots", {
    schema: {
      tags: ["Snapshots"],
      summary: "List snapshots",
      description: "Returns all balance snapshots for the current user.",
      response: {
        200: snapshotListSchema
      }
    }
  }, async (_, res) => {
    return res.code(200).send(await SnapshotService.getSnapshots());
  });

  fastify.get("/snapshots/:id", {
    schema: {
      tags: ["Snapshots"],
      summary: "Get snapshot by id",
      description: "Returns a single balance snapshot by id.",
      params: idParamSchema,
      response: {
        200: snapshotSchema,
        404: errorSchema
      }
    }
  }, async (req, res) => {
    const { /** @type {number} */ id } = req.params;
    const snapshot = await SnapshotService.getSnapshotById(id);

    if (!snapshot) {
      return res.code(404).send({ msg: "Snapshot not found" });
    }

    return res.code(200).send(snapshot);
  });

  fastify.post("/snapshots", {
    schema: {
      tags: ["Snapshots"],
      summary: "Create snapshots",
      description: "Creates one or more balance snapshots.",
      body: createSnapshotBodySchema,
      response: {
        201: createSnapshotResponseSchema,
        400: errorSchema
      }
    }
  }, async (req, res) => {
    if (!req.body) {
      return res.code(400).send({ msg: "Request body must include at least one snapshot" });
    }

    const snapshots = Array.isArray(req.body) ? req.body : [req.body];

    if (snapshots.length === 0 || snapshots.some(snapshot => !snapshot)) {
      return res.code(400).send({ msg: "Request body must include at least one snapshot" });
    }

    const createdSnapshots = await SnapshotService.addSnapshot(snapshots);

    return res.code(201).send(Array.isArray(req.body) ? createdSnapshots : createdSnapshots[0]);
  });

  fastify.put("/snapshots/:id", {
    schema: {
      tags: ["Snapshots"],
      summary: "Update snapshot",
      description: "Updates a balance snapshot.",
      params: idParamSchema,
      body: snapshotInputSchema,
      response: {
        200: snapshotSchema,
        404: errorSchema
      }
    }
  }, async (req, res) => {
    const { /** @type {number} */ id } = req.params;
    const updatedSnapshot = await SnapshotService.updateSnapshot({
      ...req.body,
      id
    });

    if (!updatedSnapshot) {
      return res.code(404).send({ msg: "Snapshot not found" });
    }

    return res.code(200).send(updatedSnapshot);
  });

  fastify.delete("/snapshots/:id", {
    schema: {
      tags: ["Snapshots"],
      summary: "Delete snapshot",
      description: "Deletes a balance snapshot.",
      params: idParamSchema,
      response: {
        200: snapshotSchema,
        404: errorSchema
      }
    }
  }, async (req, res) => {
    const { /** @type {number} */ id } = req.params;
    const deletedSnapshot = await SnapshotService.deleteSnapshot(id);

    if (!deletedSnapshot) {
      return res.code(404).send({ msg: "Snapshot not found" });
    }

    return res.code(200).send(deletedSnapshot);
  });

  done();
}

export { snapshotRoutes }
