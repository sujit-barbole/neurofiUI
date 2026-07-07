/**
 * NeuroFi Dashboard — Environment Config
 * Local dev + production (non-Vercel): calls EC2 backend directly.
 * Vercel deployment: empty string so /api/* routes through Vercel proxy
 * to EC2 server-side (avoids browser mixed-content block).
 */
(function () {
  if (!window.NF_API_BASE) {
    var isVercel = window.location.hostname.endsWith('.vercel.app') ||
                   window.location.hostname === 'www.neurofi.in' ||
                   window.location.hostname === 'neurofi.in';
    window.NF_API_BASE = isVercel ? '' : 'http://3.7.19.25:8080';
  }
})();
