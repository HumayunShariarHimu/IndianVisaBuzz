# IndianVisaBuzz

বাংলাদেশ থেকে ভারতীয় ভিসার আবেদন প্রস্তুত করতে একটি বাংলা-প্রথম browser-local workspace ও Chrome extension। এটি profile তথ্য গুছায়, PDF নথি যাচাই করে, Slot Buddy নামে official source directory দেখায় এবং portal form-এ পুনরাবৃত্ত তথ্য পূরণে সাহায্য করে।

## Local preview

```bash
python3 -m http.server 4173 --directory public
```

তারপর `http://localhost:4173` খুলুন। Vercel-এ existing project-এর `public/` frontend deploy করা যায়। License API কেবল প্রয়োজনীয় secrets configure করা থাকলে চালু হয়।

## Chrome extension

1. `npm run build:extension` চালিয়ে `public/indianvisabuzz-extension.zip` বানান ও extract করুন।
2. Chrome-এ `chrome://extensions` খুলে Developer mode চালু করুন।
3. **Load unpacked** চাপুন এবং extracted `extension/` directory বেছে নিন।
4. কেবল `https://appointment.ivacbd.com/` অথবা `https://indianvisaonline.gov.in/`-এ গিয়ে extension icon চাপুন। অন্য domain, subdomain বা HTTP origin-এ extension চলে না।

## চারটি PDF নিরাপদে attach

সর্বোচ্চ ৪টি PDF—প্রতিটি সর্বোচ্চ 500 KB। Website ও extension উভয়েই প্রথম 1 KB-তে `%PDF-` signature দেখে, শুধু filename/MIME নয়। Extension-এ প্রতিটি নথির জন্য আপনি portal-এর visible document field বেছে নেন; hidden/unrelated field বাছাই হয় না। পৃথক field-এ একটি করে file, multiple-file field-এ নির্বাচিত file group একসঙ্গে বসে। Target অনির্দিষ্ট, আগে থেকে populated বা পরিবর্তিত হলে extension থামে; file overwrite বা form submit করে না। Portal-এ file names/labels মিলিয়ে নিয়ে upload ও পরবর্তী ধাপ নিজে করুন—input-এ attach হওয়া মানেই portal upload accepted হওয়া নয়।

## Privacy ও user control

Profile data কেবল “এই device-এ profile মনে রাখুন” consent দিলে website-এর browser `localStorage` অথবা extension-এর Chrome `storage.local`-এ থাকে। Website checklist-এ নির্বাচিত PDF বর্তমান tab-এ থাকে এবং IndianVisaBuzz server-এ পাঠানো হয় না। Extension-এ file attach করলে সেটি official portal-এর input-এ যায়; portal-এর নিজস্ব আচরণ অনুযায়ী file তখনই upload হতে পারে। IndianVisaBuzz PDF bytes পায় না। Password, portal cookies, OTP, CAPTCHA, payment details বা official account data extension-এ সংগ্রহ/পাঠানো হয় না। CAPTCHA/OTP, consent, payment, appointment selection, final submission ও slot reservation ব্যবহারকারী portal-এ নিজে করেন।

## Slot Buddy — official sources

Slot Buddy হলো source-linked notice ও official portal directory; এটি live-slot feed, automatic slot booking service বা guaranteed appointment claim নয়।

- [IVAC Bangladesh appointment portal](https://appointment.ivacbd.com/)
- [IVAC Bangladesh notices and guidance](https://www.ivacbd.com/)
- [IVAC advisory: beware of touts and agents](https://www.ivacbd.com/Beware-of-touts-and-agents)
- [HCI Dhaka visa document list (PDF)](https://hcidhaka.gov.in/pdf/Documents_required_for_visa1.pdf)
- [Government of India visa portal](https://indianvisaonline.gov.in/)

১৫ অক্টোবর ২০২৬-এ appointment portal notice-এ webfile upload 09:00–16:30 এবং (tourist visa ব্যতীত) পরবর্তী কর্মদিবসের slot opening 17:00 দেখা গিয়েছিল। Notice-এ sign-up তথ্য webfile-এর সঙ্গে মেলানো, ৩০ দিনের বেশি পুরোনো webfile গ্রহণ না করা, সফল upload booking শেষ না হওয়া পর্যন্ত edit করতে না পারা, এবং ব্যর্থ booking-এর পর file নতুন করে upload করার শর্তও ছিল। এগুলো পরিবর্তনশীল; বর্তমান নিয়ম official portal-এ পুনরায় যাচাই করুন। IVAC “guaranteed slot” ও direct-access দাবিতে অর্থ না দিতে সতর্ক করে। IndianVisaBuzz স্বতন্ত্র প্রস্তুতি-সহায়ক; IVAC বা ভারত সরকারের অনুমোদিত service নয়।

## Legacy license API

API default-এ বন্ধ থাকে। `LICENSE_SECRET` কমপক্ষে 32 bytes এবং key generation-এর জন্য `ADMIN_SECRET` কমপক্ষে 24 bytes না থাকলে key generation/verification unavailable। নতুন key-তে full HMAC-SHA256 signature ও 96-bit random nonce থাকে; পুরোনো short-signature key আর গ্রহণ করা হয় না। Per-IP rate limit প্রতিটি serverless instance-এ best-effort, global quota নয়। Cross-origin access দরকার হলে exact `APP_ORIGIN` configure করুন; wildcard CORS নেই।

## Checks

```bash
npm test
npm run build:extension
node --check public/app.js
node --check extension/content.js
node --check extension/file-upload.js
node --check extension/background.js
node --check extension/origins.js
```
