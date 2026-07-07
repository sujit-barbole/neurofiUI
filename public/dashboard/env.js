/**
 * NeuroFi Dashboard — Environment Config
 * Local dev: calls backend directly on localhost:8080.
 * Production (Vercel): uses empty string so all /api/* calls go to Vercel,
 * which proxies them to EC2 via vercel.json rewrites — no mixed-content block.
 */
(function () {
  if (!window.NF_API_BASE) {
    var isLocal =
      window.location.hostname === 'localhost' ||
      window.location.hostname === '127.0.0.1';
    window.NF_API_BASE = isLocal ? 'http://localhost:8080' : '';
  }
})();
