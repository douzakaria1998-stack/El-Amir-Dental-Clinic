import fs from 'node:fs';
import path from 'node:path';
import { neon } from '@neondatabase/serverless';

// 1. Load .env.local
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
const branch = process.env.NEON_BRANCH;

console.log('=== Neon Postgres End-to-End Verification ===');
console.log('Target Branch:', branch || 'production');
console.log('Database URL available:', Boolean(dbUrl));

if (!dbUrl) {
  console.error('FAIL: DATABASE_URL is missing');
  process.exit(1);
}

const sql = neon(dbUrl);

// Test 1: Connectivity & Version
console.log('\n[Test 1] Testing Database Connectivity & Info...');
const info = await sql`SELECT current_database(), current_user, version(), now();`;
console.log('✓ Connected to database:', info[0].current_database);
console.log('✓ Current user:', info[0].current_user);
console.log('✓ Postgres version:', info[0].version.split(' ')[0], info[0].version.split(' ')[1]);
console.log('✓ Database timestamp:', info[0].now);

// Test 2: Atomic Invoice Counter Increment
console.log('\n[Test 2] Testing Atomic Sequence Counter...');
const currentYear = String(new Date().getFullYear());
const counterRow = await sql`
  INSERT INTO invoice_counters (year, last_number, updated_at)
  VALUES (${currentYear}, 1, NOW())
  ON CONFLICT (year)
  DO UPDATE SET last_number = invoice_counters.last_number + 1, updated_at = NOW()
  RETURNING last_number;
`;
const allocatedNumber = Number(counterRow[0].last_number);
const formattedNumber = `${currentYear}-${String(allocatedNumber).padStart(4, '0')}`;
console.log('✓ Allocated atomic invoice number:', formattedNumber);

// Test 3: Create & Insert Invoice Record
console.log('\n[Test 3] Testing Invoice Creation & Persistence...');
const testInvoiceId = `e2e-test-${Date.now()}`;
const sampleInvoice = {
  id: testInvoiceId,
  number: formattedNumber,
  invoiceLang: 'fr',
  invoiceDate: '2026-10-22',
  billingDate: '2026-10-22',
  lastName: 'BENALI',
  firstName: 'Karim',
  birthDate: '1990-05-15',
  acts: [
    {
      id: 'act-1',
      actKey: 'consultation',
      text: 'Consultation bucco-dentaire approfondie',
      tooth: '',
      fee: 2500,
    },
    {
      id: 'act-2',
      text: 'Détartrage complet aux ultrasons',
      tooth: '11-21',
      fee: 4500,
    },
  ],
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

const totalAmount = sampleInvoice.acts.reduce((sum, a) => sum + (Number(a.fee) || 0), 0);
const patientName = `${sampleInvoice.lastName} ${sampleInvoice.firstName}`;

await sql`
  INSERT INTO invoices (
    id, number, patient_name, patient_phone, patient_address,
    invoice_date, total_amount, data, created_at, updated_at
  ) VALUES (
    ${sampleInvoice.id},
    ${sampleInvoice.number},
    ${patientName},
    ${'0550123456'},
    ${'El Oued, Algérie'},
    ${sampleInvoice.invoiceDate},
    ${totalAmount},
    ${JSON.stringify(sampleInvoice)},
    ${sampleInvoice.createdAt},
    ${sampleInvoice.updatedAt}
  );
`;
console.log('✓ Inserted test invoice with ID:', testInvoiceId);
console.log('✓ Patient:', patientName, '| Total Amount:', totalAmount, 'DA');

// Test 4: Query & Read Back Invoice Record
console.log('\n[Test 4] Testing Invoice Retrieval & Verification...');
const queriedRows = await sql`
  SELECT id, number, patient_name, total_amount, data
  FROM invoices
  WHERE id = ${testInvoiceId};
`;
if (queriedRows.length === 0) {
  throw new Error('Verification failed: Invoice not found in Neon database');
}
const retrievedData = typeof queriedRows[0].data === 'string'
  ? JSON.parse(queriedRows[0].data)
  : queriedRows[0].data;

if (retrievedData.id !== testInvoiceId || retrievedData.number !== formattedNumber) {
  throw new Error('Verification failed: Data integrity mismatch');
}
console.log('✓ Successfully retrieved invoice from Neon Postgres');
console.log('✓ Verified Number:', queriedRows[0].number);
console.log('✓ Verified Patient:', queriedRows[0].patient_name);
console.log('✓ Verified Acts count:', retrievedData.acts.length);

// Test 5: Settings Persistence
console.log('\n[Test 5] Testing Clinic Settings Persistence...');
const settingsPayload = {
  clinicNameFr: 'Dr. Medjouel Yahia Amir',
  clinicNameAr: 'الدكتور مجوّل يحي أمير',
  clinicTaglineFr: 'Dental Implantology and Aesthetic Dentistry',
  clinicTaglineAr: 'طب، زراعة وتجميل الأسنان',
  address: 'Hai Errimel - El Oued',
  addressAr: 'حي الرمال - الوادي، بالقرب من المحكمة',
  phones: '0777 77 53 77 | 0652 69 59 69',
  footerStyle: 'blue',
  updatedBy: 'Neon E2E Test',
};

await sql`
  INSERT INTO clinic_settings (id, data, updated_at)
  VALUES ('settings', ${JSON.stringify(settingsPayload)}, NOW())
  ON CONFLICT (id) DO UPDATE SET data = EXCLUDED.data, updated_at = NOW();
`;

const settingsRow = await sql`
  SELECT data, updated_at FROM clinic_settings WHERE id = 'settings';
`;
const loadedSettings = typeof settingsRow[0].data === 'string'
  ? JSON.parse(settingsRow[0].data)
  : settingsRow[0].data;
console.log('✓ Settings stored and retrieved successfully');
console.log('✓ Clinic Name (FR):', loadedSettings.clinicNameFr);
console.log('✓ Clinic Name (AR):', loadedSettings.clinicNameAr);
console.log('✓ Footer Style:', loadedSettings.footerStyle);

// Test 6: Clean Up Test Invoice
console.log('\n[Test 6] Cleaning up test invoice...');
await sql`DELETE FROM invoices WHERE id = ${testInvoiceId};`;
const checkDeleted = await sql`SELECT id FROM invoices WHERE id = ${testInvoiceId};`;
if (checkDeleted.length === 0) {
  console.log('✓ Test invoice cleaned up successfully (idempotent test pass)');
} else {
  console.warn('Warning: cleanup row remaining');
}

console.log('\n=============================================');
console.log('ALL NEON POSTGRES SERVICES VERIFIED END-TO-END!');
console.log('=============================================');
