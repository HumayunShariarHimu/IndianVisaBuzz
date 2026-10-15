# IndianVisaBuzz — implementation status

## PDF upload fix
- [x] সর্বোচ্চ চারটি PDF, 500 KB/file এবং `%PDF-` signature যাচাই.
- [x] প্রতিটি file-এর জন্য user-visible semantic portal destination বাছাই; hidden/unrelated slot বাদ.
- [x] Multi-file field-এ group attach; পৃথক field-এ পৃথক file; populated input overwrite নয়.
- [x] Count, target mapping, fake PDF, visibility, occupied-field ও metadata identity tests pass; automatic submit নেই.

## Slot Buddy
- [x] Official appointment, IVAC source/advisory, HCI document list ও Government of India visa links.
- [x] ১৫ অক্টোবর ২০২৬-এর portal notice-এর schedule, webfile age/data match, upload edit ও failed-booking পরবর্তী notice source/date-সহ; পরিবর্তনশীল নিয়ম পুনরায় verify করতে সতর্কতা.
- [x] Live slot availability, third-party booking বা guarantee দাবি নেই.

## App ও extension
- [x] বাংলা-প্রথম responsive profile/progress/document checklist/Slot Buddy/extension guide.
- [x] Opt-in local profile storage; website PDF IndianVisaBuzz server-এ যায় না; attach-এর পর portal নিজস্ব নিয়মে upload চালাতে পারে; account credentials সংগ্রহ হয় না.
- [x] Chrome extension exact HTTPS official hosts-এ সীমিত; autofill, signature-check ও explicit portal-field mapping.
- [x] Source থেকে generated ZIP integrity check pass.

## Quality & security
- [x] Vercel CSP/security headers; license API default secret বাদ, full HMAC-SHA256, 96-bit nonce, exact-origin CORS, best-effort per-instance rate limit.
- [x] ১৭ automated tests, JS syntax checks, JSON validation ও `git diff --check` pass.
- [x] Preview browser-এ overview/profile/documents/Slot Buddy/extension guide পরীক্ষা.
- [x] Public preview-তে চার synthetic valid PDF `4/4`; fake `.pdf` reject; document list clear করে test data মুছে ফেলা.

**By design:** IVAC-এ CAPTCHA/OTP, payment, appointment selection ও final submit ব্যবহারকারী portal-এ নিজে করবেন।
