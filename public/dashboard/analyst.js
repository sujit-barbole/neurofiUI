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

    $('#input-art-01').style.display = tabId === '01' ? 'block' : 'none';
    $('#input-art-03').style.display = tabId === '03' ? 'block' : 'none';
    $('#input-art-04').style.display = tabId === '04' ? 'block' : 'none';
  }

  // ── Load client lists ──
  function populateClientSelector() {
    const sel = $('#sel-client');
    if (!sel) return;
    
    const clients = NF.getClients();
    const activeId = NF.getActiveClientId();

    sel.innerHTML = '<option value="">— Select Client —</option>';
    clients.forEach(c => {
      const opt = document.createElement('option');
      opt.value = c.id;
      opt.textContent = `${c.id} — ${c.profile.fname} ${c.profile.lname}`;
      if (c.id === activeId) opt.selected = true;
      sel.appendChild(opt);
    });
  }

  function onClientChange(clientId) {
    if (clientId) {
      NF.setActiveClientId(clientId);
    }
    
    const client = getActiveClient();
    const chip = $('#client-chip');
    const chipLabel = $('#chip-label');

    if (!client) {
      chip.style.display = 'none';
      $('#guard-gate1').style.display = 'none';
      $('#overview-content').style.display = 'none';
      hideAllGuards();
      return;
    }

    chip.style.display = 'flex';
    chipLabel.textContent = `${client.profile.fname} ${client.profile.lname} (${client.id})`;

    const gate1Passed = NF.isGatePassed(client.id, 1);
    
    if (!gate1Passed) {
      $('#guard-gate1').style.display = 'block';
      $('#overview-content').style.display = 'none';
      showAllGuards();
    } else {
      $('#guard-gate1').style.display = 'none';
      $('#overview-content').style.display = 'block';
      hideAllGuards();
      
      // Update Overview stats & quick metrics
      renderOverviewStats(client);
      renderOverviewSummary(client);
      renderOverviewGates(client);
    }

    refreshCurrentView();
  }

  function showAllGuards() {
    ['inputs-guard', 'nw-guard', 'ins-guard', 'goal-guard', 'tax-guard', 'ret-guard', 'runall-guard', 'g2-guard'].forEach(g => {
      const el = $(`#${g}`);
      if (el) el.style.display = 'block';
    });
    ['inputs-content', 'nw-content', 'ins-content', 'goal-content', 'tax-content', 'ret-content', 'runall-content', 'g2-content'].forEach(c => {
      const el = $(`#${c}`);
      if (el) el.style.display = 'none';
    });
  }

  function hideAllGuards() {
    ['inputs-guard', 'nw-guard', 'ins-guard', 'goal-guard', 'tax-guard', 'ret-guard', 'runall-guard', 'g2-guard'].forEach(g => {
      const el = $(`#${g}`);
      if (el) el.style.display = 'none';
    });
    ['inputs-content', 'nw-content', 'ins-content', 'goal-content', 'tax-content', 'ret-content', 'runall-content', 'g2-content'].forEach(c => {
      const el = $(`#${c}`);
      if (el) el.style.display = 'block';
    });
  }

  // ── Refresh Current View ──
  function refreshCurrentView() {
    const client = getActiveClient();
    if (!client || !NF.isGatePassed(client.id, 1)) return;

    if (activeView === 'inputs') {
      renderInputReview(client);
    } else if (activeView === 'networth') {
      renderNetWorthView(client);
    } else if (activeView === 'insurance') {
      renderInsuranceView(client);
    } else if (activeView === 'goals') {
      renderGoalView(client);
    } else if (activeView === 'tax') {
      renderTaxView(client);
    } else if (activeView === 'retirement') {
      renderRetirementView(client);
    } else if (activeView === 'runall') {
      renderRunAllView(client);
    } else if (activeView === 'gate2') {
      renderGate2View(client);
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
  // ═══════════════════════════════════════════
  function renderInputReview(client) {
    const art01 = NF.getArtifact(client.id, '01', 'analyst');
    const art03 = NF.getArtifact(client.id, '03', 'analyst');
    const art04 = NF.getArtifact(client.id, '04', 'analyst');

    $('#art-viewer-01').innerHTML = art01 ? escapeHtml(art01.content) : 'Artifact 01 has not been compiled yet.';
    $('#art-viewer-03').innerHTML = art03 ? escapeHtml(art03.content) : 'Artifact 03 has not been compiled yet.';
    $('#art-viewer-04').innerHTML = art04 ? escapeHtml(art04.content) : 'Artifact 04 has not been compiled yet.';
  }

  // ═══════════════════════════════════════════
  //  VIEW: NET WORTH & CASH FLOW (05)
  // ═══════════════════════════════════════════
  function renderNetWorthView(client) {
    const art05 = NF.getArtifact(client.id, '05', 'analyst');
    const container = $('#nw-results');
    if (!container) return;

    if (!art05) {
      container.innerHTML = `
        <div style="color:var(--text-tertiary);font-size:.85rem;padding:24px;text-align:center" class="card">
          Click the "Run Net Worth Analysis" button to calculate assets, debt margins, and emergency fund status.
        </div>
      `;
      return;
    }

    container.innerHTML = `
      <div class="results-title" style="color:var(--accent-amber)">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/></svg>
        Calculated Artifact 05 — Balance Sheet &amp; Reserves
      </div>
      <div class="artifact-viewer">${escapeHtml(art05.content)}</div>
    `;
  }

  function runNetWorth() {
    const client = getActiveClient();
    if (!client || !client.financials) return;

    const f = client.financials;
    const totalIncome = Object.values(f.income).reduce((a, b) => a + b, 0);
    const totalExpenses = Object.values(f.expenses).reduce((a, b) => a + b, 0);
    const surplus = totalIncome - totalExpenses;
    const savingsRate = totalIncome > 0 ? (surplus / totalIncome * 100) : 0;

    const totalAssets = Object.values(f.assets).reduce((a, b) => a + b, 0);
    const totalLiabilities = Object.values(f.liabilities).reduce((a, b) => a + b, 0);
    const netWorth = totalAssets - totalLiabilities;

    // Essential expenses: Housing (Rent/EMI) + Household utilities + Debt EMIs + Insurance + Healthcare
    const essentialExpenses = f.expenses.housing + f.expenses.household + f.expenses.loanemi + f.expenses.inspremium + f.expenses.healthcare;
    const emergencyTarget = 6 * essentialExpenses;
    const emergencyGap = Math.max(0, emergencyTarget - f.assets.bank);
    const debtToIncome = totalIncome > 0 ? (f.expenses.loanemi / totalIncome * 100) : 0;

    // Store analysis data temporarily in client context for downstream researchers
    NF.updateClient(client.id, c => {
      if (!c.analysis) c.analysis = {};
      c.analysis.netWorth = {
        totalIncome, totalExpenses, surplus, savingsRate,
        totalAssets, totalLiabilities, netWorth,
        essentialExpenses, emergencyTarget, emergencyGap, debtToIncome
      };
    });

    const art05MD = generateArtifact05MD(client, c => c.analysis.netWorth);
    NF.setArtifact(client.id, '05', art05MD, 'analyst');

    NF.toast('Artifact 05 — Net Worth & Cash Flow executed!', 'success');
    onClientChange();
  }

  function generateArtifact05MD(client) {
    const ts = new Date().toISOString();
    const nw = client.analysis.netWorth;
    const f = client.financials;

    return `# Artifact 05 — Net Worth & Cash Flow
**Fiduciary Deterministic Wealth Margins & Liquid Reserve Appraisals**

- **Client ID:** ${client.id}
- **Calculated On:** ${NF.fmtDate(ts)}
- **Fiduciary Adviser:** SEBI Registered Investment Adviser

## Key Wealth Diagnostics
| Metric Diagnostic | Formula Value | Fiduciary Threshold Rating |
| :--- | :---: | :--- |
| **Gross Monthly Inflows** | ${NF.fmt(nw.totalIncome)} | Core cash flow baseline |
| **Total Monthly Outflows** | ${NF.fmt(nw.totalExpenses)} | Total monthly outflow drag |
| **Net Cash Flow Surplus** | **${NF.fmt(nw.surplus)}** | Compounding surplus margin |
| **Net Savings Rate** | **${nw.savingsRate.toFixed(1)}%** | ${nw.savingsRate >= 30 ? 'OPTIMAL (>=30%)' : nw.savingsRate >= 15 ? 'ACCEPTABLE (15-29%)' : 'CRITICAL CORRECTION REQUIRED (<15%)'} |
| **Essential Monthly Costs**| ${NF.fmt(nw.essentialExpenses)} | Minimal monthly cash requirement to prevent default |

## Balance Sheet Liquidation Appraisal
| Appraised Parameter | Ledger Sizing | Net Margin |
| :--- | :---: | :---: |
| **Aggregate Asset Value** | ${NF.fmt(nw.totalAssets)} | Positive asset margin |
| **Aggregate Liabilities** | ${NF.fmt(nw.totalLiabilities)} | Negative debt margin |
| **Fiduciary Net Wealth** | **${NF.fmt(nw.netWorth)}** | **Appraised Net Fiduciary Equity** |

## Liquid Contingency Reserve Audit (Emergency Fund)
- **Fiduciary Reserve Target:** **${NF.fmt(nw.emergencyTarget)}** (Calculated as 6x Essential Monthly Inflows)
- **Currently Available Liquid Cash (Bank/FD):** ${NF.fmt(f.assets.bank)}
- **Contingency Reserve Gap:** **${NF.fmt(nw.emergencyGap)}**
- **Action Plan:** ${nw.emergencyGap > 0 ? `Allocate ₹${(nw.emergencyGap).toLocaleString('en-IN')} systematically from surplus cash into ultra-low duration or liquid schemes.` : 'Optimal reserve secured. Zero immediate action required.'}

## Debt Solvency Analysis
- **Monthly Debt Servicing (EMIs):** ${NF.fmt(f.expenses.loanemi)}
- **Debt-to-Income Solvency Margin:** **${nw.debtToIncome.toFixed(1)}%**
- **Fiduciary Classification:** ${nw.debtToIncome > 50 ? 'INSOLVENT (>50% EMI drag)' : nw.debtToIncome > 30 ? 'ELEVATED RISK (30-50% EMI drag)' : 'SOLVENT (<=30% EMI drag)'}

---
*Fiduciary Certification: Calculations executed deterministically based on verified income records. No estimations or qualitative overrides applied.*`;
  }

  // ═══════════════════════════════════════════
  //  VIEW: INSURANCE & HLV (06)
  // ═══════════════════════════════════════════
  function renderInsuranceView(client) {
    const art06 = NF.getArtifact(client.id, '06', 'analyst');
    const container = $('#ins-results');
    if (!container) return;

    if (!art06) {
      container.innerHTML = `
        <div style="color:var(--text-tertiary);font-size:.85rem;padding:24px;text-align:center" class="card">
          Click the "Run Insurance Analysis" button to compound Human Life Value (HLV) gaps and statutory health requirements.
        </div>
      `;
      return;
    }

    container.innerHTML = `
      <div class="results-title" style="color:var(--accent-amber)">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
        Calculated Artifact 06 — Fiduciary Protection &amp; HLV Gap Analysis
      </div>
      <div class="artifact-viewer">${escapeHtml(art06.content)}</div>
    `;
  }

  function runInsurance() {
    const client = getActiveClient();
    if (!client || !client.financials) return;

    const f = client.financials;
    const dob = new Date(client.profile.dob);
    const now = new Date();
    
    // Age and Years to Retirement
    const age = Math.floor((now - dob) / (365.25 * 24 * 60 * 60 * 1000));
    const yearsToRetirement = Math.max(0, 60 - age);

    // Sum monthly income
    const totalIncome = Object.values(f.income).reduce((a, b) => a + b, 0);

    // HLV compound variables
    const personalConsumption = totalIncome * 0.30;
    const annualFamilyContribution = (totalIncome - personalConsumption) * 12;
    const riskFreeRate = 0.0705; // 7.05%

    // Annuity PV formula for HLV
    let HLV = 0;
    if (yearsToRetirement > 0) {
      HLV = annualFamilyContribution * ((1 - Math.pow(1 + riskFreeRate, -yearsToRetirement)) / riskFreeRate);
    }

    // Gaps
    const totalAssets = Object.values(f.assets).reduce((a, b) => a + b, 0);
    const totalLiabilities = Object.values(f.liabilities).reduce((a, b) => a + b, 0);
    const liquidAssets = f.assets.bank + f.assets.mf + f.assets.equity;
    const existingCover = f.insurance.termlife + f.insurance.bundledsa;
    
    const lifeGap = Math.max(0, HLV + totalLiabilities - existingCover - liquidAssets);
    
    const healthRecommended = client.profile.city.toLowerCase().includes('metro') || client.profile.metro === 'Metro' ? 1000000 : 700000;
    const healthGap = Math.max(0, healthRecommended - f.insurance.healthsi);

    NF.updateClient(client.id, c => {
      if (!c.analysis) c.analysis = {};
      c.analysis.insurance = {
        age, yearsToRetirement, HLV, existingCover, lifeGap, healthRecommended, healthGap
      };
    });

    const art06MD = generateArtifact06MD(client);
    NF.setArtifact(client.id, '06', art06MD, 'analyst');

    NF.toast('Artifact 06 — Insurance Protection audited!', 'success');
    onClientChange();
  }

  function generateArtifact06MD(client) {
    const ts = new Date().toISOString();
    const ins = client.analysis.insurance;
    const f = client.financials;

    return `# Artifact 06 — Insurance Analysis
**Fiduciary Present Value Life & Health Insurance Risk Protection Appraisals**

- **Client ID:** ${client.id}
- **Calculated On:** ${NF.fmtDate(ts)}
- **Fiduciary Adviser:** SEBI Registered Investment Adviser

## Key Demographic & Pension Assumptions
- **Attained Age:** ${ins.age} Years Old
- **Fiduciary Retirement Baseline:** Age 60
- **Compounding Horizons to Pension:** ${ins.yearsToRetirement} Years
- **Sovereign risk-free standard (r):** 7.05% (Indian 10-Year G-Sec yield baseline)

## Human Life Value (HLV) Mathematical Appraisal
| Parameter | Sizing | Fiduciary Rationale |
| :--- | :---: | :--- |
| **Gross Monthly Cash Flow** | ${NF.fmt(Object.values(f.income).reduce((a, b) => a + b, 0))} | Total household financial influx |
| **Personal Consumption Deduct**| ${NF.fmt(Object.values(f.income).reduce((a, b) => a + b, 0) * 0.3)} | 30% individual consumption deduction |
| **Annualized Family Support** | ${NF.fmt((Object.values(f.income).reduce((a, b) => a + b, 0) * 0.7) * 12)} | Retained family economic baseline |
| **Human Life Value (HLV)** | **${NF.fmt(ins.HLV)}** | **Annuity Present Value of family support compounded at risk-free rate** |

## Life Cover Fiduciary Sizing Gap
- **Computed HLV Capital Obligation:** ${NF.fmt(ins.HLV)}
- **Add: Total Outstanding Liability Debt:** ${NF.fmt(Object.values(f.liabilities).reduce((a, b) => a + b, 0))}
- **Less: Total Available Liquid Appraised Wealth:** ${NF.fmt(f.assets.bank + f.assets.mf + f.assets.equity)}
- **Fiduciary Insurance Target Requirement:** **${NF.fmt(ins.HLV + Object.values(f.liabilities).reduce((a, b) => a + b, 0) - (f.assets.bank + f.assets.mf + f.assets.equity))}**
- **Existing Combined Life Coverage (Term + Endowment):** ${NF.fmt(ins.existingCover)}
- **Net Fiduciary Life Protection Gap:** **${NF.fmt(ins.lifeGap)}**
- **Action Plan:** ${ins.lifeGap > 0 ? `Immediately execute a Pure Term Life Insurance policy for ₹${(ins.lifeGap).toLocaleString('en-IN')}. Avoid bundled endowment policies.` : 'Life coverage is optimal under HLV parameters.'}

## Health Protection Sizing Gap
- **Target Recommended Health Insurance:** ${NF.fmt(ins.healthRecommended)} (${client.profile.metro === 'Metro' ? 'Metro standard ₹10 Lakhs' : 'Non-Metro standard ₹7 Lakhs'})
- **Currently Available Health Sum Insured:** ${NF.fmt(f.insurance.healthsi)}
- **Net Fiduciary Health Protection Gap:** **${NF.fmt(ins.healthGap)}**
- **Action Plan:** ${ins.healthGap > 0 ? `Secure family floater top-up or base health cover for ₹${(ins.healthGap).toLocaleString('en-IN')} immediately.` : 'Family health floater coverage is optimal.'}

---
*Fiduciary Notice: In compliance with SEBI RIA Regulations, traditional sub-optimal insurance products (endowment, ULIP, money-back) are surrendered or optimized to direct term life plus equity index plans.*`;
  }

  // ═══════════════════════════════════════════
  //  VIEW: GOAL GAPS & compounding (07)
  // ═══════════════════════════════════════════
  function renderGoalView(client) {
    const art07 = NF.getArtifact(client.id, '07', 'analyst');
    const container = $('#goal-results');
    if (!container) return;

    if (!art07) {
      container.innerHTML = `
        <div style="color:var(--text-tertiary);font-size:.85rem;padding:24px;text-align:center" class="card">
          Click the "Run Goal Gap Analysis" button to execute compounding targets and beginning-of-month SIP requirements.
        </div>
      `;
      return;
    }

    container.innerHTML = `
      <div class="results-title" style="color:var(--accent-amber)">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>
        Calculated Artifact 07 — Goal SIP Compounding &amp; Affordability
      </div>
      <div class="artifact-viewer">${escapeHtml(art07.content)}</div>
    `;
  }

  function runGoalGaps() {
    const client = getActiveClient();
    if (!client) return;

    const f = client.financials;
    const goals = client.goals || [];
    if (goals.length === 0) {
      NF.toast('No client goals exist. Complete mapping in RM portal.', 'error');
      return;
    }

    const totalIncome = Object.values(f.income).reduce((a, b) => a + b, 0);
    const totalExpenses = Object.values(f.expenses).reduce((a, b) => a + b, 0);
    const surplus = totalIncome - totalExpenses;

    let totalRequiredSIP = 0;
    const processedGoals = goals.map(g => {
      const futureValue = g.futureCost || (g.costToday * Math.pow(1 + g.inflRate, g.horizon));
      const earmarkedFV = g.earmarked * Math.pow(1 + (g.earreturn / 100), g.horizon);
      const gap = Math.max(0, futureValue - earmarkedFV);

      // Fiduciary expected return profiles by horizon
      const expectedReturn = g.horizon < 3 ? 0.06 : g.horizon <= 7 ? 0.09 : 0.105;
      const r = expectedReturn / 12;
      const months = g.horizon * 12;
      
      // Beginning of month annuity formula: PMT * (1+r)
      let requiredSIP = 0;
      if (gap > 0 && months > 0) {
        requiredSIP = gap * (r / (Math.pow(1 + r, months) - 1)) / (1 + r);
      }

      totalRequiredSIP += requiredSIP;

      return {
        id: g.id,
        name: g.name,
        priority: g.priority,
        horizon: g.horizon,
        futureValue,
        earmarkedFV,
        gap,
        expectedReturn,
        requiredSIP
      };
    });

    const affordabilityFlag = totalRequiredSIP > surplus;

    NF.updateClient(client.id, c => {
      if (!c.analysis) c.analysis = {};
      c.analysis.goalAnalysis = processedGoals;
      c.analysis.totalRequiredSIP = totalRequiredSIP;
      c.analysis.affordabilityFlag = affordabilityFlag;
    });

    const art07MD = generateArtifact07MD(client);
    NF.setArtifact(client.id, '07', art07MD, 'analyst');

    NF.toast('Artifact 07 — Goals Compounding completed!', 'success');
    onClientChange();
  }

  function generateArtifact07MD(client) {
    const ts = new Date().toISOString();
    const ga = client.analysis.goalAnalysis;
    const totalSIP = client.analysis.totalRequiredSIP;
    const aff = client.analysis.affordabilityFlag;
    const surplus = client.analysis.netWorth.surplus;

    let md = `# Artifact 07 — Goal Gap Analysis
**Fiduciary Compounding Target & Monthly SIP Affordability Statements**

- **Client ID:** ${client.id}
- **Calculated On:** ${NF.fmtDate(ts)}
- **Fiduciary Adviser:** SEBI Registered Investment Adviser

## Mapped Goal Compounding Ledger
| Goal Name | Compounded FV | Projected Earmarked FV | Net Capital Gap | Yield Profile | Required Monthly SIP |
| :--- | :---: | :---: | :---: | :---: | :---: |\n`;

    ga.forEach(g => {
      md += `| ${g.name} | ${NF.fmt(g.futureValue)} | ${NF.fmt(g.earmarkedFV)} | ${NF.fmt(g.gap)} | ${(g.expectedReturn * 100).toFixed(1)}% | **${NF.fmt(g.requiredSIP)}** |\n`;
    });

    md += `\n## Monthly Savings Affordability Audit
- **Aggregated Required Monthly SIP Target:** **${NF.fmt(totalSIP)}**
- **Recorded Monthly Surplus:** ${NF.fmt(surplus)}
- **Fiduciary Budget Status:** ${aff ? '⚠️ DEFICIT (Required SIP exceeds surplus)' : '✓ SOLVENT (Surplus is sufficient)'}
- **Compounding Rationale:** SIP calculations assume beginning-of-month annuity contributions. Yield profiles are horizon-graded:
  - **Short Term (<3 years):** 6.0% CAGR (Short duration debt base)
  - **Medium Term (3-7 years):** 9.0% CAGR (Balanced hybrid dynamic)
  - **Long Term (>7 years):** 10.5% CAGR (Equity index core strategy)

---
*Fiduciary Recommendation: ${aff ? `The client has a monthly cash flow deficit of ${NF.fmt(totalSIP - surplus)}. We advise extending horizons of discretionary goals, optimizing lifestyle costs, or surrendering sub-optimal policies to free up cash.` : 'Solvency validated. Proceed systematically to construct strategic allocations.'}*`;
    return md;
  }

  // ═══════════════════════════════════════════
  //  VIEW: TAX OPTIMIZATION (08)
  // ═══════════════════════════════════════════
  function renderTaxView(client) {
    const art08 = NF.getArtifact(client.id, '08', 'analyst');
    const container = $('#tax-results');
    if (!container) return;

    if (!art08) {
      container.innerHTML = `
        <div style="color:var(--text-tertiary);font-size:.85rem;padding:24px;text-align:center" class="card">
          Click the "Run Tax Analysis" button to perform a dual tax regime slab comparison for FY 2025-26.
        </div>
      `;
      return;
    }

    container.innerHTML = `
      <div class="results-title" style="color:var(--accent-amber)">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/></svg>
        Calculated Artifact 08 — Regime Slab Comparison &amp; Optimization
      </div>
      <div class="artifact-viewer">${escapeHtml(art08.content)}</div>
    `;
  }

  function runTax() {
    const client = getActiveClient();
    if (!client || !client.financials) return;

    const f = client.financials;
    const totalIncome = Object.values(f.income).reduce((a, b) => a + b, 0);
    const grossAnnual = totalIncome * 12;

    // OLD REGIME CALCULATIONS
    const stdDeduction = 50000;
    // Section 80C baseline: assume EPF contributions + standard insurance premium
    const sec80C = Math.min(150000, (f.income.basic * 0.12 * 12) + f.insurance.termpremium + 20000);
    // Section 80D: health premium up to 25k
    const sec80D = Math.min(25000, f.insurance.healthsi > 0 ? 25000 : 0);
    // Section 80CCD(1B): NPS voluntary deduction up to 50k
    const sec80CCD1B = Math.min(50000, f.assets.nps > 0 ? 50000 : 0);

    const taxableOld = Math.max(0, grossAnnual - stdDeduction - sec80C - sec80D - sec80CCD1B);

    // Old Slabs: 0-2.5L 0%, 2.5-5L 5%, 5-10L 20%, 10L+ 30%
    let taxOldBase = 0;
    let remOld = taxableOld;
    if (remOld > 1000000) { taxOldBase += (remOld - 1000000) * 0.30; remOld = 1000000; }
    if (remOld > 500000) { taxOldBase += (remOld - 500000) * 0.20; remOld = 500000; }
    if (remOld > 250000) { taxOldBase += (remOld - 250000) * 0.05; }
    const taxOld = taxOldBase * 1.04; // 4% Cess

    // NEW REGIME CALCULATIONS (FY 2025-26)
    const stdNew = 75000;
    const taxableNew = Math.max(0, grossAnnual - stdNew);

    // New Slabs: 0-4L 0%, 4-8L 5%, 8-12L 10%, 12-16L 15%, 16-24L 20%, 24L+ 30%
    let taxNewBase = 0;
    let remNew = taxableNew;
    if (remNew > 2400000) { taxNewBase += (remNew - 2400000) * 0.30; remNew = 2400000; }
    if (remNew > 1600000) { taxNewBase += (remNew - 1600000) * 0.20; remNew = 1600000; }
    if (remNew > 1200000) { taxNewBase += (remNew - 1200000) * 0.15; remNew = 1200000; }
    if (remNew > 800000) { taxNewBase += (remNew - 800000) * 0.10; remNew = 800000; }
    if (remNew > 400000) { taxNewBase += (remNew - 400000) * 0.05; }

    // Section 87A rebate: zero tax if taxable income <= ₹12 Lakhs
    let taxNew = 0;
    if (taxableNew <= 1200000) {
      taxNew = 0;
    } else {
      taxNew = taxNewBase * 1.04; // 4% Cess
    }

    const recommendation = taxNew <= taxOld ? 'New Regime' : 'Old Regime';
    const taxSavings = Math.abs(taxOld - taxNew);

    NF.updateClient(client.id, c => {
      if (!c.analysis) c.analysis = {};
      c.analysis.tax = {
        grossAnnual,
        old: { deductions: stdDeduction + sec80C + sec80D + sec80CCD1B, taxable: taxableOld, tax: taxOld },
        new: { deductions: stdNew, taxable: taxableNew, tax: taxNew },
        recommendation, taxSavings
      };
    });

    const art08MD = generateArtifact08MD(client);
    NF.setArtifact(client.id, '08', art08MD, 'analyst');

    NF.toast('Artifact 08 — Tax comparison complete!', 'success');
    onClientChange();
  }

  function generateArtifact08MD(client) {
    const ts = new Date().toISOString();
    const t = client.analysis.tax;

    return `# Artifact 08 — Tax Optimization
**Fiduciary Dual Tax Regime Slab Compilations (FY 2025-26 Indian Tax Code)**

- **Client ID:** ${client.id}
- **Calculated On:** ${NF.fmtDate(ts)}
- **Fiduciary Adviser:** SEBI Registered Investment Adviser

## Regime Summary Audit
| Parameter | Old Tax Regime | New Tax Regime | Optimum Recommendation |
| :--- | :---: | :---: | :--- |
| **Gross Annual Income** | ${NF.fmt(t.grossAnnual)} | ${NF.fmt(t.grossAnnual)} | Baseline cash flow |
| **Total Deductions Allowed**| ${NF.fmt(t.old.deductions)} | ${NF.fmt(t.new.deductions)} | Statutory exemptions |
| **Net Taxable Income** | ${NF.fmt(t.old.taxable)} | ${NF.fmt(t.new.taxable)} | Final slab base |
| **Calculated Tax Liability** | **${NF.fmt(t.old.tax)}** | **${NF.fmt(t.new.tax)}** | Cess-adjusted final liability |
| **Net Annualized Savings** | — | **${NF.fmt(t.taxSavings)}** | **REGIME SWITCH SAVINGS MARGIN** |

## Optimum Tax Optimization Strategy
- **Fiduciary Recommendation:** **Proceed with the ${t.recommendation}**
- **Calculated Regime Switch Savings:** **${NF.fmt(t.taxSavings)}**
- **Section 87A rebate application:** ${t.new.taxable <= 1200000 ? 'Rebate successfully applied. Net liability under New Regime is ₹0.' : 'Not eligible for rebate. Income exceeds ₹12 Lakh limit.'}

## Slab Audit Detail (Recommended Regime)
- **Regime Category:** ${t.recommendation}
- **Standard deduction:** ${t.recommendation === 'New Regime' ? '₹75,000 applied' : '₹50,000 applied'}
- **Gross liability base:** ${t.recommendation === 'New Regime' ? NF.fmt(t.new.tax / 1.04) : NF.fmt(t.old.tax / 1.04)}
- **Statutory Cess (4%):** ${t.recommendation === 'New Regime' ? NF.fmt(t.new.tax - (t.new.tax/1.04)) : NF.fmt(t.old.tax - (t.old.tax/1.04))}
- **Net payable liability:** **${t.recommendation === 'New Regime' ? NF.fmt(t.new.tax) : NF.fmt(t.old.tax)}**

---
*Fiduciary Declaration: Slab calculations strictly correspond to standard statutory rules for individual citizens under age 60. Consult a licensed charter accountant for corporate deductions.*`;
  }

  // ═══════════════════════════════════════════
  //  VIEW: RETIREMENT ANALYSIS (09)
  // ═══════════════════════════════════════════
  function renderRetirementView(client) {
    const art09 = NF.getArtifact(client.id, '09', 'analyst');
    const container = $('#ret-results');
    if (!container) return;

    if (!art09) {
      container.innerHTML = `
        <div style="color:var(--text-tertiary);font-size:.85rem;padding:24px;text-align:center" class="card">
          Click the "Run Retirement Analysis" button to calculate inflation-adjusted retirement corpus requirements and SIP targets.
        </div>
      `;
      return;
    }

    container.innerHTML = `
      <div class="results-title" style="color:var(--accent-amber)">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
        Calculated Artifact 09 — Retirement Corpus &amp; SWP Analysis
      </div>
      <div class="artifact-viewer">${escapeHtml(art09.content)}</div>
    `;
  }

  function runRetirement() {
    const client = getActiveClient();
    if (!client || !client.financials) return;

    const f = client.financials;
    const dob = new Date(client.profile.dob);
    const now = new Date();
    
    const age = Math.floor((now - dob) / (365.25 * 24 * 60 * 60 * 1000));
    const yearsToRetirement = Math.max(0, 60 - age);

    const totalExpenses = Object.values(f.expenses).reduce((a, b) => a + b, 0);
    const currentAnnualExpenses = totalExpenses * 12;
    
    // Inflate expenses to age 60 (assuming 6% baseline inflation)
    const retExpenses = currentAnnualExpenses * Math.pow(1 + 0.06, yearsToRetirement);

    const lifeExpectancy = 85;
    const retirementYears = lifeExpectancy - 60; // 25 years in retirement
    const postRetReturn = 0.075; // 7.5%
    
    // Real Rate of return (inflation-adjusted return in retirement)
    const realRate = ((1 + postRetReturn) / (1 + 0.06)) - 1;

    // Corpus required via annuity-due compounding formula
    let corpusRequired = 0;
    if (realRate > 0) {
      corpusRequired = retExpenses * ((1 - Math.pow(1 + realRate, -retirementYears)) / realRate) * (1 + realRate);
    }

    // Compounding existing retirement assets
    const existingRetirement = f.assets.epf + f.assets.nps;
    const projectedExisting = existingRetirement * Math.pow(1 + 0.09, yearsToRetirement); // EPF/NPS grows at 9% CAGR average

    const retirementGap = Math.max(0, corpusRequired - projectedExisting);

    // Required SIP to achieve target gap: assuming 10% CAGR average on SIP portfolio
    const sipReturn = 0.10;
    const r = sipReturn / 12;
    const months = yearsToRetirement * 12;
    
    let retSIP = 0;
    if (retirementGap > 0 && months > 0) {
      retSIP = retirementGap * (r / (Math.pow(1 + r, months) - 1)) / (1 + r);
    }

    NF.updateClient(client.id, c => {
      if (!c.analysis) c.analysis = {};
      c.analysis.retirement = {
        age, yearsToRetirement, currentAnnualExpenses, retExpenses,
        retirementYears, corpusRequired, existingRetirement, projectedExisting,
        retirementGap, retSIP
      };
    });

    const art09MD = generateArtifact09MD(client);
    NF.setArtifact(client.id, '09', art09MD, 'analyst');

    NF.toast('Artifact 09 — Retirement compiled!', 'success');
    onClientChange();
  }

  function generateArtifact09MD(client) {
    const ts = new Date().toISOString();
    const r = client.analysis.retirement;
    const f = client.financials;

    return `# Artifact 09 — Retirement Analysis
**Fiduciary Inflation-Adjusted Retirement Corpus & SWP Accumulation Statements**

- **Client ID:** ${client.id}
- **Calculated On:** ${NF.fmtDate(ts)}
- **Fiduciary Adviser:** SEBI Registered Investment Adviser

## Key Retirement Assumptions
| Parameter | Value | Fiduciary Rationale |
| :--- | :---: | :--- |
| **Attained Age** | ${r.age} Yrs | Demographics timeline anchor |
| **Retirement Age** | 60 Yrs | Systemic target baseline |
| **Years to Accumulate** | ${r.yearsToRetirement} Yrs | Accumulation phase horizon |
| **Post-retirement life expectancy**| 85 Yrs | 25-year withdrawal duration |

## Inflation-Adjusted Expenses & SWP Target
- **Current Annual Outflow Drag:** ${NF.fmt(r.currentAnnualExpenses)}
- **Expected Inflation Rate (Accumulation):** 6.0% per annum
- **Age-60 Inflated Annual Cost (A):** **${NF.fmt(r.retExpenses)}** (First-year retirement cost requirement)
- **Post-Retirement Return expectation:** 7.5% per annum
- **Inflation-Adjusted Real Yield (r_real):** **1.415%** (Compound real yield margin)

## Corpus Accumulation Gap Analysis
- **Calculated Capital Corpus Required:** **${NF.fmt(r.corpusRequired)}** (Compounded annuity due capital requirement)
- **Currently Accumulated Retirement Assets (EPF + NPS):** ${NF.fmt(r.existingRetirement)}
- **Projected Existing Assets at Age 60 (9% CAGR):** ${NF.fmt(r.projectedExisting)}
- **Net Fiduciary Retirement Corpus Gap:** **${NF.fmt(r.retirementGap)}**

## Accumulation Action Plan (Systematic Investment)
- **Systematic Wealth Accumulation SIP:** **${NF.fmt(r.retSIP)}** per month
- **Assumed SIP CAGR return:** 10.0% (Calculated via 70/30 dynamic equity/debt strategic blend)
- **Action Plan:** ${r.retirementGap > 0 ? `Initiate a systematic monthly transaction of **${NF.fmt(r.retSIP)}** specifically directed to the retirement sleeve.` : 'Existing retirement assets are fully sufficient. No additional systematic funding required.'}

---
*Fiduciary Declaration: Retirement computations strictly account for compounding interest drag. Any early withdrawals from EPF or NPS will invalidate this projection, requiring immediate re-auditing.*`;
  }

  // ═══════════════════════════════════════════
  //  VIEW: RUN ALL ANALYSES
  // ═══════════════════════════════════════════
  function renderRunAllView(client) {
    const nwArt = NF.getArtifact(client.id, '05', 'analyst');
    const insArt = NF.getArtifact(client.id, '06', 'analyst');
    const goalArt = NF.getArtifact(client.id, '07', 'analyst');
    const taxArt = NF.getArtifact(client.id, '08', 'analyst');
    const retArt = NF.getArtifact(client.id, '09', 'analyst');

    updateRunAllUI(5, nwArt);
    updateRunAllUI(6, insArt);
    updateRunAllUI(7, goalArt);
    updateRunAllUI(8, taxArt);
    updateRunAllUI(9, retArt);

    const container = $('#runall-summary');
    if (nwArt && insArt && goalArt && taxArt && retArt) {
      container.innerHTML = `
        <div class="card" style="border-color:var(--accent-green)">
          <h3 style="color:var(--accent-green)">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>
            All 5 Calculations Executed Successfully
          </h3>
          <p style="color:var(--text-secondary);font-size:.85rem;line-height:1.5;">
            Deterministic calculations are successfully stored as statutory MD files.
            Proceed to **Gate 2** to review checklist items and release advice variables to the Researcher.
          </p>
        </div>
      `;
    } else {
      container.innerHTML = '';
    }
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

  function runAll() {
    const client = getActiveClient();
    if (!client) return;

    NF.toast('Starting batch modeling calculations...', 'info');

    // Run all 5 sequentially
    setTimeout(() => {
      runNetWorth();
      renderRunAllView(getActiveClient());
    }, 200);

    setTimeout(() => {
      runInsurance();
      renderRunAllView(getActiveClient());
    }, 400);

    setTimeout(() => {
      runGoalGaps();
      renderRunAllView(getActiveClient());
    }, 600);

    setTimeout(() => {
      runTax();
      renderRunAllView(getActiveClient());
    }, 800);

    setTimeout(() => {
      runRetirement();
      renderRunAllView(getActiveClient());
      NF.toast('All 5 deterministic algorithms calculated!', 'success');
      showView('runall');
    }, 1000);
  }

  // ═══════════════════════════════════════════
  //  VIEW: GATE 2 (Release checks)
  // ═══════════════════════════════════════════
  function renderGate2View(client) {
    const g2passed = NF.isGatePassed(client.id, 2);
    const passCard = $('#gate2-card');
    const passMsg = $('#g2-passed-msg');
    
    // Check prerequisites: all 5 analyst artifacts generated
    const nw = !!NF.getArtifact(client.id, '05', 'analyst');
    const ins = !!NF.getArtifact(client.id, '06', 'analyst');
    const goal = !!NF.getArtifact(client.id, '07', 'analyst');
    const tax = !!NF.getArtifact(client.id, '08', 'analyst');
    const ret = !!NF.getArtifact(client.id, '09', 'analyst');
    const allGenerated = nw && ins && goal && tax && ret;

    // Checkboxes setup
    for (let c = 0; c < 4; c++) {
      const box = $(`#g2-chk-${c}`);
      if (box) {
        if (g2passed) {
          box.classList.add('on');
          gate2Checks[c] = true;
        } else {
          box.classList.toggle('on', gate2Checks[c]);
        }
      }
    }

    if (g2passed) {
      if (passCard) passCard.style.display = 'none';
      if (passMsg) {
        passMsg.style.display = 'block';
        $('#g2-timestamp').textContent = `RELEASE RECORDED ON: ${NF.fmtDate(client.gateTimestamps?.[2])}`;
      }
    } else {
      if (passCard) passCard.style.display = 'block';
      if (passMsg) passMsg.style.display = 'none';
      
      const allChecked = gate2Checks.every(Boolean);
      const approveBtn = $('#btn-pass-g2');
      
      if (approveBtn) {
        // Only allow approval if all boxes checked AND all 5 artifacts compiled
        approveBtn.disabled = !allChecked || !allGenerated;
        
        if (!allGenerated) {
          approveBtn.innerHTML = `
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            Calculations Missing
          `;
        } else {
          approveBtn.innerHTML = `
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>
            Approve Gate 2 &amp; Release advice
          `;
        }
      }
    }
  }

  function toggleCheck(idx) {
    const client = getActiveClient();
    if (!client || NF.isGatePassed(client.id, 2)) return;

    gate2Checks[idx] = !gate2Checks[idx];
    const box = $(`#g2-chk-${idx}`);
    if (box) box.classList.toggle('on', gate2Checks[idx]);

    // Check all checkboxes
    const allChecked = gate2Checks.every(Boolean);
    const approveBtn = $('#btn-pass-g2');

    const nw = !!NF.getArtifact(client.id, '05', 'analyst');
    const ins = !!NF.getArtifact(client.id, '06', 'analyst');
    const goal = !!NF.getArtifact(client.id, '07', 'analyst');
    const tax = !!NF.getArtifact(client.id, '08', 'analyst');
    const ret = !!NF.getArtifact(client.id, '09', 'analyst');
    
    if (approveBtn) approveBtn.disabled = !allChecked || !(nw && ins && goal && tax && ret);
  }

  function passGate2() {
    const client = getActiveClient();
    if (!client) return;

    const passed = NF.passGate(client.id, 2);
    if (passed) {
      NF.toast('Gate 2 approved! Portfolio parameters released to Researcher.', 'success');
      onClientChange();
      showView('overview');
    }
  }

  // ── HTML Escaper ──
  function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  // ── Init ──
  function init() {
    populateClientSelector();
    
    // Bind dropdown selectors
    $('#sel-client').addEventListener('change', (e) => {
      onClientChange(e.target.value);
    });

    // Bind sidebar nav buttons
    $$('.nav-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const view = btn.dataset.view;
        if (btn.classList.contains('locked')) {
          NF.toast('This section is locked. Complete Gate 1 first.', 'error');
          return;
        }
        showView(view);
      });
    });

    onClientChange();
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
    onClientChange,
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
