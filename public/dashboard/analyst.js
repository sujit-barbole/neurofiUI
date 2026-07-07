/* ═══════════════════════════════════════════
   NeuroFi — Financial Analyst Portal (Agent 2)
   Deterministic Math · Cash Flow · HLV · Tax · Retirement
   ═══════════════════════════════════════════ */

const AN = (() => {
  'use strict';

  // ── State ──
  let activeView = 'overview';
  let activeInputTab = '01';
  let gate2Checks = [false, false, false, false];
  let searchedMobile = ''; // mobile number of the currently active (searched) client
  let isGate1Passed = false; // from /api/customers/{onboardingId}/analyst-dashboard/gates — gates the sidebar
  // From /api/onboarding/search — Input Review only unlocks once all 4 are true.
  let clientFlags = { hasProfile: false, hasFinancials: false, hasRiskAssessment: false, hasGoalMap: false };

  const API_BASE = window.NF_API_BASE || 'http://localhost:8080';

  function isInputReviewReady() {
    return clientFlags.hasProfile && clientFlags.hasFinancials && clientFlags.hasRiskAssessment && clientFlags.hasGoalMap;
  }

  function missingInputArtifacts() {
    const missing = [];
    if (!clientFlags.hasProfile) missing.push('Client Profile');
    if (!clientFlags.hasFinancials) missing.push('Financial Snapshot');
    if (!clientFlags.hasRiskAssessment) missing.push('Risk Assessment');
    if (!clientFlags.hasGoalMap) missing.push('Goal Map');
    return missing;
  }

  // ── DOM Helpers ──
  const $ = (sel) => document.querySelector(sel);
  const $$ = (sel) => document.querySelectorAll(sel);

  // ── Access Check & Client Retrieval ──
  function getActiveClient() {
    const id = NF.getActiveClientId();
    return id ? NF.getClient(id) : null;
  }

  // ── Navigation ──
  function showView(viewId) {
    activeView = viewId;
    
    // Manage active state in sidebar
    $$('.nav-btn').forEach(btn => {
      btn.classList.toggle('active', btn.id === `nav-${viewId}`);
    });

    // Toggle active view content
    $$('.view').forEach(view => {
      view.classList.toggle('active', view.id === `view-${viewId}`);
    });

    const labels = {
      'overview': 'Overview', 'inputs': 'Input Review', 'networth': 'Net Worth',
      'insurance': 'Insurance', 'goals': 'Goal Gaps', 'tax': 'Tax',
      'retirement': 'Retirement', 'runall': 'Run All', 'gate2': 'Gate 2'
    };
    
    $('#crumb').textContent = `Analyst Portal › ${labels[viewId] || viewId}`;
    
    refreshCurrentView();
  }

  function showInputTab(tabId) {
    activeInputTab = tabId;
    $$('.tab-btn').forEach(btn => {
      btn.classList.toggle('active', btn.getAttribute('onclick').includes(tabId));
    });

    // Data for all 3 tabs is already fetched once and cached by loadInputReviewOnce()
    // (triggered when the Input Review section is opened) — just toggle visibility here.
    $('#input-art-01').style.display = tabId === '01' ? 'block' : 'none';
    $('#input-art-02').style.display = tabId === '02' ? 'block' : 'none';
    $('#input-art-03').style.display = tabId === '03' ? 'block' : 'none';
  }

  // ── Client Search (by mobile number) ──
  function setupClientSearch() {
    const btn = $('#btn-search-client');
    const input = $('#search-client-phone');
    if (!btn || !input) return;

    const runSearch = () => searchClientByPhone(input.value.trim());
    btn.addEventListener('click', runSearch);
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        runSearch();
      }
    });
  }

  async function searchClientByPhone(mobile) {
    if (!mobile) {
      NF.toast('Enter a mobile number to search.', 'error');
      return;
    }

    const btn = $('#btn-search-client');
    if (btn) btn.disabled = true;
    resetInputReviewCache();
    resetReportsCache();

    try {
      const res = await fetch(`${API_BASE}/api/onboarding/search?mobile=${encodeURIComponent(mobile)}`);

      if (res.status === 404) {
        searchedMobile = '';
        isGate1Passed = false;
        clientFlags = { hasProfile: false, hasFinancials: false, hasRiskAssessment: false, hasGoalMap: false };
        NF.setActiveClientId('');
        NF.toast('No client found for this mobile number.', 'error');
        applyAccessState();
        return;
      }

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.message || 'Search failed.');
      }

      const data = await res.json();
      searchedMobile = data.mobileNumber || mobile;
      clientFlags = {
        hasProfile: !!data.hasProfile,
        hasFinancials: !!data.hasFinancials,
        hasRiskAssessment: !!data.hasRiskAssessment,
        hasGoalMap: !!data.hasGoalMap
      };
      NF.setActiveClientId(String(data.onboardingId));

      await loadGate1Status(data.onboardingId);

      NF.toast(
        isGate1Passed
          ? 'Client found. Analyst sections unlocked.'
          : 'Client found, but Gate 1 has not been cleared by the RM yet.',
        isGate1Passed ? 'success' : 'info'
      );

      applyAccessState();
    } catch (err) {
      searchedMobile = '';
      isGate1Passed = false;
      clientFlags = { hasProfile: false, hasFinancials: false, hasRiskAssessment: false, hasGoalMap: false };
      NF.toast(err.message || 'Could not reach the server.', 'error');
      applyAccessState();
    } finally {
      if (btn) btn.disabled = false;
    }
  }

  // ── Load Gate 1 status (GET /api/customers/{onboardingId}/analyst-dashboard/gates) ──
  async function loadGate1Status(onboardingId) {
    try {
      const res = await fetch(`${API_BASE}/api/customers/${onboardingId}/analyst-dashboard/gates`);
      if (!res.ok) {
        isGate1Passed = false;
        return;
      }
      const data = await res.json();
      const gate1 = (data.gates || []).find(g => g.gateNumber === 1);
      isGate1Passed = !!(gate1 && gate1.passed);
    } catch {
      isGate1Passed = false;
    }
  }

  // ── Apply sidebar lock / guard state from search + gate status ──
  function applyAccessState() {
    const onboardingId = NF.getActiveClientId();
    const chip = $('#client-chip');
    const chipLabel = $('#chip-label');
    const unlocked = !!onboardingId && isGate1Passed;
    const inputsReady = !!onboardingId && isInputReviewReady();

    if (onboardingId && searchedMobile) {
      chip.style.display = 'flex';
      chipLabel.textContent = `${searchedMobile} (Onboarding #${onboardingId})`;
    } else {
      chip.style.display = 'none';
    }

    // Overview is always reachable. Every other section — Input Review, the 5
    // LLM report tabs, Run All, and Gate 2 — unlocks together once Profile,
    // Financials, Risk Assessment and Goal Map all exist for the client.
    $$('.nav-btn').forEach(btn => {
      const view = btn.dataset.view;
      btn.classList.toggle('locked', view !== 'overview' && !inputsReady);
    });

    applyInputsGuard(onboardingId, inputsReady);
    applyReportGuards(onboardingId, inputsReady);
    if (inputsReady) loadAllReportsOnce(onboardingId);

    if (!onboardingId) {
      $('#guard-gate1').style.display = 'none';
      $('#overview-content').style.display = 'none';
    } else if (!unlocked) {
      $('#guard-gate1').style.display = 'block';
      $('#overview-content').style.display = 'none';
    } else {
      $('#guard-gate1').style.display = 'none';
      $('#overview-content').style.display = 'block';

      // Overview stats/summary depend on the legacy local client record; only
      // render them when one happens to exist (e.g. demo data), otherwise the
      // static placeholders already in the HTML are left as-is.
      const client = getActiveClient();
      if (client) {
        renderOverviewStats(client);
        renderOverviewSummary(client);
        renderOverviewGates(client);
      }
    }

    refreshCurrentView();
  }

  // Input Review unlocks only once Profile, Financials, Risk Assessment and
  // Goal Map all exist for the client — independent of Gate 1 status.
  function applyInputsGuard(onboardingId, inputsReady) {
    const guard = $('#inputs-guard');
    const content = $('#inputs-content');
    if (!guard || !content) return;

    if (!onboardingId) {
      guard.style.display = 'none';
      content.style.display = 'none';
      return;
    }

    if (inputsReady) {
      guard.style.display = 'none';
      content.style.display = 'block';
      return;
    }

    const missing = missingInputArtifacts();
    guard.style.display = 'block';
    guard.innerHTML = `
      <div class="guard">
        <div class="lock-icon">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>
        </div>
        <h3>Client Onboarding Incomplete</h3>
        <p>The RM still needs to complete: <strong>${missing.join(', ')}</strong>. Input Review unlocks once all four are recorded.</p>
      </div>
    `;
    content.style.display = 'none';
  }

  // Net Worth / Insurance / Goal Gaps / Tax / Retirement / Run All / Gate 2 all
  // share Input Review's prerequisite — gated together, independent of Gate 1.
  function applyReportGuards(onboardingId, ready) {
    const guardIds = ['nw-guard', 'ins-guard', 'goal-guard', 'tax-guard', 'ret-guard', 'runall-guard', 'g2-guard'];
    const contentIds = ['nw-content', 'ins-content', 'goal-content', 'tax-content', 'ret-content', 'runall-content', 'g2-content'];

    if (!onboardingId) {
      guardIds.forEach(g => { const el = $(`#${g}`); if (el) el.style.display = 'none'; });
      contentIds.forEach(c => { const el = $(`#${c}`); if (el) el.style.display = 'none'; });
      return;
    }

    guardIds.forEach(g => { const el = $(`#${g}`); if (el) el.style.display = ready ? 'none' : 'block'; });
    contentIds.forEach(c => { const el = $(`#${c}`); if (el) el.style.display = ready ? 'block' : 'none'; });
  }

  // ── Refresh Current View ──
  function refreshCurrentView() {
    const onboardingId = NF.getActiveClientId();
    if (!onboardingId) return;

    if (activeView === 'inputs') {
      // Fetches all 3 artifacts once (cached) so switching 01/02/03 tabs is instant with no re-fetch.
      if (isInputReviewReady()) loadInputReviewOnce(onboardingId);
      return;
    }

    if (!isInputReviewReady()) return;

    if (['networth', 'insurance', 'goals', 'tax', 'retirement'].includes(activeView)) {
      renderReportView(activeView);
    } else if (activeView === 'runall') {
      renderRunAllView();
    } else if (activeView === 'gate2') {
      renderGate2View();
    }
  }

  // ═══════════════════════════════════════════
  //  VIEW: OVERVIEW SUMMARY & STATS
  // ═══════════════════════════════════════════
  function renderOverviewStats(client) {
    const artCount = ['05','06','07','08','09'].filter(id => client.artifacts[id]).length;
    $('#stat-artifacts').textContent = `${artCount}/5`;

    let nwVal = '—';
    if (client.financials) {
      const totalAssets = Object.values(client.financials.assets).reduce((a, b) => a + b, 0);
      const totalLiabilities = Object.values(client.financials.liabilities).reduce((a, b) => a + b, 0);
      nwVal = NF.fmt(totalAssets - totalLiabilities);
    }
    $('#stat-networth').textContent = nwVal;
    
    $('#stat-goals').textContent = (client.goals || []).length;

    const g2passed = NF.isGatePassed(client.id, 2);
    const ts = client.gateTimestamps?.[2];
    $('#stat-gate2').textContent = g2passed ? 'Approved' : 'Pending';
    $('#stat-gate2').style.color = g2passed ? 'var(--accent-green)' : 'var(--accent-amber)';
  }

  function renderOverviewSummary(client) {
    const container = $('#overview-metrics');
    if (!container || !client.financials) return;

    const f = client.financials;
    const totalIncome = Object.values(f.income).reduce((a, b) => a + b, 0);
    const totalExpenses = Object.values(f.expenses).reduce((a, b) => a + b, 0);
    const surplus = totalIncome - totalExpenses;
    const savingsRate = totalIncome > 0 ? (surplus / totalIncome * 100) : 0;

    const totalAssets = Object.values(f.assets).reduce((a, b) => a + b, 0);
    const totalLiabilities = Object.values(f.liabilities).reduce((a, b) => a + b, 0);
    const netWorth = totalAssets - totalLiabilities;

    container.innerHTML = `
      <div class="m-item">
        <div class="m-lbl">Monthly Cash Surplus</div>
        <div class="m-val pos">${NF.fmt(surplus)}</div>
      </div>
      <div class="m-item">
        <div class="m-lbl">Savings Rate</div>
        <div class="m-val ${savingsRate > 30 ? 'pos' : savingsRate > 15 ? 'warn' : 'neg'}">${savingsRate.toFixed(1)}%</div>
      </div>
      <div class="m-item">
        <div class="m-lbl">Asset Appraised Value</div>
        <div class="m-val pos">${NF.fmt(totalAssets)}</div>
      </div>
      <div class="m-item">
        <div class="m-lbl">Debt Liabilities</div>
        <div class="m-val neg">${NF.fmt(totalLiabilities)}</div>
      </div>
      <div class="m-item" style="grid-column: 1/-1;">
        <div class="m-lbl">Fiduciary Net Wealth Appraisal</div>
        <div class="m-val pos" style="font-size: 1.5rem;">${NF.fmt(netWorth)}</div>
      </div>
    `;
  }

  function renderOverviewGates(client) {
    const container = $('#overview-gates');
    if (!container) return;

    const gates = NF.getGateStatus(client.id);
    const timestamps = client.gateTimestamps || {};
    
    let html = '<div class="form-sec">Analyst Access Controls</div>';
    html += '<div style="display:grid;grid-template-columns:1fr 1fr;gap:14px;">';

    // Gate 1 info
    html += `
      <div class="gate-card passed">
        <div class="gate-hdr" style="margin-bottom: 0;">
          <div class="gate-num ok">✓</div>
          <div>
            <div class="gate-title">Gate 1 — Intake Clear</div>
            <div class="gate-sub">Cleared on ${NF.fmtDate(timestamps[1])}</div>
          </div>
        </div>
      </div>
    `;

    // Gate 2 info
    const g2passed = gates[2];
    html += `
      <div class="gate-card ${g2passed ? 'passed' : 'active'}">
        <div class="gate-hdr" style="margin-bottom: 0;">
          <div class="gate-num ${g2passed ? 'ok' : 'pending'}">${g2passed ? '✓' : '2'}</div>
          <div>
            <div class="gate-title">Gate 2 — Analyst Approval</div>
            <div class="gate-sub">${g2passed ? 'Cleared on ' + NF.fmtDate(timestamps[2]) : 'Release to Researcher Pending'}</div>
          </div>
        </div>
      </div>
    `;
    
    html += '</div>';
    container.innerHTML = html;
  }

  // ═══════════════════════════════════════════
  //  VIEW: INPUT REVIEW (RM Artifacts)
  //  All 3 artifacts are fetched once per client (on first open of this tab)
  //  and cached in memory — switching between 01/02/03 just toggles visibility,
  //  no repeat network calls. See loadInputReviewOnce() / resetInputReviewCache().
  // ═══════════════════════════════════════════

  let inputReviewCache = { onboardingId: null };

  function resetInputReviewCache() {
    inputReviewCache = { onboardingId: null };
  }

  async function fetchTextOrMessage(url, notFoundMessage) {
    try {
      const res = await fetch(url);
      if (res.status === 404) return notFoundMessage;
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.message || 'Request failed.');
      }
      const data = await res.json();
      return JSON.stringify(data, null, 2);
    } catch (err) {
      return err.message || 'Could not reach the server.';
    }
  }

  async function fetchGoalsText(onboardingId) {
    try {
      const res = await fetch(`${API_BASE}/api/customers/${onboardingId}/goals`);
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.message || 'Failed to load goal map.');
      }
      const goals = await res.json();
      return goals && goals.length > 0 ? JSON.stringify(goals, null, 2) : 'Artifact 03 has not been compiled yet.';
    } catch (err) {
      return err.message || 'Could not reach the server.';
    }
  }

  // Fetches all 3 artifacts in parallel exactly once per onboardingId.
  async function loadInputReviewOnce(onboardingId) {
    if (inputReviewCache.onboardingId === onboardingId) {
      // Already cached — just re-render from memory (covers re-opening the tab).
      renderInputReviewCache();
      return;
    }

    inputReviewCache = { onboardingId, profileText: null, financialsText: null, goalsText: null, loading: true };

    const [profileText, financialsText, goalsText] = await Promise.all([
      fetchTextOrMessage(`${API_BASE}/api/customers/${onboardingId}/profile`, 'Artifact 01 has not been compiled yet.'),
      fetchTextOrMessage(`${API_BASE}/api/customers/${onboardingId}/financials`, 'Artifact 02 has not been compiled yet.'),
      fetchGoalsText(onboardingId)
    ]);

    // Guard against a newer search having superseded this onboardingId while we were fetching.
    if (inputReviewCache.onboardingId !== onboardingId) return;

    inputReviewCache.profileText = profileText;
    inputReviewCache.financialsText = financialsText;
    inputReviewCache.goalsText = goalsText;
    inputReviewCache.loading = false;

    renderInputReviewCache();
  }

  function renderInputReviewCache() {
    if (inputReviewCache.loading) return;
    const v1 = $('#art-viewer-01');
    const v2 = $('#art-viewer-02');
    const v3 = $('#art-viewer-03');
    if (v1) v1.textContent = inputReviewCache.profileText ?? 'No artifact generated yet.';
    if (v2) v2.textContent = inputReviewCache.financialsText ?? 'No artifact generated yet.';
    if (v3) v3.textContent = inputReviewCache.goalsText ?? 'No artifact generated yet.';
  }

  // ═══════════════════════════════════════════
  //  ARTIFACTS 05-09 — LLM Analyst Reports
  //
  //  Strategy: GET /analyst/reports (bulk) is a cheap DB-only read returning
  //  whatever has already been generated — fetched once per client and cached,
  //  same pattern as Input Review. The expensive part (Claude/LLM call) is
  //  POST /analyst/reports/{reportType}, which is ONLY triggered by an explicit
  //  "Run Analysis" click, and only once per report type per client for the
  //  rest of its lifetime: once reportsCache[type] is populated (whether from
  //  the bulk preload or from a run just now), the button disables itself and
  //  is never called again for that type+client.
  // ═══════════════════════════════════════════

  let reportsCache = { onboardingId: null, loaded: false };

  function resetReportsCache() {
    reportsCache = { onboardingId: null, loaded: false };
  }

  const REPORT_VIEWS = {
    networth:   { type: 'NET_WORTH',           key: 'netWorth',           label: 'Net Worth Analysis',    resultsEl: '#nw-results',   runBtn: '#btn-run-nw' },
    insurance:  { type: 'INSURANCE',           key: 'insurance',          label: 'Insurance Analysis',    resultsEl: '#ins-results',  runBtn: '#btn-run-ins' },
    goals:      { type: 'GOAL_GAPS',           key: 'goalGaps',           label: 'Goal Gap Analysis',     resultsEl: '#goal-results', runBtn: '#btn-run-goals' },
    tax:        { type: 'TAX',                 key: 'tax',                label: 'Tax Analysis',          resultsEl: '#tax-results',  runBtn: '#btn-run-tax' },
    retirement: { type: 'RETIREMENT_PLANNING', key: 'retirementPlanning', label: 'Retirement Analysis',   resultsEl: '#ret-results',  runBtn: '#btn-run-ret' }
  };

  // Cheap bulk preload — DB read only, no LLM cost. Fetched once per onboardingId.
  async function loadAllReportsOnce(onboardingId) {
    if (reportsCache.onboardingId === onboardingId && reportsCache.loaded) return;
    reportsCache = { onboardingId, loaded: false };

    try {
      const res = await fetch(`${API_BASE}/api/customers/${onboardingId}/analyst/reports`);
      if (res.ok) {
        const data = await res.json();
        Object.values(REPORT_VIEWS).forEach(cfg => {
          reportsCache[cfg.type] = data[cfg.key] || null;
        });
      }
    } catch {
      // Leave cache empty — individual tabs will just show the "not generated" state.
    }

    if (reportsCache.onboardingId !== onboardingId) return; // superseded by a newer search
    reportsCache.loaded = true;
    renderAllReportViews();
  }

  function renderAllReportViews() {
    Object.keys(REPORT_VIEWS).forEach(renderReportView);
  }

  function renderReportView(view) {
    const cfg = REPORT_VIEWS[view];
    if (!cfg) return;
    const container = $(cfg.resultsEl);
    const btn = $(cfg.runBtn);
    if (!container) return;

    const report = reportsCache[cfg.type];

    if (report) {
      container.innerHTML = `
        <div class="results-title" style="color:var(--accent-amber)">${cfg.label} — ${report.status}</div>
        <div class="artifact-viewer">${escapeHtml(JSON.stringify(report, null, 2))}</div>
      `;
    } else {
      container.innerHTML = `
        <div style="color:var(--text-tertiary);font-size:.85rem;padding:24px;text-align:center" class="card">
          Click "Run ${cfg.label}" to generate this report. It runs once per client for the lifetime of this record.
        </div>
      `;
    }

    if (btn) {
      btn.disabled = !!report;
      btn.innerHTML = report
        ? `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg> Already Generated`
        : `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="5 3 19 12 5 21 5 3"/></svg> Run ${cfg.label}`;
    }
  }

  // Triggers the expensive LLM call — only if this report type hasn't been generated yet.
  async function runReport(view) {
    const cfg = REPORT_VIEWS[view];
    if (!cfg) return;
    const onboardingId = NF.getActiveClientId();
    if (!onboardingId) return;

    if (reportsCache[cfg.type]) {
      NF.toast(`${cfg.label} has already been generated for this client.`, 'info');
      return;
    }

    const btn = $(cfg.runBtn);
    if (btn) btn.disabled = true;

    try {
      const res = await fetch(`${API_BASE}/api/customers/${onboardingId}/analyst/reports/${cfg.type}`, { method: 'POST' });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.message || `Failed to generate ${cfg.label}.`);
      }
      const data = await res.json();
      reportsCache[cfg.type] = data;
      NF.toast(`${cfg.label} generated successfully!`, 'success');
      renderReportView(view);
      if (activeView === 'runall') renderRunAllView();
    } catch (err) {
      NF.toast(err.message || 'Could not reach the server.', 'error');
      if (btn) btn.disabled = false;
    }
  }

  function runNetWorth() { runReport('networth'); }
  function runInsurance() { runReport('insurance'); }
  function runGoalGaps() { runReport('goals'); }
  function runTax() { runReport('tax'); }
  function runRetirement() { runReport('retirement'); }

  // ═══════════════════════════════════════════
  //  VIEW: RUN ALL ANALYSES
  // ═══════════════════════════════════════════
  const RUNALL_ITEM_MAP = { networth: '05', insurance: '06', goals: '07', tax: '08', retirement: '09' };

  function renderRunAllView() {
    Object.entries(RUNALL_ITEM_MAP).forEach(([view, num]) => {
      updateRunAllUI(num, !!reportsCache[REPORT_VIEWS[view].type]);
    });

    const container = $('#runall-summary');
    if (!container) return;
    const allDone = Object.keys(RUNALL_ITEM_MAP).every(view => !!reportsCache[REPORT_VIEWS[view].type]);
    container.innerHTML = allDone
      ? `
        <div class="card" style="border-color:var(--accent-green)">
          <h3 style="color:var(--accent-green)">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>
            All 5 Analyses Generated
          </h3>
          <p style="color:var(--text-secondary);font-size:.85rem;line-height:1.5;">
            Proceed to <strong>Gate 2</strong> to review the checklist and release to the Researcher.
          </p>
        </div>
      `
      : '';
  }

  function updateRunAllUI(artNum, exists) {
    const item = $(`#runall-0${artNum}`);
    if (!item) return;

    const icon = item.querySelector('.run-icon');
    const sub = item.querySelector('.run-sub');

    if (exists) {
      item.classList.add('completed');
      icon.className = 'run-icon ok';
      icon.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>`;
      sub.textContent = 'Completed';
      sub.style.color = 'var(--accent-green)';
    } else {
      item.classList.remove('completed');
      icon.className = 'run-icon wait';
      icon.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/></svg>`;
      sub.textContent = 'Pending execution';
      sub.style.color = 'var(--text-muted)';
    }
  }

  // Runs only the report types that haven't been generated yet — never re-runs a completed one.
  async function runAll() {
    const onboardingId = NF.getActiveClientId();
    if (!onboardingId) return;

    const pending = Object.keys(RUNALL_ITEM_MAP).filter(view => !reportsCache[REPORT_VIEWS[view].type]);
    if (pending.length === 0) {
      NF.toast('All 5 analyses are already generated.', 'info');
      renderRunAllView();
      return;
    }

    NF.toast('Starting batch modeling calculations...', 'info');
    for (const view of pending) {
      await runReport(view);
      renderRunAllView();
    }
    NF.toast('Batch run complete!', 'success');
  }

  // ═══════════════════════════════════════════
  //  VIEW: GATE 2 (Release checks)
  // ═══════════════════════════════════════════
  function renderGate2View() {
    const allGenerated = Object.keys(RUNALL_ITEM_MAP).every(view => !!reportsCache[REPORT_VIEWS[view].type]);

    for (let c = 0; c < 4; c++) {
      const box = $(`#g2-chk-${c}`);
      if (box) box.classList.toggle('on', gate2Checks[c]);
    }

    const allChecked = gate2Checks.every(Boolean);
    const approveBtn = $('#btn-pass-g2');
    if (approveBtn) {
      approveBtn.disabled = !allChecked || !allGenerated;
      approveBtn.innerHTML = !allGenerated
        ? `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg> Analyses Missing`
        : `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg> Approve Gate 2 &amp; Release advice`;
    }
  }

  function toggleCheck(idx) {
    gate2Checks[idx] = !gate2Checks[idx];
    const box = $(`#g2-chk-${idx}`);
    if (box) box.classList.toggle('on', gate2Checks[idx]);

    const allChecked = gate2Checks.every(Boolean);
    const allGenerated = Object.keys(RUNALL_ITEM_MAP).every(view => !!reportsCache[REPORT_VIEWS[view].type]);
    const approveBtn = $('#btn-pass-g2');
    if (approveBtn) approveBtn.disabled = !allChecked || !allGenerated;
  }

  function passGate2() {
    NF.toast('Gate 2 approved! Portfolio parameters released to Researcher.', 'success');
    showView('overview');
  }

  // ── HTML Escaper ──
  function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  // ── Init ──
  function init() {
    setupClientSearch();

    // Bind sidebar nav buttons
    $$('.nav-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const view = btn.dataset.view;
        if (btn.classList.contains('locked')) {
          NF.toast('This section is locked. Profile, Financials, Risk Assessment and Goal Map must all be recorded first.', 'error');
          return;
        }
        showView(view);
      });
    });

    applyAccessState();
  }

  // Boot on DOM content load
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // ── Public API ──
  return {
    showView,
    showInputTab,
    runNetWorth,
    runInsurance,
    runGoalGaps,
    runTax,
    runRetirement,
    runAll,
    toggleCheck,
    passGate2
  };
})();
