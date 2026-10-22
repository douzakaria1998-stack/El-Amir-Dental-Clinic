import { neon, type NeonQueryFunction } from '@neondatabase/serverless';

const getDatabaseUrl = (): string => {
  const envUrl =
    (import.meta.env.VITE_DATABASE_URL as string | undefined) ||
    (import.meta.env.DATABASE_URL as string | undefined) ||
    '';
  return envUrl.trim();
};

let sqlInstance: NeonQueryFunction<false, false> | null = null;

export function getNeonSql(): NeonQueryFunction<false, false> | null {
  const url = getDatabaseUrl();
  if (!url) return null;
  if (!sqlInstance) {
    sqlInstance = neon(url);
  }
  return sqlInstance;
}

export function isNeonConfigured(): boolean {
  return Boolean(getDatabaseUrl());
}

export async function checkNeonHealth(): Promise<{ ok: boolean; message?: string }> {
  try {
    const sql = getNeonSql();
    if (!sql) return { ok: false, message: 'Neon DATABASE_URL is not configured' };
    const res = await sql`SELECT 1 as alive, current_database() as db`;
    return { ok: true, message: `Connected to ${res[0].db}` };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return { ok: false, message: msg };
  }
}
