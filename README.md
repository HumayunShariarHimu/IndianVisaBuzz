# IndianVisaBuzz

A standalone visa-preparation workspace for applicants in Bangladesh. The website and browser assistant support **Bengali and English** with a saved language preference, and use a restrained dark-neon interface. There are no AI badges or promotional AI claims. IndianVisaBuzz is not affiliated with IVAC, the High Commission of India, or the Government of India.

## What it provides

- Applicant profile fields and a document checklist.
- **Slot Buddy**, a source-linked directory for the official appointment portal, current notices, official document guidance, and fraud advisories. It is not a live slot feed and does not guarantee or book appointments.
- A Chrome extension for carefully filling recognized applicant fields and attaching up to four verified PDFs to document fields selected by the user.
- Local preference/profile storage; no applicant profile or PDF is sent to the IndianVisaBuzz server.

## Local preview

```bash
python3 -m http.server 4173 --directory public
```

Open `http://localhost:4173`. The Vercel project serves the frontend from `public/`; the optional legacy license API remains disabled unless its secrets are configured.

## Chrome extension

1. Build the package with `npm run build:extension`; extract `public/indianvisabuzz-extension.zip`.
2. In Chrome desktop, open `chrome://extensions` and enable Developer mode.
3. Choose **Load unpacked** and select the extracted `extension/` directory.
4. Open only `https://appointment.ivacbd.com/` or `https://indianvisaonline.gov.in/`, then select the extension icon. The extension does not run on HTTP, subdomains, or unrelated origins.
5. Choose Bengali or English in the extension panel. The preference is stored in Chrome extension storage.

## Four-PDF attachment behavior

The website and extension accept up to four PDFs, at most 500 KB each, and verify a `%PDF-` signature within the first 1 KB. In the extension, the applicant explicitly selects the visible official document field for each file. Files are grouped only when the selected field accepts multiple files; otherwise, each PDF goes to a separate field. The extension stops if a destination is missing, ambiguous, changed, or already populated. It does not overwrite an existing file, bypass OTP/CAPTCHA, submit an application, reserve a slot, or make a payment.

Attaching a file can trigger the official portal’s own upload behavior. Review the selected field, filenames, upload result, and all applicant details on the portal; attachment alone does not confirm that the portal accepted the document.

## Privacy and user control

Profile data is persisted only when the applicant opts in to “Remember on this device”: the website uses that browser’s local storage and the extension uses Chrome `storage.local`. Without that choice, entered details stay in the current page/tab session. PDFs selected on the website remain in the current tab and are not sent to the IndianVisaBuzz server. The extension attaches chosen files to the official portal’s file input; the portal may then upload them according to its own behavior. IndianVisaBuzz does not receive the PDF bytes.

The extension does not collect or send passwords, portal cookies, OTPs, CAPTCHAs, payment details, or official account data. Applicants complete CAPTCHA/OTP, consent, payment, appointment selection, and final submission themselves on the official portal.

## Slot Buddy — official sources

The Slot Buddy directory links directly to official sources:

- [IVAC Bangladesh appointment portal](https://appointment.ivacbd.com/)
- [IVAC Bangladesh notices and guidance](https://www.ivacbd.com/)
- [IVAC advisory: beware of touts and agents](https://www.ivacbd.com/Beware-of-touts-and-agents)
- [HCI Dhaka visa document list (PDF)](https://hcidhaka.gov.in/pdf/Documents_required_for_visa1.pdf)
- [Government of India visa portal](https://indianvisaonline.gov.in/)

On 15 October 2026, the appointment portal notice showed webfile upload hours of 09:00–16:30 and next-working-day slot opening at 17:00 (excluding tourist visas). It also described webfile-information matching, an age limit for uploaded webfiles, edit restrictions after successful upload, and re-upload following an unsuccessful booking. These rules can change; verify current instructions on the official portal before acting. IVAC warns applicants against paying third parties who claim to guarantee slots or direct access.

## Legacy license API

The API fails closed unless `LICENSE_SECRET` (at least 32 bytes) and, for key generation, `ADMIN_SECRET` (at least 24 bytes) are configured. New keys use a full HMAC-SHA256 signature and a 96-bit random nonce; legacy short-signature keys are no longer accepted. Per-IP rate limiting is best-effort per serverless instance, not a global quota. Cross-origin access requires an exact `APP_ORIGIN`; wildcard CORS is not enabled.

## Verification

```bash
npm test
npm run build:extension
node --check public/app.js
node --check public/i18n.js
node --check extension/content.js
node --check extension/file-upload.js
node --check extension/background.js
node --check extension/origins.js
```
