import { query } from "@/lib/postgres";

export type Publication = {
  id: string;
  title: string;
  contentType: string;
  canonicalizedContent: string;
  sourceUrl?: string;
  publisherWallet: string;
  contentHash: string;
  parentHash?: string;
  txHash: string;
  blockTimestamp: string;
  status: "PENDING" | "CONFIRMED" | "FAILED";
  createdAt: string;
};

export type SyncSummary = {
  updated: number;
  confirmed: number;
  failed: number;
};

type PublicationRow = {
  id: string;
  title: string;
  content_type: string;
  canonicalized_content: string;
  source_url: string | null;
  publisher_wallet: string;
  content_hash: string;
  parent_hash: string | null;
  tx_hash: string;
  block_timestamp: Date | string;
  status: Publication["status"];
  created_at: Date | string;
};

function toIsoString(value: Date | string): string {
  return value instanceof Date ? value.toISOString() : new Date(value).toISOString();
}

function toTimestampMs(value: Date | string): number {
  return value instanceof Date ? value.getTime() : new Date(value).getTime();
}

function mapPublicationRow(row: PublicationRow): Publication {
  return {
    id: row.id,
    title: row.title,
    contentType: row.content_type,
    canonicalizedContent: row.canonicalized_content,
    sourceUrl: row.source_url || undefined,
    publisherWallet: row.publisher_wallet,
    contentHash: row.content_hash,
    parentHash: row.parent_hash || undefined,
    txHash: row.tx_hash,
    blockTimestamp: toIsoString(row.block_timestamp),
    status: row.status,
    createdAt: toIsoString(row.created_at),
  };
}

export async function getPublications(): Promise<Publication[]> {
  const result = await query<PublicationRow>(
    `SELECT id, title, content_type, canonicalized_content, source_url, publisher_wallet, content_hash, parent_hash,
            tx_hash, block_timestamp, status, created_at
     FROM publications`
  );

  return result.rows.map(mapPublicationRow);
}

export async function getPublicationById(id: string): Promise<Publication | null> {
  const result = await query<PublicationRow>(
    `SELECT id, title, content_type, canonicalized_content, source_url, publisher_wallet, content_hash, parent_hash,
            tx_hash, block_timestamp, status, created_at
     FROM publications
     WHERE id = $1
     LIMIT 1`,
    [id]
  );

  if (result.rows.length === 0) {
    return null;
  }

  return mapPublicationRow(result.rows[0]);
}

export async function getPublicationByTxHash(txHash: string): Promise<Publication | null> {
  const result = await query<PublicationRow>(
    `SELECT id, title, content_type, canonicalized_content, source_url, publisher_wallet, content_hash, parent_hash,
            tx_hash, block_timestamp, status, created_at
     FROM publications
     WHERE LOWER(tx_hash) = LOWER($1)
     LIMIT 1`,
    [txHash]
  );

  if (result.rows.length === 0) {
    return null;
  }

  return mapPublicationRow(result.rows[0]);
}

export async function getPublicationsByWallet(wallet: string): Promise<Publication[]> {
  const result = await query<PublicationRow>(
    `SELECT id, title, content_type, canonicalized_content, source_url, publisher_wallet, content_hash, parent_hash,
            tx_hash, block_timestamp, status, created_at
     FROM publications
     WHERE LOWER(publisher_wallet) = LOWER($1)`,
    [wallet]
  );

  return result.rows.map(mapPublicationRow);
}

export async function getPublicationsByHash(hash: string): Promise<Publication[]> {
  const result = await query<PublicationRow>(
    `SELECT id, title, content_type, canonicalized_content, source_url, publisher_wallet, content_hash, parent_hash,
            tx_hash, block_timestamp, status, created_at
     FROM publications
     WHERE LOWER(content_hash) = LOWER($1)`,
    [hash]
  );

  return result.rows.map(mapPublicationRow);
}

