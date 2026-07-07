/* ═══════════════════════════════════════════
   NeuroFi — Relationship Manager Portal (Agent 1)
   KYC Intake · Risk Profiling · Financial Snapshot · Goals
   ═══════════════════════════════════════════ */

(function () {
  'use strict';

  // ── State ──
  let activeView = 'overview';
  let riskAnswers = {}; // { questionIndex: score }
  let goals = [];       // Array of goal objects
  let gate1Checks = [false, false, false, false];
  let isOtpVerified = false; // from /api/onboarding/search status — gates the sidebar
  let searchedMobile = ''; // mobile number of the currently active (searched) client
  // Whether each artifact already exists for the active client, from /api/onboarding/search.
  // Used to decide GET-and-prepopulate vs. just open a blank form (skip the guaranteed-404 GET).
  let clientFlags = { hasProfile: false, hasFinancials: false, hasRiskAssessment: false, hasGoalMap: false };

  const API_BASE = window.NF_API_BASE || 'http://localhost:8080';

  // ── DOM Helpers ──
  const $ = (sel) => document.querySelector(sel);
  const $$ = (sel) => document.querySelectorAll(sel);

  // ── Navigation ──
  function setupNav() {
    $$('.nav-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const view = btn.dataset.view;
        if (btn.classList.contains('locked')) {
          NF.toast('This section is locked. Complete prerequisites first.', 'error');
          return;
        }
        switchView(view);
      });
    });
  }

  function switchView(viewId) {
    activeView = viewId;
    $$('.nav-btn').forEach(b => b.classList.toggle('active', b.dataset.view === viewId));
    $$('.view').forEach(v => v.classList.toggle('active', v.id === `view-${viewId}`));

    const labels = {
      'overview': 'Overview', 'profile': 'Client Profile', 'risk': 'Risk Assessment',
      'financials': 'Financials', 'goals': 'Goal Map', 'gate1': 'Gate 1',
      'planreview': 'Plan Review', 'delivery': 'Delivery', 'consent': 'Consent', 'gate4': 'Gate 4'
    };
    $('#crumb').textContent = `RM Portal / ${labels[viewId] || viewId}`;
    renderCurrentView();

    const onboardingId = NF.getActiveClientId();
    if (!onboardingId) return;

    // Only GET when the search response said this artifact already exists —
    // otherwise just open a blank form, skipping a guaranteed-404 request.
    if (viewId === 'profile') {
      clientFlags.hasProfile ? loadProfileFromApi(onboardingId) : openBlankProfileForm();
    } else if (viewId === 'risk') {
      clientFlags.hasRiskAssessment ? loadRiskFromApi(onboardingId) : openBlankRiskForm();
    } else if (viewId === 'financials') {
      clientFlags.hasFinancials ? loadFinancialsFromApi(onboardingId) : openBlankFinancialsForm();
    } else if (viewId === 'goals') {
      clientFlags.hasGoalMap ? loadGoalsFromApi(onboardingId) : openBlankGoalsForm();
    }
  }

  // ── Profile <-> API enum mapping ──
  const GENDER_MAP = { Male: 'MALE', Female: 'FEMALE', Other: 'OTHER' };
  const MARITAL_MAP = { Single: 'SINGLE', Married: 'MARRIED', Divorced: 'DIVORCED', Widowed: 'WIDOWED' };
  const METRO_MAP = { Metro: 'METRO', 'Non-Metro': 'NON_METRO' };
  const OCCUPATION_MAP = {
    'Salaried-Govt': 'SALARIED_GOVT', 'Salaried-Corporate': 'SALARIED_CORPORATE', 'Salaried-Startup': 'SALARIED_STARTUP',
    'Self-Employed': 'SELF_EMPLOYED', 'Business Owner': 'BUSINESS_OWNER', 'Retired': 'RETIRED'
  };
  const LIFESTAGE_MAP = {
    'Early Career': 'EARLY_CAREER', 'Mid Career': 'MID_CAREER', 'Pre-Retirement': 'PRE_RETIREMENT', 'Retired': 'RETIRED'
  };

  function toApiEnum(map, uiValue) {
    return uiValue ? (map[uiValue] || undefined) : undefined;
  }

  function fromApiEnum(map, apiValue) {
    if (!apiValue) return '';
    const entry = Object.entries(map).find(([, v]) => v === apiValue);
    return entry ? entry[0] : '';
  }

  function emptyToUndefined(v) {
    return v === '' || v === null ? undefined : v;
  }

  // ── Load Profile (GET /api/customers/{onboardingId}/profile) ──
  function openBlankProfileForm() {
    resetProfileForm();
    setProfileFormMode('create');
  }

  async function loadProfileFromApi(onboardingId) {
    try {
      const res = await fetch(`${API_BASE}/api/customers/${onboardingId}/profile`);

      if (res.status === 404) {
        openBlankProfileForm();
        return;
      }

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.message || 'Failed to load client profile.');
      }

      const data = await res.json();
      populateProfileFormFromApi(data);
      setProfileFormMode('update');
    } catch (err) {
      NF.toast(err.message || 'Could not reach the server.', 'error');
    }
  }

  function resetProfileForm() {
    const form = $('#form-profile');
    if (form) form.reset();
  }

  function setProfileFormMode(mode) {
    const btn = $('#btn-save-profile');
    if (!btn) return;
    btn.innerHTML = mode === 'update'
      ? `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg> Save Profile &amp; Generate Artifact 01`
      : `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg> Create Client &amp; Generate Artifact 01`;
  }

  function populateProfileFormFromApi(p) {
    $('#pf-fname').value = p.firstName || '';
    $('#pf-lname').value = p.surname || '';
    $('#pf-dob').value = p.dateOfBirth || '';
    $('#pf-gender').value = fromApiEnum(GENDER_MAP, p.gender);
    $('#pf-pan').value = p.pan || '';
    $('#pf-marital').value = fromApiEnum(MARITAL_MAP, p.maritalStatus);
    $('#pf-city').value = p.city || '';
    $('#pf-metro').value = fromApiEnum(METRO_MAP, p.metroStatus) || 'Metro';
    $('#pf-occupation').value = fromApiEnum(OCCUPATION_MAP, p.occupation);
    $('#pf-lifestage').value = fromApiEnum(LIFESTAGE_MAP, p.lifeStage);
    $('#pf-employer').value = p.employer || '';
    $('#pf-designation').value = p.designation || '';
    $('#pf-spouse').value = p.spouseName || '';
    $('#pf-dependents').value = p.numberOfDependents || 0;
    $('#pf-depdetails').value = p.dependentDetails || '';
    $('#pf-phone').value = p.phone || '';
    $('#pf-email').value = p.email || '';
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

    try {
      const res = await fetch(`${API_BASE}/api/onboarding/search?mobile=${encodeURIComponent(mobile)}`);

      if (res.status === 404) {
        isOtpVerified = false;
        searchedMobile = '';
        clientFlags = { hasProfile: false, hasFinancials: false, hasRiskAssessment: false, hasGoalMap: false };
        NF.setActiveClientId('');
        NF.toast('No client found for this mobile number.', 'error');
        onClientChange();
        return;
      }

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.message || 'Search failed.');
      }

      const data = await res.json();
      isOtpVerified = data.status === 'OTPVerified';
      searchedMobile = data.mobileNumber || mobile;
      clientFlags = {
        hasProfile: !!data.hasProfile,
        hasFinancials: !!data.hasFinancials,
        hasRiskAssessment: !!data.hasRiskAssessment,
        hasGoalMap: !!data.hasGoalMap
      };
      NF.setActiveClientId(String(data.onboardingId));

      NF.toast(
        isOtpVerified
          ? 'Client found. Onboarding sections unlocked.'
          : `Client found, but mobile is not OTP-verified yet (status: ${data.status}).`,
        isOtpVerified ? 'success' : 'info'
      );

      onClientChange();

      // Pre-populate each section as soon as we know it already has data, so it's
      // ready even before the RM clicks that tab. Sections with no data yet are left
      // blank — no point firing a GET that's guaranteed to 404.
      if (clientFlags.hasProfile) loadProfileFromApi(data.onboardingId);
      if (clientFlags.hasFinancials) loadFinancialsFromApi(data.onboardingId);
      if (clientFlags.hasRiskAssessment) loadRiskFromApi(data.onboardingId);
      if (clientFlags.hasGoalMap) loadGoalsFromApi(data.onboardingId);
    } catch (err) {
      isOtpVerified = false;
      searchedMobile = '';
      clientFlags = { hasProfile: false, hasFinancials: false, hasRiskAssessment: false, hasGoalMap: false };
      NF.toast(err.message || 'Could not reach the server.', 'error');
      onClientChange();
    } finally {
      if (btn) btn.disabled = false;
    }
  }

  function onClientChange() {
    updateSidebarLocks();
    const client = getActiveClient();
    const chip = $('#client-chip');
    const chipLabel = $('#chip-label');
    const deleteBtn = $('#btn-delete-client');

    const activeId = NF.getActiveClientId();

    if (client) {
      chip.style.display = 'flex';
      chipLabel.textContent = `${client.profile.fname} ${client.profile.lname} (${client.id})`;
      if (deleteBtn) deleteBtn.style.display = 'inline-flex';

      // Load client profile data into form fields
      loadProfileForm(client.profile);

      // Load financials if they exist
      if (client.financials) {
        loadFinancialsForm(client.financials);
      } else {
        $('#form-financials').reset();
      }

      // Load goals
      goals = client.goals || [];
      renderGoalsList();

      // Load risk answers
      riskAnswers = client.riskAnswers || {};
      renderRiskQuestions();
      updateRiskScoreCircle();

    } else if (activeId && searchedMobile) {
      chip.style.display = 'flex';
      chipLabel.textContent = `${searchedMobile} (Onboarding #${activeId})`;
      if (deleteBtn) deleteBtn.style.display = 'none';
      $('#form-profile').reset();
      $('#form-financials').reset();
      goals = [];
      riskAnswers = {};
      renderGoalsList();
      renderRiskQuestions();
      updateRiskScoreCircle();
    } else {
      chip.style.display = 'none';
      if (deleteBtn) deleteBtn.style.display = 'none';
      $('#form-profile').reset();
      $('#form-financials').reset();
      goals = [];
      riskAnswers = {};
      renderGoalsList();
      renderRiskQuestions();
      updateRiskScoreCircle();
    }

    renderCurrentView();
  }

  function getActiveClient() {
    const id = NF.getActiveClientId();
    return id ? NF.getClient(id) : null;
  }

  // ── Sidebar Access Controls ──
  function updateSidebarLocks() {
    const activeId = NF.getActiveClientId();
    const client = getActiveClient();
    // Phase 1 onboarding tabs only unlock once /api/onboarding/search confirms status === 'OTPVerified'
    const unlocked = !!activeId && isOtpVerified;
    const g3Passed = !!client && NF.isGatePassed(client.id, 3);
    const hasDel = !!client && !!NF.getArtifact(client.id, '13', 'rm');
    const hasCon = !!client && !!NF.getArtifact(client.id, '14', 'rm');

    $$('.nav-btn').forEach(btn => {
      const view = btn.dataset.view;
      if (view === 'overview') {
        btn.classList.remove('locked');
      } else if (['profile', 'risk', 'financials', 'goals', 'gate1'].includes(view)) {
        btn.classList.toggle('locked', !unlocked);
      } else if (['planreview', 'delivery'].includes(view)) {
        btn.classList.toggle('locked', !g3Passed);
      } else if (view === 'consent') {
        btn.classList.toggle('locked', !hasDel);
      } else if (view === 'gate4') {
        btn.classList.toggle('locked', !hasCon);
      }
    });
  }

  // ── Render Views ──
  function renderCurrentView() {
    const client = getActiveClient();
    const onboardingId = NF.getActiveClientId();

    // Hide guards by default
    hideAllGuards();

    if (activeView === 'overview') {
      renderOverview(client);
    } else if (['risk', 'financials', 'goals'].includes(activeView)) {
      // These sections are backend-driven (keyed by onboardingId), not the local NF client object.
      if (!onboardingId) {
        showGuard(activeView, 'No Client Selected', 'Search for a client by mobile number from the Overview tab first.');
      }
    } else if (activeView === 'gate1') {
      if (!client) {
        showGuard(activeView, 'No Client Selected', 'Select a client from the Overview tab or create a new client profile first.');
      } else {
        renderGate1(client);
      }
    } else if (['planreview', 'delivery', 'consent', 'gate4'].includes(activeView)) {
      if (!client) {
        showGuard(activeView, 'No Client Selected', 'Select a client from the Overview tab first.');
      } else if (!NF.isGatePassed(client.id, 3)) {
        showGuard(activeView, 'Awaiting Gate 3 Clearance', 'The Researcher Portal must complete the strategic review and approve Gate 3 before Plan Review and Delivery can begin.');
      } else {
        if (activeView === 'planreview') renderPlanReview(client);
        else if (activeView === 'delivery') renderDelivery(client);
        else if (activeView === 'consent') renderConsent(client);
        else if (activeView === 'gate4') renderGate4(client);
      }
    }
  }

  function hideAllGuards() {
    const guards = ['risk-guard', 'fin-guard', 'goals-guard', 'gate1-guard'];
    guards.forEach(g => {
      const el = $(`#${g}`);
      if (el) {
        el.style.display = 'none';
        el.innerHTML = '';
      }
    });
  }

  function showGuard(viewId, title, message) {
    let guardId = '';
    if (viewId === 'risk') guardId = 'risk-guard';
    else if (viewId === 'financials') guardId = 'fin-guard';
    else if (viewId === 'goals') guardId = 'goals-guard';
    else if (viewId === 'gate1') guardId = 'gate1-guard';
    
    const guardContainer = guardId ? $(`#${guardId}`) : null;
    
    const html = `
      <div class="guard">
        <div class="lock-icon">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
          </svg>
        </div>
        <h3>${title}</h3>
        <p>${message}</p>
      </div>
    `;

    if (guardContainer) {
      guardContainer.style.display = 'block';
      guardContainer.innerHTML = html;
      // Hide the forms/contents
      if (viewId === 'risk') {
        $('#risk-score-header').style.display = 'none';
        $('#risk-questions').style.display = 'none';
        $('#btn-save-risk').parentElement.style.display = 'none';
      } else if (viewId === 'financials') {
        $('#form-financials').style.display = 'none';
      } else if (viewId === 'goals') {
        $('#form-goal').style.display = 'none';
        $('#goals-list').style.display = 'none';
        $('#btn-save-goals').parentElement.style.display = 'none';
      } else if (viewId === 'gate1') {
        $('#gate1-card').style.display = 'none';
      }
    } else {
      // For Phase 2 views, render directly into content area
      const contentId = `${viewId}-content`;
      const container = $(`#${contentId}`);
      if (container) {
        container.innerHTML = html;
      }
    }
  }

  function restoreFormVisibility(viewId) {
    if (viewId === 'risk') {
      $('#risk-score-header').style.display = 'flex';
      $('#risk-questions').style.display = 'block';
      $('#btn-save-risk').parentElement.style.display = 'flex';
    } else if (viewId === 'financials') {
      $('#form-financials').style.display = 'block';
    } else if (viewId === 'goals') {
      $('#form-goal').style.display = 'block';
      $('#goals-list').style.display = 'block';
      $('#btn-save-goals').parentElement.style.display = 'flex';
    } else if (viewId === 'gate1') {
      $('#gate1-card').style.display = 'block';
    }
  }

  // ═══════════════════════════════════════════
  //  VIEW: OVERVIEW
  // ═══════════════════════════════════════════
  function renderOverview(client) {
    const statsContainer = $('#overview-stats');
    const artsContainer = $('#overview-artifacts');

    if (!client) {
      const activeId = NF.getActiveClientId();
      const title = activeId ? 'Mobile Number Not OTP-Verified' : 'No Active Client';
      const desc = activeId
        ? 'This client was found, but their mobile number has not completed OTP verification yet. Ask the client to verify their number in the app, then search again.'
        : 'Enter a client\'s mobile number above and click <strong>Get Client</strong> to begin.';
      statsContainer.innerHTML = `
        <div class="card" style="grid-column: 1/-1; text-align: center; padding: 40px;">
          <h3 style="justify-content: center; color: var(--text-tertiary);">${title}</h3>
          <p style="color: var(--text-muted); font-size: .85rem; margin-top: 8px;">${desc}</p>
        </div>
      `;
      artsContainer.innerHTML = '';
      return;
    }

    // Client selected -> render stats dashboard
    const riskCat = client.riskCategory || 'Not Assessed';
    const riskScore = client.riskScore || 0;
    const goalCount = (client.goals || []).length;
    const generatedCount = Object.keys(client.artifacts || {}).length;

    statsContainer.innerHTML = `
      <div class="stat glass">
        <div class="stat-icon" style="background:rgba(99,102,241,.15);color:var(--accent-blue)">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4-4v2"/><circle cx="9" cy="7" r="4"/></svg>
        </div>
        <div><div class="stat-val">${client.id}</div><div class="stat-lbl">Active Client ID</div></div>
      </div>
      <div class="stat glass">
        <div class="stat-icon" style="background:rgba(245,158,11,.15);color:var(--accent-amber)">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>
        </div>
        <div><div class="stat-val">${riskScore}/100</div><div class="stat-lbl">Risk Profile Score</div></div>
      </div>
      <div class="stat glass">
        <div class="stat-icon" style="background:rgba(16,185,129,.15);color:var(--accent-green)">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/></svg>
        </div>
        <div><div class="stat-val">${goalCount}</div><div class="stat-lbl">Goals Mapped</div></div>
      </div>
      <div class="stat glass">
        <div class="stat-icon" style="background:rgba(168,85,247,.15);color:var(--accent-purple)">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
        </div>
        <div><div class="stat-val">${generatedCount}/14</div><div class="stat-lbl">System Artifacts</div></div>
      </div>
    `;

    // Render Gate Progress & Artifact list
    let gatesHTML = '<div class="form-sec" style="margin-top:20px">Compliance & Approval Gates</div>';
    gatesHTML += '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:14px;margin-bottom:20px">';
    
    const gates = NF.getGateStatus(client.id);
    const gateTimestamps = client.gateTimestamps || {};
    const gateNames = { 1: 'Intake Clear', 2: 'Analysis Clear', 3: 'Strategic Clear', 4: 'Delivery & Consent' };

    for (let g = 1; g <= 4; g++) {
      const active = (g === 1 || gates[g-1]);
      const passed = gates[g];
      const cls = passed ? 'passed' : (active ? 'active' : 'locked');
      const numCls = passed ? 'ok' : (active ? 'pending' : 'off');
      const ts = gateTimestamps[g] ? NF.fmtDate(gateTimestamps[g]) : 'Pending';

      gatesHTML += `
        <div class="gate-card ${cls}">
          <div class="gate-hdr" style="margin-bottom: 0;">
            <div class="gate-num ${numCls}">${g}</div>
            <div>
              <div class="gate-title">${gateNames[g]}</div>
              <div class="gate-sub">${passed ? 'Cleared · ' + ts : 'Awaiting Approval'}</div>
            </div>
          </div>
        </div>
      `;
    }
    gatesHTML += '</div>';

    // Artifacts checklist
    let artsHTML = '<div class="form-sec">Fiduciary Artifact Registry (5-Year Retention Track)</div>';
    artsHTML += '<div class="card"><table class="tbl"><thead><tr><th>ID</th><th>Artifact Name</th><th>Author</th><th>Status</th><th>Last Action</th></tr></thead><tbody>';
    
    for (let id = 1; id <= 14; id++) {
      const artId = String(id).padStart(2, '0');
      const name = NF.ARTIFACT_NAMES[artId];
      const agent = NF.ARTIFACT_AGENTS[artId];
      const art = NF.getArtifact(client.id, artId, 'rm');
      const status = art ? '<span class="tag tag-green">Archived (v' + art.version + ')</span>' : '<span class="tag tag-blue">Draft / Pending</span>';
      const ts = art ? NF.fmtDate(art.generatedAt) : '—';
      artsHTML += `
        <tr>
          <td style="font-weight:700;color:var(--accent-blue)">${artId}</td>
          <td>${name}</td>
          <td><span class="tag ${agent==='RM'?'tag-blue':agent==='Analyst'?'tag-amber':'tag-purple'}">${agent}</span></td>
          <td>${status}</td>
          <td style="font-size:.78rem;color:var(--text-tertiary)">${ts}</td>
        </tr>
      `;
    }
    artsHTML += '</tbody></table></div>';

    artsContainer.innerHTML = gatesHTML + artsHTML;
  }

  // ═══════════════════════════════════════════
  //  VIEW: CLIENT PROFILE (Artifact 01)
  // ═══════════════════════════════════════════
  function setupProfileForm() {
    const form = $('#form-profile');
    if (!form) return;

    form.addEventListener('submit', async (e) => {
      e.preventDefault();

      const onboardingId = NF.getActiveClientId();
      if (!onboardingId) {
        NF.toast('Search for a client by mobile number first.', 'error');
        return;
      }

      const payload = {
        firstName: $('#pf-fname').value.trim(),
        surname: $('#pf-lname').value.trim(),
        dateOfBirth: $('#pf-dob').value,
        gender: toApiEnum(GENDER_MAP, $('#pf-gender').value),
        pan: emptyToUndefined($('#pf-pan').value.toUpperCase()),
        maritalStatus: toApiEnum(MARITAL_MAP, $('#pf-marital').value),
        city: $('#pf-city').value.trim(),
        metroStatus: toApiEnum(METRO_MAP, $('#pf-metro').value),
        occupation: toApiEnum(OCCUPATION_MAP, $('#pf-occupation').value),
        lifeStage: toApiEnum(LIFESTAGE_MAP, $('#pf-lifestage').value),
        employer: emptyToUndefined($('#pf-employer').value),
        designation: emptyToUndefined($('#pf-designation').value),
        spouseName: emptyToUndefined($('#pf-spouse').value),
        numberOfDependents: parseInt($('#pf-dependents').value || '0', 10),
        dependentDetails: emptyToUndefined($('#pf-depdetails').value),
        phone: emptyToUndefined($('#pf-phone').value),
        email: emptyToUndefined($('#pf-email').value)
      };

      const btn = $('#btn-save-profile');
      if (btn) btn.disabled = true;

      try {
        const res = await fetch(`${API_BASE}/api/customers/${onboardingId}/profile`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });

        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body.message || 'Failed to save client profile.');
        }

        const saved = await res.json();
        populateProfileFormFromApi(saved);
        setProfileFormMode('update');
        clientFlags.hasProfile = true;
        NF.toast(`Client profile saved for Onboarding #${onboardingId}.`, 'success');
        switchView('overview');
      } catch (err) {
        NF.toast(err.message || 'Could not reach the server.', 'error');
      } finally {
        if (btn) btn.disabled = false;
      }
    });
  }

  function loadProfileForm(p) {
    if (!p) return;
    $('#pf-fname').value = p.fname || '';
    $('#pf-lname').value = p.lname || '';
    $('#pf-dob').value = p.dob || '';
    $('#pf-gender').value = p.gender || '';
    $('#pf-pan').value = p.pan || '';
    $('#pf-marital').value = p.marital || '';
    $('#pf-city').value = p.city || '';
    $('#pf-metro').value = p.metro || 'Metro';
    $('#pf-occupation').value = p.occupation || '';
    $('#pf-lifestage').value = p.lifestage || '';
    $('#pf-employer').value = p.employer || '';
    $('#pf-designation').value = p.designation || '';
    $('#pf-spouse').value = p.spouse || '';
    $('#pf-dependents').value = p.dependents || 0;
    $('#pf-depdetails').value = p.depdetails || '';
    $('#pf-phone').value = p.phone || '';
    $('#pf-email').value = p.email || '';

    // Update submit button text to reflect Edit vs Create
    $('#btn-save-profile').innerHTML = `
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>
      Save Profile &amp; Generate Artifact 01
    `;
  }

  // ═══════════════════════════════════════════
  //  VIEW: RISK ASSESSMENT (Artifact 02)
  // ═══════════════════════════════════════════
  function renderRiskQuestions() {
    restoreFormVisibility('risk');
    const container = $('#risk-questions');
    if (!container) return;

    container.innerHTML = '';
    NF.RISK_QUESTIONS.forEach((q, idx) => {
      const savedScore = riskAnswers[idx];
      const card = document.createElement('div');
      card.className = 'rq-card';
      
      const labelClass = q.dim === 'capacity' ? 'capacity' : q.dim === 'tolerance' ? 'tolerance' : 'perception';
      const labelText = q.dim.toUpperCase();

      card.innerHTML = `
        <span class="rq-dim ${labelClass}">${labelText} — Question ${q.code}</span>
        <div class="rq-text">${idx + 1}. ${q.text}</div>
        <div class="rq-opts">
          ${q.opts.map((opt, oIdx) => {
            const checked = savedScore === opt[1] ? 'checked' : '';
            return `
              <label class="rq-opt">
                <input type="radio" name="rq-${idx}" value="${opt[1]}" ${checked} />
                <span>${opt[0]} (Score: ${opt[1]})</span>
              </label>
            `;
          }).join('')}
        </div>
      `;

      // Attach change listener to radio group
      card.querySelectorAll('input[type="radio"]').forEach(radio => {
        radio.addEventListener('change', () => {
          riskAnswers[idx] = parseInt(radio.value);
          updateRiskScoreCircle();
        });
      });

      container.appendChild(card);
    });
  }

  function updateRiskScoreCircle() {
    const answeredCount = Object.keys(riskAnswers).length;
    const totalQuestions = NF.RISK_QUESTIONS.length;
    const saveBtn = $('#btn-save-risk');

    let totalScore = 0;
    if (answeredCount > 0) {
      totalScore = Object.values(riskAnswers).reduce((a, b) => a + b, 0);
    }

    // Update Ring SVG offset
    const offset = 326.7 - (326.7 * totalScore / 100);
    $('#score-fill-circle').style.strokeDashoffset = offset;
    $('#score-num').textContent = totalScore;

    if (answeredCount === totalQuestions) {
      const catData = NF.scoreToCategory(totalScore);
      $('#score-cat').textContent = catData.cat;
      $('#score-cat').style.color = catData.color;
      $('#score-alloc').textContent = `Target Strategic Allocation: Equity ${catData.eq}% · Debt ${catData.debt}% · Gold ${catData.gold}%`;
      $('#score-fill-circle').style.stroke = catData.color;
      if (saveBtn) saveBtn.disabled = false;
    } else {
      $('#score-cat').textContent = 'In Progress';
      $('#score-cat').style.color = 'var(--text-secondary)';
      $('#score-alloc').textContent = `Answered ${answeredCount} / ${totalQuestions} questions to calculate risk capacity, tolerance & perception profile.`;
      $('#score-fill-circle').style.stroke = 'var(--accent-blue)';
      if (saveBtn) saveBtn.disabled = true;
    }
  }

  function openBlankRiskForm() {
    riskAnswers = {};
    renderRiskQuestions();
    updateRiskScoreCircle();
  }

  // ── Load Risk Assessment (GET /api/customers/{onboardingId}/risk-assessment) ──
  async function loadRiskFromApi(onboardingId) {
    try {
      const res = await fetch(`${API_BASE}/api/customers/${onboardingId}/risk-assessment`);

      if (res.status === 404) {
        openBlankRiskForm();
        return;
      }

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.message || 'Failed to load risk assessment.');
      }

      const data = await res.json();
      riskAnswers = {};
      (data.answers || []).forEach(a => {
        const idx = NF.RISK_QUESTIONS.findIndex(q => q.code === a.questionCode);
        if (idx !== -1) riskAnswers[idx] = a.score;
      });
      renderRiskQuestions();
      updateRiskScoreCircle();
    } catch (err) {
      NF.toast(err.message || 'Could not reach the server.', 'error');
    }
  }

  function setupRiskForm() {
    const btn = $('#btn-save-risk');
    if (!btn) return;

    btn.addEventListener('click', async () => {
      const onboardingId = NF.getActiveClientId();
      if (!onboardingId) return;

      const answeredCount = Object.keys(riskAnswers).length;
      if (answeredCount < NF.RISK_QUESTIONS.length) {
        NF.toast('Complete all 20 questions first!', 'error');
        return;
      }

      const answers = NF.RISK_QUESTIONS.map((q, idx) => ({ questionCode: q.code, score: riskAnswers[idx] }));

      btn.disabled = true;
      try {
        const res = await fetch(`${API_BASE}/api/customers/${onboardingId}/risk-assessment`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ answers })
        });

        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body.message || 'Failed to save risk assessment.');
        }

        const saved = await res.json();
        clientFlags.hasRiskAssessment = true;
        NF.toast(`Risk Profile saved — ${saved.riskCategory} (${saved.totalScore}/100).`, 'success');
        switchView('overview');
      } catch (err) {
        NF.toast(err.message || 'Could not reach the server.', 'error');
      } finally {
        btn.disabled = false;
      }
    });
  }

  // ═══════════════════════════════════════════
  //  VIEW: FINANCIALS (Artifact 03)
  // ═══════════════════════════════════════════

  // UI input id suffix (after "fi-") -> API field name
  const FINANCIALS_FIELD_MAP = {
    basic: 'incomeBasic', hra: 'incomeHra', special: 'incomeSpecial', rental: 'incomeRental',
    dividend: 'incomeDividend', otherinc: 'incomeOther',
    housing: 'expHousing', household: 'expHousehold', education: 'expEducation', healthcare: 'expHealthcare',
    lifestyle: 'expLifestyle', loanemi: 'expLoanEmi', inspremium: 'expInsurancePremium', otherexp: 'expOther',
    bank: 'assetBank', mf: 'assetMf', equity: 'assetEquity', epf: 'assetEpf', nps: 'assetNps',
    realestate: 'assetRealEstate', gold: 'assetGold', surrender: 'assetSurrenderValue',
    homeloan: 'liabHomeLoan', vehicleloan: 'liabVehicleLoan', personalloan: 'liabPersonalLoan', eduloan: 'liabEducationLoan',
    termlife: 'insTermLifeSumAssured', termpremium: 'insTermLifePremium', healthsi: 'insHealthSumInsured', bundledsa: 'insBundledSumAssured'
  };

  function openBlankFinancialsForm() {
    const form = $('#form-financials');
    if (form) form.reset();
  }

  // ── Load Financials (GET /api/customers/{onboardingId}/financials) ──
  async function loadFinancialsFromApi(onboardingId) {
    try {
      const res = await fetch(`${API_BASE}/api/customers/${onboardingId}/financials`);

      if (res.status === 404) {
        openBlankFinancialsForm();
        return;
      }

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.message || 'Failed to load financials.');
      }

      const data = await res.json();
      Object.entries(FINANCIALS_FIELD_MAP).forEach(([uiSuffix, apiField]) => {
        const input = $(`#fi-${uiSuffix}`);
        if (input) input.value = data[apiField] || 0;
      });
    } catch (err) {
      NF.toast(err.message || 'Could not reach the server.', 'error');
    }
  }

  function loadFinancialsForm(f) {
    if (!f) return;
    // Income
    $('#fi-basic').value = f.income.basic || 0;
    $('#fi-hra').value = f.income.hra || 0;
    $('#fi-special').value = f.income.special || 0;
    $('#fi-rental').value = f.income.rental || 0;
    $('#fi-dividend').value = f.income.dividend || 0;
    $('#fi-otherinc').value = f.income.otherinc || 0;

    // Expenses
    $('#fi-housing').value = f.expenses.housing || 0;
    $('#fi-household').value = f.expenses.household || 0;
    $('#fi-education').value = f.expenses.education || 0;
    $('#fi-healthcare').value = f.expenses.healthcare || 0;
    $('#fi-lifestyle').value = f.expenses.lifestyle || 0;
    $('#fi-loanemi').value = f.expenses.loanemi || 0;
    $('#fi-inspremium').value = f.expenses.inspremium || 0;
    $('#fi-otherexp').value = f.expenses.otherexp || 0;

    // Assets
    $('#fi-bank').value = f.assets.bank || 0;
    $('#fi-mf').value = f.assets.mf || 0;
    $('#fi-equity').value = f.assets.equity || 0;
    $('#fi-epf').value = f.assets.epf || 0;
    $('#fi-nps').value = f.assets.nps || 0;
    $('#fi-realestate').value = f.assets.realestate || 0;
    $('#fi-gold').value = f.assets.gold || 0;
    $('#fi-surrender').value = f.assets.surrender || 0;

    // Liabilities
    $('#fi-homeloan').value = f.liabilities.homeloan || 0;
    $('#fi-vehicleloan').value = f.liabilities.vehicleloan || 0;
    $('#fi-personalloan').value = f.liabilities.personalloan || 0;
    $('#fi-eduloan').value = f.liabilities.eduloan || 0;

    // Insurance
    $('#fi-termlife').value = f.insurance.termlife || 0;
    $('#fi-termpremium').value = f.insurance.termpremium || 0;
    $('#fi-healthsi').value = f.insurance.healthsi || 0;
    $('#fi-bundledsa').value = f.insurance.bundledsa || 0;
  }

  function setupFinancialsForm() {
    const form = $('#form-financials');
    if (!form) return;

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const onboardingId = NF.getActiveClientId();
      if (!onboardingId) {
        NF.toast('Search for a client by mobile number first.', 'error');
        return;
      }

      const payload = {};
      Object.entries(FINANCIALS_FIELD_MAP).forEach(([uiSuffix, apiField]) => {
        const input = $(`#fi-${uiSuffix}`);
        payload[apiField] = parseFloat((input && input.value) || '0');
      });

      const btn = $('#btn-save-financials');
      if (btn) btn.disabled = true;

      try {
        const res = await fetch(`${API_BASE}/api/customers/${onboardingId}/financials`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });

        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body.message || 'Failed to save financials.');
        }

        const saved = await res.json();
        clientFlags.hasFinancials = true;
        NF.toast(`Financials saved — Net Worth ${NF.fmt(saved.netWorth)}, Monthly Surplus ${NF.fmt(saved.monthlySurplus)}.`, 'success');
        switchView('overview');
      } catch (err) {
        NF.toast(err.message || 'Could not reach the server.', 'error');
      } finally {
        if (btn) btn.disabled = false;
      }
    });
  }


  // ═══════════════════════════════════════════
  //  VIEW: GOAL MAP (Artifact 04)
  // ═══════════════════════════════════════════

  const PRIORITY_MAP = { Critical: 'CRITICAL', Important: 'IMPORTANT', Aspirational: 'ASPIRATIONAL' };
  const INFLATION_MAP = { cpi: 'CPI', education: 'EDUCATION', healthcare: 'HEALTHCARE', lifestyle: 'LIFESTYLE' };
  const FLEXIBILITY_MAP = { 'Non-Negotiable': 'NON_NEGOTIABLE', 'Negotiable': 'NEGOTIABLE' };

  // Adapts a CustomerGoalResponse (API) into the local goal shape used by renderGoalsList()
  function apiGoalToLocal(g) {
    return {
      id: g.id,
      name: g.name,
      priority: fromApiEnum(PRIORITY_MAP, g.priority),
      horizon: g.timelineYears,
      costToday: g.targetCorpus,
      inflationCat: fromApiEnum(INFLATION_MAP, g.inflationCategory),
      inflRate: (g.inflationRatePct || 0) / 100,
      futureCost: g.futureCost,
      flexibility: fromApiEnum(FLEXIBILITY_MAP, g.flexibility),
      earmarked: g.earmarkedAssets,
      earreturn: g.earmarkedReturnPct
    };
  }

  function openBlankGoalsForm() {
    goals = [];
    renderGoalsList();
  }

  // ── Load Goal Map (GET /api/customers/{onboardingId}/goals) ──
  async function loadGoalsFromApi(onboardingId) {
    try {
      const res = await fetch(`${API_BASE}/api/customers/${onboardingId}/goals`);
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.message || 'Failed to load goal map.');
      }
      const data = await res.json();
      goals = data.map(apiGoalToLocal);
      renderGoalsList();
    } catch (err) {
      NF.toast(err.message || 'Could not reach the server.', 'error');
    }
  }

  function setupGoalsForm() {
    const form = $('#form-goal');
    if (!form) return;

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const onboardingId = NF.getActiveClientId();
      if (!onboardingId) {
        NF.toast('Search for a client by mobile number first.', 'error');
        return;
      }

      const payload = {
        name: $('#gl-name').value.trim(),
        targetCorpus: parseFloat($('#gl-cost').value),
        timelineYears: parseInt($('#gl-horizon').value, 10),
        priority: toApiEnum(PRIORITY_MAP, $('#gl-priority').value),
        inflationCategory: toApiEnum(INFLATION_MAP, $('#gl-inflation').value),
        flexibility: toApiEnum(FLEXIBILITY_MAP, $('#gl-flexibility').value),
        earmarkedAssets: parseFloat($('#gl-earmarked').value || '0'),
        earmarkedReturnPct: parseFloat($('#gl-earreturn').value || '0')
      };

      const btn = $('#btn-add-goal');
      if (btn) btn.disabled = true;

      try {
        const res = await fetch(`${API_BASE}/api/customers/${onboardingId}/goals`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });

        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body.message || 'Failed to add goal.');
        }

        const data = await res.json();
        goals = data.map(apiGoalToLocal);
        clientFlags.hasGoalMap = goals.length > 0;

        NF.toast(`Goal "${payload.name}" added.`, 'success');
        form.reset();
        $('#gl-earmarked').value = 0;
        $('#gl-earreturn').value = 0;
        renderGoalsList();
      } catch (err) {
        NF.toast(err.message || 'Could not reach the server.', 'error');
      } finally {
        if (btn) btn.disabled = false;
      }
    });

    // "Save Goal Map" confirms the mapped goals and returns to Overview.
    // Goals are already persisted individually via POST above.
    const saveBtn = $('#btn-save-goals');
    if (saveBtn) {
      saveBtn.addEventListener('click', () => {
        if (goals.length === 0) {
          NF.toast('Please add at least one goal first!', 'error');
          return;
        }
        NF.toast('Goal Map confirmed.', 'success');
        switchView('overview');
      });
    }
  }

  function renderGoalsList() {
    restoreFormVisibility('goals');
    const container = $('#goals-list');
    const saveBtn = $('#btn-save-goals');
    if (!container) return;

    container.innerHTML = '';
    
    if (goals.length === 0) {
      container.innerHTML = `
        <div style="color: var(--text-tertiary); font-size: .85rem; padding: 20px; text-align: center;" class="card">
          No goals mapped yet. Use the form above to add client financial goals.
        </div>
      `;
      if (saveBtn) saveBtn.disabled = true;
      return;
    }

    if (saveBtn) saveBtn.disabled = false;

    // Headings for mapped list
    const title = document.createElement('div');
    title.className = 'form-sec';
    title.textContent = 'Current Mapped Client Goals';
    container.appendChild(title);

    goals.forEach((g) => {
      const el = document.createElement('div');
      el.className = 'goal-row';

      const dotClass = g.priority === 'Critical' ? 'pri-critical' : g.priority === 'Important' ? 'pri-important' : 'pri-aspirational';
      const inflNames = { cpi: 'CPI (6%)', education: 'Education (10%)', healthcare: 'Healthcare (9%)', lifestyle: 'Lifestyle (7.5%)' };

      el.innerHTML = `
        <div>
          <div class="goal-name">${g.name}</div>
          <div class="goal-meta">
            <span><span class="priority-dot ${dotClass}"></span>${g.priority}</span>
            <span>Horizon: ${g.horizon} Yrs</span>
            <span>Inflation: ${inflNames[g.inflationCat]}</span>
            <span>Today's Cost: ${NF.fmt(g.costToday)}</span>
          </div>
        </div>
        <div style="display: flex; align-items: center; gap: 14px;">
          <div style="text-align: right;">
            <div class="goal-amt">${NF.fmt(g.futureCost)}</div>
            <div style="font-size: .65rem; color: var(--text-tertiary)">Future inflation-adjusted target</div>
          </div>
          <button class="goal-del" data-goal-id="${g.id}">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
          </button>
        </div>
      `;

      el.querySelector('.goal-del').addEventListener('click', async (e) => {
        const onboardingId = NF.getActiveClientId();
        const goalId = e.currentTarget.dataset.goalId;
        if (!onboardingId || !goalId) return;

        try {
          const res = await fetch(`${API_BASE}/api/customers/${onboardingId}/goals/${goalId}`, { method: 'DELETE' });
          if (!res.ok) {
            const body = await res.json().catch(() => ({}));
            throw new Error(body.message || 'Failed to delete goal.');
          }
          const data = await res.json();
          goals = data.map(apiGoalToLocal);
          clientFlags.hasGoalMap = goals.length > 0;
          NF.toast('Goal deleted.', 'info');
          renderGoalsList();
        } catch (err) {
          NF.toast(err.message || 'Could not reach the server.', 'error');
        }
      });

      container.appendChild(el);
    });
  }

  // ═══════════════════════════════════════════
  //  VIEW: GATE 1 (Approval)
  // ═══════════════════════════════════════════
  function renderGate1(client) {
    restoreFormVisibility('gate1');
    const checklist = $('#gate1-checks');
    const approveBtn = $('#btn-gate1-approve');
    if (!checklist || !approveBtn) return;

    // Check actual artifact generation states
    const art01 = !!NF.getArtifact(client.id, '01', 'rm');
    const art02 = !!NF.getArtifact(client.id, '02', 'rm');
    const art03 = !!NF.getArtifact(client.id, '03', 'rm');
    const art04 = !!NF.getArtifact(client.id, '04', 'rm');

    const autoChecks = [art01, art02, art03, art04];
    
    // Set checkboxes based on artifact existence
    for (let c = 1; c <= 4; c++) {
      const box = $(`#g1c${c}`);
      if (box) {
        if (autoChecks[c - 1]) {
          box.classList.add('on');
          gate1Checks[c - 1] = true;
        } else {
          box.classList.remove('on');
          gate1Checks[c - 1] = false;
        }
      }
    }

    const g1Passed = NF.isGatePassed(client.id, 1);
    if (g1Passed) {
      $('#gate1-num').className = 'gate-num ok';
      $('#gate1-num').textContent = '✓';
      approveBtn.disabled = true;
      approveBtn.textContent = 'Gate 1 Approved & Released to Analyst';
      approveBtn.className = 'btn btn-outline btn-lg';
    } else {
      $('#gate1-num').className = 'gate-num pending';
      $('#gate1-num').textContent = '1';
      approveBtn.className = 'btn btn-success btn-lg';
      approveBtn.textContent = 'Approve Gate 1 & Release to Analyst';
      // Enable only if all artifacts are compiled
      approveBtn.disabled = !autoChecks.every(Boolean);
    }
  }

  function setupGate1() {
    const btn = $('#btn-gate1-approve');
    if (!btn) return;

    btn.addEventListener('click', () => {
      const client = getActiveClient();
      if (!client) return;

      const passed = NF.passGate(client.id, 1);
      if (passed) {
        NF.toast('Gate 1 cleared! Financial records successfully released to Analyst Portal.', 'success');
        onClientChange();
        switchView('overview');
      } else {
        NF.toast('Error clearing gate.', 'error');
      }
    });
  }

  // ═══════════════════════════════════════════
  //  PHASE 2 — VIEW: PLAN REVIEW (Artifact 12 Viewer)
  // ═══════════════════════════════════════════
  function renderPlanReview(client) {
    const container = $('#planreview-content');
    if (!container) return;

    const art12 = NF.getArtifact(client.id, '12', 'rm');
    if (!art12) {
      container.innerHTML = `
        <div class="card" style="border-color: var(--accent-amber-glow)">
          <h3 style="color: var(--accent-amber)">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/></svg>
            Comprehensive Plan (Artifact 12) Missing
          </h3>
          <p style="color: var(--text-secondary); font-size: .85rem; margin-top: 8px;">
            The comprehensive master advisory plan has not been generated by the Researcher.
          </p>
          <p style="color: var(--text-muted); font-size: .78rem; margin-top: 4px;">
            Once the Researcher finishes plan compiling, this tab will unlock live details.
          </p>
        </div>
      `;
      return;
    }

    container.innerHTML = `
      <div class="card" style="border-color: var(--accent-green-glow)">
        <h3 style="color: var(--accent-green)">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>
          Artifact 12 — Comprehensive Financial Plan Available
        </h3>
        <p style="color: var(--text-secondary); font-size: .82rem; margin-top: 4px;">
          Fiduciary sign-off and recommendation modules are compile-locked. Review details below.
        </p>
      </div>
      <div class="artifact-viewer" style="max-height: 600px;">${escapeHtml(art12.content)}</div>
    `;
  }

  // ═══════════════════════════════════════════
  //  PHASE 2 — VIEW: DELIVERY (Artifact 13)
  // ═══════════════════════════════════════════
  function renderDelivery(client) {
    const container = $('#delivery-content');
    if (!container) return;

    const art13 = NF.getArtifact(client.id, '13', 'rm');
    
    // Render the implementation roadmap input form
    container.innerHTML = `
      <form class="form-card glass" id="form-delivery">
        <div class="form-sec">Plan Implementation Roadmap (Artifact 13)</div>
        <div class="frow">
          <div class="fgroup full">
            <label>Priority Action Items (KYC, account setup, redemption steps, etc.) *</label>
            <textarea id="dl-priorities" rows="4" required placeholder="e.g. 1. Complete PAN & KRA KYC updation for spouse.\\n2. Initiate surrender of traditional endowment policy (Sub-optimal yield)."></textarea>
          </div>
        </div>
        <div class="frow">
          <div class="fgroup full">
            <label>Specific Investment Action Schedule *</label>
            <textarea id="dl-actions" rows="4" required placeholder="e.g. 1. Deploy ₹1.5L in UTI Nifty 50 Index Fund (Direct Growth) via monthly SIP of ₹12,500.\\n2. Park ₹2.0L emergency corpus in Quantum Liquid Direct Fund."></textarea>
          </div>
        </div>
        <div class="frow">
          <div class="fgroup"><label>Expected Completion Timeline</label><input type="text" id="dl-timeline" placeholder="e.g. 30 Working Days" value="30 Days"/></div>
          <div class="fgroup"><label>Relationship Manager Notes</label><input type="text" id="dl-notes" placeholder="e.g. Client requested all monthly SIPs on 5th of each month."/></div>
        </div>
        <div class="form-actions">
          <button type="submit" class="btn btn-primary btn-lg">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/></svg>
            Generate Implementation Roadmap &amp; Artifact 13
          </button>
        </div>
      </form>
    `;

    // Populate if existing
    if (art13) {
      try {
        // Extract content from existing MD to prefill textareas roughly
        const lines = art13.content.split('\n');
        let priStr = '', actStr = '', timeline = '30 Days', notes = '';
        
        let section = '';
        lines.forEach(l => {
          if (l.includes('### Priority Action Steps')) section = 'pri';
          else if (l.includes('### Investment Schedule')) section = 'act';
          else if (l.startsWith('- **Completion Timeline:**')) timeline = l.replace('- **Completion Timeline:**', '').trim();
          else if (l.startsWith('- **Notes:**')) notes = l.replace('- **Notes:**', '').trim();
          else if (section === 'pri' && l.trim() && !l.startsWith('###') && !l.startsWith('-')) priStr += l.trim() + '\n';
          else if (section === 'act' && l.trim() && !l.startsWith('###') && !l.startsWith('-')) actStr += l.trim() + '\n';
        });

        $('#dl-priorities').value = priStr.trim() || '1. Setup Direct SIP portals.';
        $('#dl-actions').value = actStr.trim() || '1. Invest via direct mutual funds.';
        $('#dl-timeline').value = timeline;
        $('#dl-notes').value = notes;
      } catch (err) {
        console.warn('Failed to parse existing delivery MD: ', err);
      }
    }

    // Form submit
    $('#form-delivery').addEventListener('submit', (e) => {
      e.preventDefault();
      
      const pri = $('#dl-priorities').value;
      const act = $('#dl-actions').value;
      const tl = $('#dl-timeline').value;
      const nt = $('#dl-notes').value;

      const art13MD = generateArtifact13MD(client, pri, act, tl, nt);
      NF.setArtifact(client.id, '13', art13MD, 'rm');
      NF.toast('Artifact 13 — Client Delivery roadmap generated successfully!', 'success');
      
      updateSidebarLocks();
      switchView('consent');
    });
  }

  function generateArtifact13MD(client, pri, act, tl, nt) {
    const ts = new Date().toISOString();
    return `# Artifact 13 — Client Delivery Roadmap
**Strategic Implementation Schedule & Compliance Checklist**

- **Client ID:** ${client.id}
- **Compiled On:** ${NF.fmtDate(ts)}
- **Fiduciary Adviser:** SEBI Registered Investment Adviser
- **Completion Timeline:** ${tl}
- **Notes:** ${nt || '—'}

## Fiduciary Action Items
### Priority Action Steps
${pri}

### Investment Schedule (Direct Plans Only)
${act}

## Fiduciary Implementation Rules
1. **Fiduciary Execution:** The client must ensure that all equity and debt products are registered under **Direct Plan - Growth** option. Do not select "Regular" options as they introduce compound trailing commission expense drag.
2. **Transaction Safeguards:** Confirm that all bank accounts utilized for investments are registered with matching KYC credentials (PAN & Name match).
3. **Fiduciary Oversight:** Relationship Manager will provide quarterly operational guidance to assist the client in implementing tax tax savings sleeves and mutual fund allocations.

---
*Compliance Record: Under SEBI RIA rules, this implementation schedule forms part of the permanent fiduciary advice dossier.*`;
  }

  // ═══════════════════════════════════════════
  //  PHASE 2 — VIEW: CONSENT (Artifact 14)
  // ═══════════════════════════════════════════
  function renderConsent(client) {
    const container = $('#consent-content');
    if (!container) return;

    const art14 = NF.getArtifact(client.id, '14', 'rm');

    container.innerHTML = `
      <form class="form-card glass" id="form-consent">
        <div class="form-sec">Fiduciary Advice Consent Form (Artifact 14)</div>
        <p style="color:var(--text-secondary);font-size:.82rem;margin-bottom:14px;line-height:1.5;">
          Under SEBI (Investment Advisers) Regulations, 2013 (Regulation 15), the client must execute a written consent acknowledging receipt and acceptance of the comprehensive financial plan and disclosures.
        </p>
        
        <ul class="gate-checks" style="margin-bottom:20px;">
          <li><div class="chk-box" id="cs-chk-1"></div> The comprehensive financial plan (Artifact 12) has been fully presented and explained.</li>
          <li><div class="chk-box" id="cs-chk-2"></div> The client accepts the recommended strategic asset allocation &amp; product sleeves.</li>
          <li><div class="chk-box" id="cs-chk-3"></div> The client understands all risks, disclaimers, and market exposure terms.</li>
          <li><div class="chk-box" id="cs-chk-4"></div> Formal Investment Advisory Agreement (Regulation 15) is executed &amp; stored.</li>
          <li><div class="chk-box" id="cs-chk-5"></div> Advice fees are agreed to be within SEBI fee caps (Flat fee or % AUM guidelines).</li>
        </ul>

        <div class="frow">
          <div class="fgroup"><label>Client Signature Acknowledgment (Full Name) *</label><input type="text" id="cs-sign" required placeholder="e.g. Rahul Sharma"/></div>
          <div class="fgroup"><label>Consent Execution Date *</label><input type="date" id="cs-date" required/></div>
        </div>

        <div class="form-actions">
          <button type="submit" class="btn btn-success btn-lg" id="btn-save-consent" disabled>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>
            Execute Client Consent &amp; Generate Artifact 14
          </button>
        </div>
      </form>
    `;

    // Setup date to today
    $('#cs-date').value = new Date().toISOString().split('T')[0];

    const checks = [false, false, false, false, false];
    
    // Bind click events on check boxes
    for (let c = 1; c <= 5; c++) {
      const el = $(`#cs-chk-${c}`);
      if (el) {
        el.addEventListener('click', () => {
          checks[c-1] = !checks[c-1];
          el.classList.toggle('on', checks[c-1]);
          // Check all 5
          const allChecked = checks.every(Boolean);
          $('#btn-save-consent').disabled = !allChecked;
        });
      }
    }

    // Handle existing consent
    if (art14) {
      try {
        // Mock checking everything since it is generated
        for (let c = 1; c <= 5; c++) {
          const el = $(`#cs-chk-${c}`);
          if (el) el.classList.add('on');
          checks[c-1] = true;
        }
        $('#btn-save-consent').disabled = false;
        
        // Extract signature name
        const match = art14.content.match(/\*\*Digital Signature Acknowledgment:\*\* (.*)/);
        if (match && match[1]) {
          $('#cs-sign').value = match[1].trim();
        }
      } catch (err) {
        console.warn('Consent parse fail: ', err);
      }
    }

    // Submit
    $('#form-consent').addEventListener('submit', (e) => {
      e.preventDefault();

      const signName = $('#cs-sign').value;
      const exeDate = $('#cs-date').value;

      const art14MD = generateArtifact14MD(client, signName, exeDate);
      NF.setArtifact(client.id, '14', art14MD, 'rm');
      NF.toast('Artifact 14 — Client Consent captured successfully!', 'success');

      updateSidebarLocks();
      switchView('gate4');
    });
  }

  function generateArtifact14MD(client, signName, date) {
    const ts = new Date().toISOString();
    return `# Artifact 14 — Client Fiduciary Consent
**Regulation 15 Client Acknowledgment & Advisory Sign-Off Record**

- **Client ID:** ${client.id}
- **Executed On:** ${date}
- **Fiduciary Adviser:** SEBI Registered Investment Adviser
- **Advisory Agreement Ref:** SEBI-IA-REG15-NF-${client.id}

## Core Fiduciary Confirmations
1. **[CONFIRMED]** The comprehensive financial plan (Artifact 12) has been fully presented, discussed, and understood.
2. **[CONFIRMED]** The strategic asset allocation targets (Equity, Debt, Gold) and specific product recommendations (Direct Growth Mutual Funds, Sovereign Bonds) are accepted by the client without deviation.
3. **[CONFIRMED]** The client acknowledges and accepts that mutual fund investments are subject to market risks, and that adviser provides zero returns guarantees.
4. **[CONFIRMED]** The statutory Investment Advisory Agreement (Regulation 15) has been legally executed by both client and adviser.
5. **[CONFIRMED]** The advice fee structure has been reviewed and verified to conform with statutory SEBI fee ceiling regulations.

## Digital Signature Acknowledgment
- **Client Signature Acknowledgment:** ${signName}
- **Digital Fingerprint Hash:** SHA256-${Date.now().toString(16)}-NF-CONSENT
- **Timestamp:** ${NF.fmtDate(ts)}

---
*Fiduciary Notice: In accordance with SEBI guidelines, this document acts as the formal statutory audit record. Both client and adviser retain copies, and the master record is committed to the 5-year compliance repository.*`;
  }

  // ═══════════════════════════════════════════
  //  PHASE 2 — VIEW: GATE 4 (Final Sign-off)
  // ═══════════════════════════════════════════
  function renderGate4(client) {
    const container = $('#gate4-content');
    if (!container) return;

    const g4passed = NF.isGatePassed(client.id, 4);
    const checks = [false, false, false, false];
    
    container.innerHTML = `
      <div class="gate-card ${g4passed ? 'passed' : 'active'}" id="gate4-card">
        <div class="gate-hdr">
          <div class="gate-num ${g4passed ? 'ok' : 'pending'}" id="gate4-num">${g4passed ? '✓' : '4'}</div>
          <div>
            <div class="gate-title">Gate 4 — Final Advisory Sign-Off</div>
            <div class="gate-sub">${g4passed ? 'Advice Cycle Complete · Stored' : 'Compliance validation and permanent storage commit'}</div>
          </div>
        </div>

        <ul class="gate-checks" style="margin-bottom:20px;">
          <li><div class="chk-box" id="g4-chk-1"></div> Plan implementation priorities and roadmap are clear (Artifact 13).</li>
          <li><div class="chk-box" id="g4-chk-2"></div> Client consent has been fully captured and signed off (Artifact 14).</li>
          <li><div class="chk-box" id="g4-chk-3"></div> Legal Investment Advisory Agreement (SEBI Reg 15) is executed.</li>
          <li><div class="chk-box" id="g4-chk-4"></div> All 14 system artifacts are complete and released for 5-year vault storage.</li>
        </ul>

        <div class="form-actions" id="g4-actions">
          <button class="btn btn-success btn-lg" id="btn-gate4-approve" disabled>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>
            Approve Gate 4 &amp; Close Client Cycle
          </button>
        </div>
      </div>
      <div id="g4-success-msg" style="display:none; margin-top: 14px;">
        <div class="card" style="border-color:var(--accent-green)">
          <h3 style="color:var(--accent-green)">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>
            Advisory Cycle Completed &amp; Compliant
          </h3>
          <p style="color:var(--text-secondary);font-size:.85rem;line-height:1.6;">
            All 14 fiduciary artifacts generated by the **Relationship Manager, Financial Analyst, and Investment Strategist** have been audited, signed off, and committed to the **5-Year SEBI Compliance Repository**.
          </p>
          <div style="margin-top: 10px; font-family: monospace; font-size: .75rem; color: var(--text-tertiary);" id="g4-receipt"></div>
        </div>
      </div>
    `;

    // Bind checkboxes
    for (let c = 1; c <= 4; c++) {
      const el = $(`#g4-chk-${c}`);
      if (el) {
        if (g4passed) {
          el.classList.add('on');
          checks[c-1] = true;
        }
        
        el.addEventListener('click', () => {
          if (g4passed) return;
          checks[c-1] = !checks[c-1];
          el.classList.toggle('on', checks[c-1]);
          $('#btn-gate4-approve').disabled = !checks.every(Boolean);
        });
      }
    }

    if (g4passed) {
      $('#btn-gate4-approve').disabled = true;
      $('#g4-actions').style.display = 'none';
      $('#g4-success-msg').style.display = 'block';
      const commitDate = client.gateTimestamps ? NF.fmtDate(client.gateTimestamps[4]) : '—';
      $('#g4-receipt').innerHTML = `
        REGULATORY TRANSMISSION HASH: SHA256-${client.id}-RIA-COMMIT<br/>
        COMPLIANCE ARCHIVE DATE: ${commitDate}<br/>
        STATUS: VAULT SECURED &amp; COMPLIANT
      `;
    }

    const btn = $('#btn-gate4-approve');
    if (btn) {
      btn.addEventListener('click', () => {
        NF.passGate(client.id, 4);
        NF.toast('Gate 4 Cleared! Client Advisory Cycle completed and archived.', 'success');
        onClientChange();
        switchView('overview');
      });
    }
  }

  function setupDeleteClientButton() {
    const btn = $('#btn-delete-client');
    if (!btn) return;
    btn.addEventListener('click', () => {
      const client = getActiveClient();
      if (!client) return;
      if (confirm(`Are you sure you want to delete client ${client.profile.fname} ${client.profile.lname} (${client.id})? All artifacts and data for this client will be permanently removed.`)) {
        const id = client.id;
        NF.deleteClient(id);
        NF.toast(`Client ${id} deleted successfully.`, 'success');
        NF.setActiveClientId(''); // Reset active client
        isOtpVerified = false;
        searchedMobile = '';
        clientFlags = { hasProfile: false, hasFinancials: false, hasRiskAssessment: false, hasGoalMap: false };
        onClientChange();
      }
    });
  }

  // ── HTML Escaper ──
  function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  // ── Init ──
  function init() {
    setupNav();
    setupClientSearch();
    setupDeleteClientButton();
    setupProfileForm();
    setupRiskForm();
    setupFinancialsForm();
    setupGoalsForm();
    setupGate1();

    onClientChange();
  }

  // Boot
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
