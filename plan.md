# IndianVisaBuzz implementation plan

The updated repository is a Bengali-first, source-backed visa-preparation workspace. It includes a local applicant profile, progress and document checklist, official-source Slot Buddy directory, and a Manifest V3 extension that attaches up to four verified PDF files to semantically identified official-portal document inputs.

The extension is restricted to the exact official hosts `appointment.ivacbd.com` and `indianvisaonline.gov.in`. It does not automate passwords, OTPs, CAPTCHA, consent, payments, final submission, or appointment booking. It stops and explains when it cannot safely map the selected PDFs to enough document fields.

The 15 October 2026 IVAC notice was checked for upload hours, appointment opening time, webfile age, matching applicant details, and upload replacement constraints. The IVAC anti-fraud advisory, the IVAC portal, HCI document list, and Government of India visa site are linked directly. These details can change; the official portal remains authoritative.

Implementation uses the existing Vercel-compatible static `public/` app with opt-in browser-local profile storage. It adds no database, account login, cloud file transfer, or third-party slot feed. The extension archive is reproducible with `npm run build:extension`. The legacy license API now requires configured secrets, uses a full HMAC-SHA256 signature and 96-bit nonce, rate-limits per IP within each serverless instance, and only enables CORS for an explicitly configured `APP_ORIGIN`.

## Main files

- `public/index.html`, `public/style.css`, `public/app.js`: app shell, responsive interface, local state, document checks and Slot Buddy content.
- `public/manus-routes.json`: single-page route declaration.
- `extension/manifest.json`, `extension/content.js`, `extension/file-upload.js`, `extension/style.css`, `extension/background.js`: narrowly scoped extension, PDF signature validation, upload field identification and safe attach flow.
- `scripts/build-extension.js`: creates the downloadable ZIP.
- `lib/`, `api/`: fail-closed license key endpoints with improved signing and abuse protection.
- `test/*.test.js`: upload, license and rate-limiter regression tests.
