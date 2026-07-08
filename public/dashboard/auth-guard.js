(function () {
  var REQUIRED_ROLE = document.currentScript.getAttribute('data-required-role');
  var auth = null;
  try { auth = JSON.parse(localStorage.getItem('nf_auth')); } catch (e) { auth = null; }

  if (!auth || !auth.role || !auth.username || (REQUIRED_ROLE && auth.role !== REQUIRED_ROLE)) {
    window.location.href = '/';
    return;
  }

  window.NF_AUTH = auth;

  document.addEventListener('DOMContentLoaded', function () {
    var footer = document.querySelector('.sidebar-footer');
    if (!footer) return;
    var logout = document.createElement('button');
    logout.textContent = 'Log Out (' + auth.username + ')';
    logout.style.cssText = 'margin-top:10px;width:100%;background:rgba(255,255,255,0.04);border:1px solid var(--border-subtle);color:var(--text-secondary);padding:8px 10px;border-radius:8px;cursor:pointer;font-size:0.75rem;font-family:var(--font);';
    logout.addEventListener('click', function () {
      localStorage.removeItem('nf_auth');
      window.location.href = '/';
    });
    footer.parentElement.appendChild(logout);
  });
})();
