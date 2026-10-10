// Creates the tables in Neon if they are missing. Run: npm run migrate (needs DATABASE_URL).
import fs from 'node:fs';
import pg from 'pg';

const url = process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL;   // the direct (non-pooled) URL is best for schema changes
if (!url) { console.error('Set DATABASE_URL to your Neon connection string.'); process.exit(1); }

const client = new pg.Client({ connectionString: url, connectionTimeoutMillis: 30_000 });
try {
  await client.connect();
  await client.query(fs.readFileSync(new URL('../schema.sql', import.meta.url), 'utf8'));
  console.log('Database schema is up to date.');
} catch (e) {
  console.error('Migration failed:', e.message);
  process.exitCode = 1;
} finally {
  await client.end().catch(() => {});
}
