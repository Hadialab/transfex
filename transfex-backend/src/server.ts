import { app } from './app';
import { env } from './config/env';
import { logger } from './config/logger';
import { pool } from './db/pool';

const server = app.listen(env.PORT, () => {
  logger.info(`transfex-backend listening on port ${env.PORT} (${env.NODE_ENV})`);
});

async function shutdown(signal: string) {
  logger.info(`${signal} received, shutting down`);
  server.close(async () => {
    await pool.end();
    process.exit(0);
  });
  // Force-exit if something hangs.
  setTimeout(() => process.exit(1), 10_000).unref();
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
