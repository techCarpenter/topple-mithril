import { apiRoutes, extraPaymentRoutes, userRoutes, loanRoutes, snapshotRoutes, snowballAdjustmentRoutes } from './routes/index.js';
import { fastifyStatic } from '@fastify/static';
import fastifySwagger from '@fastify/swagger';
import fastifySwaggerUi from '@fastify/swagger-ui';
import path from 'path';
import { fileURLToPath } from 'url';
import { db } from './db.js';
import Fastify from 'fastify';

const SERVER_DIR = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.resolve(SERVER_DIR, "..");
const DIST_DIR = process.env.DIST_DIR ?? path.resolve(PROJECT_ROOT, "dist");
const LOG_DIR = process.env.LOG_DIR ?? path.resolve(PROJECT_ROOT, "logs");

const envToLogger = {
  development: {
    transport: {
      target: 'pino-pretty',
      options: {
        ignore: 'pid,hostname',
        messageFormat: '{msg} [id={reqId} {req.method} {req.url}]'
      },
    },
  },
  production: {
    transport: {
      target: 'pino-roll',
      options: {
        ignore: 'pid',
        messageFormat: '{msg} [id={reqId} {req.method} {req.url}]',
        file: path.resolve(LOG_DIR, 'log'),
        frequency: 'daily',
        dateFormat: "yyyyMMdd",
        mkdir: true
      }
    }
  }
}

const fastify = Fastify({
  logger: envToLogger[process.env.NODE_ENV] ?? true
});

fastify.setErrorHandler((error, _request, reply) => {
  const statusCode = error.validation ? 400 : (error.statusCode ?? 500);
  return reply.code(statusCode).send({ msg: statusCode === 400 ? error.message : "The request could not be completed." });
});

async function main() {
  await fastify.register(fastifySwagger, {
    openapi: {
      info: {
        title: "Topple API",
        description: "API documentation for Topple resources and calculations.",
        version: "1.0.0"
      },
      tags: [
        { name: "Meta", description: "API discovery endpoints" },
        { name: "Users", description: "User resources" },
        { name: "Loans", description: "Loan resources" },
        { name: "Snapshots", description: "Balance snapshot resources" },
        { name: "Extra Payments", description: "Extra payment resources" },
        { name: "Snowball Adjustments", description: "Snowball adjustment resources" }
      ]
    }
  });
  await fastify.register(fastifySwaggerUi, {
    routePrefix: "/docs",
    uiConfig: {
      docExpansion: "list",
      deepLinking: false
    }
  });

  await fastify.register(apiRoutes, { prefix: "api/v1" });
  await fastify.register(userRoutes, { prefix: "api/v1" });
  await fastify.register(loanRoutes, { prefix: "api/v1" });
  await fastify.register(snapshotRoutes, { prefix: "api/v1" });
  await fastify.register(extraPaymentRoutes, { prefix: "api/v1" });
  await fastify.register(snowballAdjustmentRoutes, { prefix: "api/v1" });

  //serve static files in production
  if (process.env.NODE_ENV === 'production') {
    fastify.register(fastifyStatic, {
      root: DIST_DIR
    });
  }

  // Run the server!
  try {
    const host = process.env.HOST ?? "0.0.0.0";
    const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

    await fastify.listen({ host, port });
  } catch (err) {
    fastify.log.error(err)
    process.exit(1);
  }
}

//graceful shutdown listeners
["SIGINT", "SIGTERM"].forEach(signal => {
  process.on(signal, async () => {
    try {
      await fastify.close(() => {
        db.close()
        process.exit(0);
      });
    }
    catch {
      process.exit(1)
    }

  });
});

main();
