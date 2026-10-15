# IndianVisaBuzz — bilingual dark-neon implementation

## Scope

Preserve the verified applicant-preparation workspace, official-source Slot Buddy, document checklist, safe multi-PDF attachment, Chrome extension, and existing Vercel delivery model. Provide the complete interface in Bengali or English, with Bengali as the default and each device/browser remembering the user’s choice. Use no AI badge or promotional AI text.

## Localization architecture

- `public/i18n.js`: one source of truth for static copy, attributes, accessibility labels and dynamic message catalogs in Bengali and English.
- `public/app.js`: persists the website language preference, updates `lang`, title/description, navigation, form placeholders, live validation, summary cards, file rows, status and toast messages without clearing profile fields or selected PDFs.
- `extension/content.js`: uses a matched Bengali/English catalog for the extension panel, validation, attachment guidance, accessibility labels and operational statuses; saves the extension’s language preference in `chrome.storage.local`.
- Visa type and centre option `value`s remain stable in both languages so changing display copy cannot alter portal autofill values.
- Product names, official organization names, standard acronyms, official Chrome menu labels and file formats can remain in their canonical form. Applicant-facing sentences otherwise remain in the selected language.

## Dark-neon system

Use a calm near-black/navy canvas and raised slate panels. Electric cyan/teal is reserved for primary actions, active navigation and focus; lime indicates success; violet and amber are secondary/warning accents. Glow is subtle and limited to active/focused states. Maintain strong text contrast, readable line-height, clear hierarchy, restrained border light, visible keyboard focus, reduced-motion support and mobile navigation/forms. Apply the same palette and interaction cues to the browser extension panel.

## Existing safety and feature behavior

- Browser-local profile storage remains opt-in; language preference is separate from visa profile data.
- Up to four PDFs at no more than 500 KB each receive `%PDF-` signature validation.
- Extension upload requires applicant-selected visible document fields, groups only on multi-file inputs, refuses ambiguous/populated fields, and never submits or books.
- OTP/CAPTCHA, consent, payment, appointment selection and final submission remain applicant-controlled.
- Slot Buddy links to official appointment/notice/advisory/document sources; it never claims live availability or guaranteed booking.
- Keep exact HTTPS official-origin allowlisting, CSP/security headers and the fail-closed license API.

## Verification and release

Run syntax/JSON/style parsing, bilingual catalog coverage/quality checks, all prior PDF/origin/license/rate-limit tests, and extension packaging. Use the browser preview to verify both languages, navigation, profile/documents/Slot Buddy/extension pages and responsive layout. After a successful test run, push the commit directly to `main` as requested (no pull/PR merge), verify the Vercel production deployment is READY, and smoke-test its public alias and extension ZIP.
