import fs from 'node:fs';
import path from 'node:path';
import { neon } from '@neondatabase/serverless';

// Read .env.local
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
  console.error('DATABASE_URL not found in .env.local');
  process.exit(1);
}

console.log('Testing connection to Neon Postgres...');
try {
  const sql = neon(dbUrl);
  const result = await sql`SELECT version(), current_database(), current_user, now()`;
  console.log('Successfully connected to Neon Postgres!');
  console.log('Database:', result[0].current_database);
  console.log('User:', result[0].current_user);
  console.log('Version:', result[0].version);
  console.log('Server Time:', result[0].now);
} catch (err) {
  console.error('Connection failed:', err);
  process.exit(1);
}
