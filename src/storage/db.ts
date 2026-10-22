import { createStore, get, set, del, entries, clear } from 'idb-keyval';

/**
 * IndexedDB stores (via idb-keyval). Swap these repositories for HTTP
 * implementations to plug a backend in later — the UI only talks to the
 * repository interfaces.
 */
export const invoiceStore = createStore('elamir-invoices', 'invoices');
export const metaStore = createStore('elamir-meta', 'meta');

export const idb = { get, set, del, entries, clear };
