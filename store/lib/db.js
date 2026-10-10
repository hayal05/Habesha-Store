import pg from 'pg';

// Neon (Postgres). DATABASE_URL is the connection string from the Neon dashboard (use the pooled one).
// The pool is created on first use, not on import, so `next build` never needs a database.

// BIGINT and COUNT(*) arrive as strings by default. Every value here is far below 2^53, so numbers are safe.
pg.types.setTypeParser(20, Number);

function pool() {
  if (globalThis.__pool) return globalThis.__pool;
  if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is not set');
  const p = new pg.Pool({
    connectionString: process.env.DATABASE_URL,
    max: 10,
    idleTimeoutMillis: 10_000,        // drop idle connections before Neon suspends the compute and closes them
    connectionTimeoutMillis: 15_000,  // a suspended Neon compute needs a moment to wake up
    keepAlive: true,
  });
  p.on('error', (e) => console.error('Database pool error:', e.message));   // an idle client dying must not crash the server
  return (globalThis.__pool = p);
}

export const query = (text, params) => pool().query(text, params);
export const rows = async (text, params) => (await query(text, params)).rows;
export const row = async (text, params) => (await query(text, params)).rows[0] ?? null;

// Runs fn(client) between BEGIN and COMMIT on one connection; rolls back and rethrows if fn throws.
export async function transaction(fn) {
  const client = await pool().connect();
  try {
    await client.query('BEGIN');
    const result = await fn(client);
    await client.query('COMMIT');
    return result;
  } catch (e) {
    await client.query('ROLLBACK').catch(() => {});
    throw e;
  } finally {
    client.release();
  }
}
