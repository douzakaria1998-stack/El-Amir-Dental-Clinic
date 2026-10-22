import fs from 'node:fs';
import path from 'node:path';
import { neon } from '@neondatabase/serverless';

const envPath = path.resolve(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
  const content = fs.readFileSync(envPath, 'utf8');
  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const idx = trimmed.indexOf('=');
    if (idx !== -1) {
      const key = trimmed.slice(0, idx).trim();
      const val = trimmed.slice(idx + 1).trim().replace(/^["']|["']$/g, '');
      process.env[key] = val;
    }
  }
}

const dbUrl = process.env.DATABASE_URL;
if (!dbUrl) {
  console.error('DATABASE_URL not found');
  process.exit(1);
}

const sql = neon(dbUrl);

console.log('Initializing Neon Postgres schema for El Amir Dental Clinic...');

await sql`
  CREATE TABLE IF NOT EXISTS invoice_counters (
    year VARCHAR(10) PRIMARY KEY,
    last_number INTEGER NOT NULL DEFAULT 0,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  );
`;

await sql`
  CREATE TABLE IF NOT EXISTS invoices (
    id VARCHAR(64) PRIMARY KEY,
    number VARCHAR(32) NOT NULL,
    patient_name VARCHAR(255) NOT NULL,
    patient_phone VARCHAR(64),
    patient_address TEXT,
    invoice_date VARCHAR(32) NOT NULL,
    total_amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
    data JSONB NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  );
`;

await sql`
  CREATE INDEX IF NOT EXISTS idx_invoices_created_at ON invoices(created_at DESC);
`;

await sql`
  CREATE INDEX IF NOT EXISTS idx_invoices_patient_name ON invoices(patient_name);
`;

await sql`
  CREATE TABLE IF NOT EXISTS clinic_settings (
    id VARCHAR(32) PRIMARY KEY DEFAULT 'settings',
    data JSONB NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  );
`;

console.log('Schema created successfully in Neon Postgres!');
