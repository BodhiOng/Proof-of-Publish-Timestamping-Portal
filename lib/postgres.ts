import { Pool, type QueryResult, type QueryResultRow } from "pg";

const DEFAULT_DATABASE_URL = "postgresql://postgres:postgres@127.0.0.1:5432/proof_publish";

declare global {
  var __proofPublishPgPool: Pool | undefined;
  var __proofPublishSchemaInit: Promise<void> | undefined;
}

function getPool(): Pool {
  if (!global.__proofPublishPgPool) {
    const connectionString = process.env.DATABASE_URL || DEFAULT_DATABASE_URL;
    global.__proofPublishPgPool = new Pool({ connectionString });
  }

  return global.__proofPublishPgPool;
}

async function initializeSchema(): Promise<void> {
  const pool = getPool();

  await pool.query(`
    CREATE TABLE IF NOT EXISTS accounts (
      wallet TEXT PRIMARY KEY,
      username TEXT NOT NULL UNIQUE,
      display_name TEXT NOT NULL,
      bio TEXT NOT NULL,
      avatar_url TEXT NOT NULL,
      website TEXT NOT NULL,
      location TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL,
      updated_at TIMESTAMPTZ NOT NULL
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS publications (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      content_type TEXT NOT NULL,
      canonicalized_content TEXT NOT NULL,
      source_url TEXT,
      publisher_wallet TEXT NOT NULL,
      content_hash TEXT NOT NULL UNIQUE,
      parent_hash TEXT,
      tx_hash TEXT NOT NULL,
      block_timestamp TIMESTAMPTZ NOT NULL,
      status TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL
    );
  `);

  await pool.query("CREATE INDEX IF NOT EXISTS idx_publications_wallet ON publications (publisher_wallet);");
  await pool.query("CREATE INDEX IF NOT EXISTS idx_publications_parent_hash ON publications (parent_hash);");
  await pool.query("CREATE INDEX IF NOT EXISTS idx_publications_content_hash ON publications (content_hash);");
}

async function ensureSchemaReady(): Promise<void> {
  if (!global.__proofPublishSchemaInit) {
    global.__proofPublishSchemaInit = initializeSchema();
  }

  try {
    await global.__proofPublishSchemaInit;
  } catch (error) {
    // Allow retry after transient/auth/config errors instead of pinning a rejected promise.
    global.__proofPublishSchemaInit = undefined;
    throw error;
  }
}

export async function query<T extends QueryResultRow = QueryResultRow>(
  text: string,
  values: unknown[] = []
): Promise<QueryResult<T>> {
  await ensureSchemaReady();
  const pool = getPool();
  return pool.query<T>(text, values);
}
