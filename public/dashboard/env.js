/**
 * NeuroFi Dashboard — Environment Config
 * Auto-detects local vs production by hostname.
 * Override by setting window.NF_API_BASE before this script runs.
 */
(function () {
  if (!window.NF_API_BASE) {
    var isLocal =
      window.location.hostname === 'localhost' ||
      window.location.hostname === '127.0.0.1';
    window.NF_API_BASE = isLocal
      ? 'http://localhost:8080'
      : 'http://3.7.19.25:8080';
  }
})();