export async function addPublication(publication: Publication): Promise<void> {
  await query(
    `INSERT INTO publications (
      id, title, content_type, canonicalized_content, source_url, publisher_wallet, content_hash, parent_hash,
      tx_hash, block_timestamp, status, created_at
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
    [
      publication.id,
      publication.title,
      publication.contentType,
      publication.canonicalizedContent,
      publication.sourceUrl || null,
      publication.publisherWallet,
      publication.contentHash,
      publication.parentHash || null,
      publication.txHash,
      publication.blockTimestamp,
      publication.status,
      publication.createdAt,
    ]
  );
}

export async function updatePublicationStatus(
  id: string,
  status: Publication["status"],
  txHash?: string
): Promise<boolean> {
  const result = await query(
    `UPDATE publications
     SET status = $2,
         block_timestamp = NOW(),
         tx_hash = COALESCE($3, tx_hash)
     WHERE id = $1`,
    [id, status, txHash || null]
  );

  return (result.rowCount ?? 0) > 0;
}

export async function synchronizePendingPublications(confirmAfterMs = 45000): Promise<SyncSummary> {
  const pendingResult = await query<PublicationRow>(
    `SELECT id, tx_hash, created_at
     FROM publications
     WHERE status = 'PENDING'`
  );

  let updated = 0;
  let confirmed = 0;
  let failed = 0;
  const nowMs = Date.now();

  for (const publication of pendingResult.rows) {
    const ageMs = nowMs - toTimestampMs(publication.created_at);
    if (ageMs < confirmAfterMs) {
      continue;
    }

    const lastNibble = publication.tx_hash.at(-1)?.toLowerCase() ?? "0";
    const shouldFail = ["a", "b", "c", "d", "e", "f"].includes(lastNibble);
    const nextStatus: Publication["status"] = shouldFail ? "FAILED" : "CONFIRMED";

    await query(
      `UPDATE publications
       SET status = $2,
           block_timestamp = NOW()
       WHERE id = $1`,
      [publication.id, nextStatus]
    );

    updated += 1;
    if (nextStatus === "CONFIRMED") confirmed += 1;
    if (nextStatus === "FAILED") failed += 1;
  }

  return { updated, confirmed, failed };
}

export async function getVersionChain(contentHash: string): Promise<{ parent: Publication | null; children: Publication[] }> {
  const parent = await getPublicationsByHash(contentHash);
  if (parent.length === 0) {
    return { parent: null, children: [] };
  }

  const childrenResult = await query<PublicationRow>(
    `SELECT id, title, content_type, canonicalized_content, source_url, publisher_wallet, content_hash, parent_hash,
            tx_hash, block_timestamp, status, created_at
     FROM publications
     WHERE LOWER(parent_hash) = LOWER($1)`,
    [contentHash]
  );

  return {
    parent: parent[0],
    children: childrenResult.rows.map(mapPublicationRow),
  };
}

export async function getNextVersion(contentHash: string): Promise<Publication | null> {
  const result = await query<PublicationRow>(
    `SELECT id, title, content_type, canonicalized_content, source_url, publisher_wallet, content_hash, parent_hash,
            tx_hash, block_timestamp, status, created_at
     FROM publications
     WHERE LOWER(parent_hash) = LOWER($1)
     ORDER BY created_at ASC
     LIMIT 1`,
    [contentHash]
  );

  if (result.rows.length === 0) {
    return null;
  }

  return mapPublicationRow(result.rows[0]);
}

export async function getPreviousVersion(parentHash: string): Promise<Publication | null> {
  const result = await query<PublicationRow>(
    `SELECT id, title, content_type, canonicalized_content, source_url, publisher_wallet, content_hash, parent_hash,
            tx_hash, block_timestamp, status, created_at
     FROM publications
     WHERE LOWER(content_hash) = LOWER($1)
     LIMIT 1`,
    [parentHash]
  );

  if (result.rows.length === 0) {
    return null;
  }

  return mapPublicationRow(result.rows[0]);
}

export async function deletePublicationByIdAndWallet(id: string, wallet: string): Promise<{
  deleted: boolean;
  reason?: "not-found" | "forbidden";
}> {
  const publication = await getPublicationById(id);

  if (!publication) {
    return { deleted: false, reason: "not-found" };
  }

  if (publication.publisherWallet.toLowerCase() !== wallet.toLowerCase()) {
    return { deleted: false, reason: "forbidden" };
  }

  await query("DELETE FROM publications WHERE id = $1", [id]);
  return { deleted: true };
}
