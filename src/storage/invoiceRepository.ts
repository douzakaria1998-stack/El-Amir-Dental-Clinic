import type { Invoice } from '../types/invoice';
import { idb, invoiceStore, metaStore } from './db';
import { uid } from '../utils/format';

export interface InvoiceRepository {
  list(): Promise<Invoice[]>;
  get(id: string): Promise<Invoice | undefined>;
  /** Creates (assigns id + number) or updates an invoice. Returns the stored invoice. */
  save(invoice: Invoice): Promise<Invoice>;
  remove(id: string): Promise<void>;
  replaceAll(invoices: Invoice[], counters: Record<string, number>): Promise<void>;
  counters(): Promise<Record<string, number>>;
}

const COUNTERS_KEY = 'invoiceCounters';

async function nextNumber(dateIso: string): Promise<string> {
  const year = /^\d{4}/.exec(dateIso)?.[0] ?? String(new Date().getFullYear());
  const counters = ((await idb.get(COUNTERS_KEY, metaStore)) as Record<string, number> | undefined) ?? {};
  const next = (counters[year] ?? 0) + 1;
  counters[year] = next;
  await idb.set(COUNTERS_KEY, counters, metaStore);
  return `${year}-${String(next).padStart(4, '0')}`;
}

export const localInvoiceRepository: InvoiceRepository = {
  async list() {
    const all = await idb.entries<string, Invoice>(invoiceStore);
    return all.map(([, v]) => v).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  },

  async get(id) {
    return idb.get<Invoice>(id, invoiceStore);
  },

  async save(invoice) {
    const now = new Date().toISOString();
    const isNew = !invoice.id || invoice.id === 'draft' || !(await idb.get(invoice.id, invoiceStore));
    const stored: Invoice = {
      ...invoice,
      id: isNew ? uid() : invoice.id,
      number: invoice.number || (await nextNumber(invoice.invoiceDate)),
      createdAt: isNew ? now : invoice.createdAt,
      updatedAt: now,
    };
    await idb.set(stored.id, stored, invoiceStore);
    return stored;
  },

  async remove(id) {
    await idb.del(id, invoiceStore);
  },

  async replaceAll(invoices, counters) {
    await idb.clear(invoiceStore);
    for (const inv of invoices) await idb.set(inv.id, inv, invoiceStore);
    await idb.set(COUNTERS_KEY, counters, metaStore);
  },

  async counters() {
    return ((await idb.get(COUNTERS_KEY, metaStore)) as Record<string, number> | undefined) ?? {};
  },
};

export const invoiceRepository: InvoiceRepository = localInvoiceRepository;
