import { userRoutes, loanRoutes } from './routes/index.js';
import { fastifyStatic } from '@fastify/static';
import path from 'path';
import { db } from './db.js';
import Fastify from 'fastify';

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
        file: path.resolve('logs', 'log'),
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

async function main() {
  await fastify.register(userRoutes, { prefix: "api/v1" });
  await fastify.register(loanRoutes, { prefix: "api/v1" });
  // await fastify.register(snapshotRoutes, { prefix: "v1"});

  //serve static files in production
  if (process.env.NODE_ENV === 'production') {
    fastify.register(fastifyStatic, {
      root: path.resolve('dist')
    });
  }

  // Run the server!
  try {
    let port = 3000;
    if (process.env.NODE_ENV === 'production' && process.env.PORT) {
      port = parseInt(process.env.PORT);
    }

    fastify.listen({ port });
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
