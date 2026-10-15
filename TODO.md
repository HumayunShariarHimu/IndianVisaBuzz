# IndianVisaBuzz — completion checklist

## English / বাংলা interface
- [x] Bengali default, English toggle, and browser-local saved language preference.
- [x] Overview, profile, document prep, Slot Buddy and extension guide copy/labels/accessibility strings are localized; title, metadata, dynamic summaries, validation, status and toasts follow the selected language.
- [x] Switching language keeps profile fields and selected-file state; stable visa-type/centre values remain unchanged for autofill.
- [x] Automated catalog coverage checks ensure complete translations and only approved product names, official acronyms and formats remain canonical in Bengali.
- [x] Chrome extension UI supports both languages and persists the choice in extension-local storage.

## Dark-neon visual refresh
- [x] All five website views, navigation, cards, forms, callouts, status and extension panel use a restrained near-black/navy and cyan/lime/amber palette.
- [x] Checklist/privacy panels are dark-surface safe; text hierarchy, keyboard focus, reduced-motion and narrow-screen CSS rules are present.
- [x] No AI badges or promotional AI copy.

## Existing behavior preserved
- [x] Up to four PDFs, 500 KB each, `%PDF-` signature validation and visible, user-selected portal destinations.
- [x] Existing/populated targets are not overwritten; missing/ambiguous fields stop attachment; no automatic submission or booking.
- [x] Slot Buddy keeps official portal/advisory/document links, current-notice disclaimer and fraud warning without claiming live slot access or guaranteed booking.
- [x] Profile persistence remains opt-in; OTP/CAPTCHA, consent, payment, appointment selection and final submission stay with the applicant.

## Verification
- [x] All 27 automated tests pass, including upload, localization, extension-origin, license and rate-limit coverage.
- [x] JavaScript/JSON validation, `git diff --check` and extension ZIP integrity pass.
- [x] Browser preview verified in Bengali and English across overview, profile, documents, Slot Buddy and extension guide; computed dark background and loaded style rules checked.
- [x] Browser-only synthetic test accepted four valid PDF fixtures, preserved them across language switch, and rejected a fifth; fixtures were not sent to any portal.
