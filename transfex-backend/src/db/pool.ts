import { Pool, type QueryResultRow } from 'pg';
import { env, isProd } from '../config/env';
import { logger } from '../config/logger';

export const pool = new Pool({
  connectionString: env.DATABASE_URL,
  ssl: isProd ? { rejectUnauthorized: false } : undefined,
});

pool.on('error', (err) => {
  // A backend-idle-client error here would otherwise crash the process silently.
  logger.error({ err }, 'Unexpected error on idle PostgreSQL client');
});

/**
 * Thin wrapper around pool.query. Always use this (or a transaction client's
 * .query) with parameterized placeholders ($1, $2, ...) — never interpolate
 * values into the SQL string. That's the exact SQL-injection class from the
 * Coderaas audit.
 */
export async function query<T extends QueryResultRow = QueryResultRow>(
  text: string,
  params?: unknown[]
) {
  const start = Date.now();
  const result = await pool.query<T>(text, params);
  const duration = Date.now() - start;
  if (duration > 200) {
    logger.warn({ text, duration }, 'Slow query');
  }
  return result;
}

/**
 * Run a callback inside a transaction. Use for any multi-statement write
 * (e.g. creating a shipment + its line items) so a failure partway through
 * can't leave the database in a half-written state.
 */
export async function withTransaction<T>(fn: (client: import('pg').PoolClient) => Promise<T>): Promise<T> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await fn(client);
    await client.query('COMMIT');
    return result;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}
