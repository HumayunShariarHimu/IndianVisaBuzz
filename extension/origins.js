(function (root) {
  'use strict';
  const allowedHosts = new Set(['appointment.ivacbd.com', 'indianvisaonline.gov.in']);

  function isAllowedPortalUrl(value) {
    try {
      const url = new URL(value);
      return url.protocol === 'https:' && allowedHosts.has(url.hostname);
    } catch (_) {
      return false;
    }
  }

  const api = Object.freeze({ isAllowedPortalUrl });
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  if (root) root.IVBOriginPolicy = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
