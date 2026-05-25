import { neon } from '@neondatabase/serverless';

function db() {
  return neon(process.env.DATABASE_URL!);
}

export default db;

export async function initDB() {
  const sql = db();
  await sql`
    CREATE TABLE IF NOT EXISTS qr_codes (
      id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      code        VARCHAR(12) UNIQUE NOT NULL,
      status      VARCHAR(20) DEFAULT 'pending',
      admin_note  TEXT,
      default_message TEXT,
      default_image_url TEXT,
      created_at  TIMESTAMPTZ DEFAULT NOW(),
      deleted_at  TIMESTAMPTZ
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS content (
      id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      qr_code_id  UUID REFERENCES qr_codes(id) ON DELETE CASCADE,
      email       VARCHAR(255) NOT NULL,
      message     TEXT,
      video_url   TEXT,
      image_url   TEXT,
      sender_name VARCHAR(255),
      video_fit   VARCHAR(10) DEFAULT 'contain',
      video_obj_x INTEGER     DEFAULT 50,
      video_obj_y INTEGER     DEFAULT 50,
      created_at  TIMESTAMPTZ DEFAULT NOW()
    )
  `;
  // Migrate existing content rows (idempotent)
  await sql`ALTER TABLE content ADD COLUMN IF NOT EXISTS video_fit   VARCHAR(10) DEFAULT 'contain'`;
  await sql`ALTER TABLE content ADD COLUMN IF NOT EXISTS video_obj_x INTEGER     DEFAULT 50`;
  await sql`ALTER TABLE content ADD COLUMN IF NOT EXISTS video_obj_y INTEGER     DEFAULT 50`;

  await sql`
    CREATE TABLE IF NOT EXISTS verifications (
      id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      qr_code_id  UUID REFERENCES qr_codes(id) ON DELETE CASCADE,
      email       VARCHAR(255) NOT NULL,
      code        VARCHAR(6) NOT NULL,
      verified    BOOLEAN DEFAULT FALSE,
      expires_at  TIMESTAMPTZ NOT NULL,
      created_at  TIMESTAMPTZ DEFAULT NOW()
    )
  `;
}

export async function getQRCode(code: string) {
  const sql = db();
  const rows = await sql`
    SELECT * FROM qr_codes WHERE code = ${code} AND deleted_at IS NULL LIMIT 1
  `;
  return rows[0] || null;
}

export async function getContent(qrCodeId: string) {
  const sql = db();
  const rows = await sql`
    SELECT * FROM content WHERE qr_code_id = ${qrCodeId} LIMIT 1
  `;
  return rows[0] || null;
}

export async function getAllContent() {
  // Returns every content row joined with its qr_code, including those whose
  // QR has been soft-deleted (deleted_at IS NOT NULL). The flag `qr_deleted`
  // lets the admin distinguish active from orphaned content.
  const sql = db();
  return sql`
    SELECT
      c.id            AS content_id,
      c.qr_code_id,
      c.email,
      c.sender_name,
      c.message,
      c.video_url,
      c.image_url,
      c.video_fit,
      c.video_obj_x,
      c.video_obj_y,
      c.created_at    AS content_created_at,
      q.code          AS qr_code,
      q.status        AS qr_status,
      q.deleted_at    AS qr_deleted_at,
      q.admin_note    AS qr_admin_note,
      (q.deleted_at IS NOT NULL) AS qr_deleted
    FROM content c
    LEFT JOIN qr_codes q ON q.id = c.qr_code_id
    ORDER BY c.created_at DESC
  `;
}

export async function deleteContent(contentId: string) {
  const sql = db();
  const rows = await sql`SELECT video_url, image_url FROM content WHERE id = ${contentId} LIMIT 1`;
  const row = rows[0];
  await sql`DELETE FROM content WHERE id = ${contentId}`;
  return row || null;
}

export async function getAllQRCodes() {
  const sql = db();
  return sql`
    SELECT
      q.*,
      c.id AS content_id,
      c.email,
      c.sender_name,
      c.message,
      c.video_url,
      c.image_url,
      c.video_fit,
      c.video_obj_x,
      c.video_obj_y,
      c.created_at AS content_created_at
    FROM qr_codes q
    LEFT JOIN content c ON c.qr_code_id = q.id
    WHERE q.deleted_at IS NULL
    ORDER BY q.created_at DESC
  `;
}
