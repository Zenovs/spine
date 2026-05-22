import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL!);

export default sql;

export async function initDB() {
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
      created_at  TIMESTAMPTZ DEFAULT NOW()
    )
  `;

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
  const rows = await sql`
    SELECT * FROM qr_codes WHERE code = ${code} AND deleted_at IS NULL LIMIT 1
  `;
  return rows[0] || null;
}

export async function getContent(qrCodeId: string) {
  const rows = await sql`
    SELECT * FROM content WHERE qr_code_id = ${qrCodeId} LIMIT 1
  `;
  return rows[0] || null;
}

export async function getAllQRCodes() {
  return sql`
    SELECT
      q.*,
      c.id AS content_id,
      c.email,
      c.sender_name,
      c.created_at AS content_created_at
    FROM qr_codes q
    LEFT JOIN content c ON c.qr_code_id = q.id
    WHERE q.deleted_at IS NULL
    ORDER BY q.created_at DESC
  `;
}
