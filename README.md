# El Amir Dental Clinic (عيادة الأمير لطب الأسنان)

Professional billing and invoice management system for **Dr. Medjouel Yahia Amir**, built with modern React 19, TypeScript, Vite, Material UI (M3 design tokens), and Qatar 2022 Arabic typography.

---

## 🖥️ Desktop Application (.exe) — 100% Offline

The application is packaged as a standalone Windows desktop application running on Electron:
- **100% Offline**: Works without any internet connection. Invoices, patient records, and settings are securely stored locally on the PC in IndexedDB.
- **Auto-Printing & PDF Export**: Generate official clinic invoices with custom QR code, clinic logo, background security pattern, and bilingual header/footer.
- **Two Executable Formats** in `release/`:
  1. **Portable `.exe` (`release/El Amir Dental Clinic 1.0.0.exe`)**: Single file executable. Run directly from Desktop, Documents, or a USB drive without installation.
  2. **Installer `.exe` (`release/El Amir Dental Clinic Setup 1.0.0.exe`)**: Standard Windows installer with Start Menu and Desktop shortcuts.

### How to Build the `.exe`
```bash
npm run build:exe
```
This runs `tsc -b && vite build` and packages the Windows executables into the `release/` folder.

---

## ☁️ Neon Cloud Database (Optional Hybrid Sync)

The application supports seamless cloud synchronization with **Neon Lakebase Postgres**:
- When connected to the internet with `DATABASE_URL` configured in `.env.local`, invoices and clinic settings sync to Neon Postgres (`neondb` on branch `production`).
- Concurrency-safe atomic sequence numbering (`2026-0001`, `2026-0002`...).
- If disconnected or offline, the app automatically falls back to local storage so the clinic never experiences downtime.

### Verify Neon Connection
```bash
node scripts/verifyEndToEnd.mjs
```

---

## 🚀 Web Development

To run the web version locally in the browser:
```bash
npm run dev
```
Open [http://localhost:5173/](http://localhost:5173/).

To run tests:
```bash
npx vitest run
```