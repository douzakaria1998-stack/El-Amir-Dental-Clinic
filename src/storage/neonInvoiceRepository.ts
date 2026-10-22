import type { Invoice } from '../types/invoice';
import type { InvoiceRepository } from './invoiceRepository';
import { getNeonSql } from './neonClient';
import { uid } from '../utils/format';
import { idb, invoiceStore, metaStore } from './db';

const COUNTERS_KEY = 'invoiceCounters';

async function nextNeonNumber(dateIso: string): Promise<string> {
  const sql = getNeonSql();
  const year = /^\d{4}/.exec(dateIso)?.[0] ?? String(new Date().getFullYear());

  if (!sql) {
    const counters = ((await idb.get(COUNTERS_KEY, metaStore)) as Record<string, number> | undefined) ?? {};
    const next = (counters[year] ?? 0) + 1;
    counters[year] = next;
    await idb.set(COUNTERS_KEY, counters, metaStore);
    return `${year}-${String(next).padStart(4, '0')}`;
  }

  const rows = await sql`
    INSERT INTO invoice_counters (year, last_number, updated_at)
    VALUES (${year}, 1, NOW())
    ON CONFLICT (year)
    DO UPDATE SET last_number = invoice_counters.last_number + 1, updated_at = NOW()
    RETURNING last_number;
  `;

  const next = Number(rows[0].last_number);
  return `${year}-${String(next).padStart(4, '0')}`;
}

export const neonInvoiceRepository: InvoiceRepository = {
  async list() {
    const sql = getNeonSql();
    if (!sql) {
      const all = await idb.entries<string, Invoice>(invoiceStore);
      return all.map(([, v]) => v).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    }

    try {
      const rows = await sql`
        SELECT data FROM invoices ORDER BY created_at DESC;
      `;
      const invoices = rows.map((r) => (typeof r.data === 'string' ? JSON.parse(r.data) : r.data) as Invoice);

      // Cache locally for offline readiness
      for (const inv of invoices) {
        await idb.set(inv.id, inv, invoiceStore);
      }
      return invoices;
    } catch (err) {
      console.warn('Neon list query failed, falling back to local cache:', err);
      const all = await idb.entries<string, Invoice>(invoiceStore);
      return all.map(([, v]) => v).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    }
  },

  async get(id) {
    const sql = getNeonSql();
    if (!sql) {
      return idb.get<Invoice>(id, invoiceStore);
    }

    try {
      const rows = await sql`
        SELECT data FROM invoices WHERE id = ${id} LIMIT 1;
      `;
      if (rows.length === 0) return undefined;
      const inv = (typeof rows[0].data === 'string' ? JSON.parse(rows[0].data) : rows[0].data) as Invoice;
      await idb.set(inv.id, inv, invoiceStore);
      return inv;
    } catch (err) {
      console.warn('Neon get query failed, falling back to local cache:', err);
      return idb.get<Invoice>(id, invoiceStore);
    }
  },

  async save(invoice) {
    const now = new Date().toISOString();
    const isNew = !invoice.id || invoice.id === 'draft';
    const finalId = isNew ? uid() : invoice.id;
    const finalNumber = invoice.number || (await nextNeonNumber(invoice.invoiceDate));

    const stored: Invoice = {
      ...invoice,
      id: finalId,
      number: finalNumber,
      createdAt: isNew ? now : invoice.createdAt,
      updatedAt: now,
    };

    // Always update local cache
    await idb.set(stored.id, stored, invoiceStore);

    const sql = getNeonSql();
    if (sql) {
      try {
        const patientName = `${stored.lastName} ${stored.firstName}`.trim() || 'Sans nom';
        const totalAmount = stored.acts.reduce((sum, a) => sum + (Number(a.fee) || 0), 0);

        await sql`
          INSERT INTO invoices (
            id, number, patient_name, patient_phone, patient_address,
            invoice_date, total_amount, data, created_at, updated_at
          ) VALUES (
            ${stored.id},
            ${stored.number},
            ${patientName},
            ${null},
            ${null},
            ${stored.invoiceDate},
            ${totalAmount},
            ${JSON.stringify(stored)},
            ${stored.createdAt},
            ${stored.updatedAt}
          )
          ON CONFLICT (id) DO UPDATE SET
            number = EXCLUDED.number,
            patient_name = EXCLUDED.patient_name,
            patient_phone = EXCLUDED.patient_phone,
            patient_address = EXCLUDED.patient_address,
            invoice_date = EXCLUDED.invoice_date,
            total_amount = EXCLUDED.total_amount,
            data = EXCLUDED.data,
            updated_at = EXCLUDED.updated_at;
        `;
      } catch (err) {
        console.error('Failed to sync invoice to Neon Postgres:', err);
      }
    }

    return stored;
  },

  async remove(id) {
    await idb.del(id, invoiceStore);
    const sql = getNeonSql();
    if (sql) {
      try {
        await sql`DELETE FROM invoices WHERE id = ${id};`;
      } catch (err) {
        console.error('Failed to delete invoice from Neon Postgres:', err);
      }
    }
  },

  async replaceAll(invoices, counters) {
    await idb.clear(invoiceStore);
    for (const inv of invoices) await idb.set(inv.id, inv, invoiceStore);
    await idb.set(COUNTERS_KEY, counters, metaStore);

    const sql = getNeonSql();
    if (sql) {
      try {
        await sql`TRUNCATE TABLE invoices;`;
        for (const stored of invoices) {
          const patientName = `${stored.lastName} ${stored.firstName}`.trim() || 'Sans nom';
          const totalAmount = stored.acts.reduce((sum, a) => sum + (Number(a.fee) || 0), 0);
          await sql`
            INSERT INTO invoices (
              id, number, patient_name, patient_phone, patient_address,
              invoice_date, total_amount, data, created_at, updated_at
            ) VALUES (
              ${stored.id},
              ${stored.number},
              ${patientName},
              ${null},
              ${null},
              ${stored.invoiceDate},
              ${totalAmount},
              ${JSON.stringify(stored)},
              ${stored.createdAt},
              ${stored.updatedAt}
            );
          `;
        }
        for (const [year, last] of Object.entries(counters)) {
          await sql`
            INSERT INTO invoice_counters (year, last_number, updated_at)
            VALUES (${year}, ${last}, NOW())
            ON CONFLICT (year) DO UPDATE SET last_number = EXCLUDED.last_number, updated_at = NOW();
          `;
        }
      } catch (err) {
        console.error('Failed to replace all in Neon Postgres:', err);
      }
    }
  },

  async counters() {
    const sql = getNeonSql();
    if (!sql) {
      return ((await idb.get(COUNTERS_KEY, metaStore)) as Record<string, number> | undefined) ?? {};
    }

    try {
      const rows = await sql`
        SELECT year, last_number FROM invoice_counters;
      `;
      const res: Record<string, number> = {};
      for (const r of rows) {
        res[String(r.year)] = Number(r.last_number);
      }
      return res;
    } catch (err) {
      console.warn('Neon counters query failed, using local store:', err);
      return ((await idb.get(COUNTERS_KEY, metaStore)) as Record<string, number> | undefined) ?? {};
    }
  },
};
