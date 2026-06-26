/* ═══════════════════════════════════════════
   NeuroFi — Researcher Portal (Agent 3)
   Strategic Allocation · Product Selection · Plan Compilation
   ═══════════════════════════════════════════ */

(function () {
  'use strict';

  // ── Product Universe ──
  const PRODUCTS = [
    { cat: 'Equity — Large Cap Index',   fund: 'UTI Nifty 50 Index Direct Growth',        er: '0.18%', rationale: 'Low-cost passive core holding tracking the Nifty 50 index. Eliminates fund manager risk while providing broad large-cap exposure at the lowest possible expense ratio.' },
    { cat: 'Equity — Flexi Cap',          fund: 'Parag Parikh Flexi Cap Direct Growth',     er: '0.63%', rationale: 'Diversified multi-cap fund with ~25% international equity allocation. Provides geographic diversification and access to global technology leaders unavailable in domestic markets.' },
    { cat: 'Equity — Mid Cap',            fund: 'Motilal Oswal Midcap Direct Growth',       er: '0.58%', rationale: 'Concentrated high-conviction mid-cap portfolio targeting companies in the ₹5,000–₹20,000 Cr market cap range. Suitable for long-term wealth creation with higher growth potential.' },
    { cat: 'Debt — Corporate Bond',       fund: 'HDFC Corporate Bond Direct Growth',        er: '0.35%', rationale: 'Invests predominantly in AAA/AA+ rated corporate bonds. Provides steady accrual income with low credit risk, suitable for medium-term debt allocation.' },
    { cat: 'Debt — Liquid',               fund: 'Quantum Liquid Direct Growth',              er: '0.19%', rationale: 'Ultra-short maturity government securities-focused liquid fund. Ideal for emergency fund parking with instant redemption facility up to ₹50,000.' },
    { cat: 'Debt — Short Duration',       fund: 'Kotak Low Duration Direct Growth',          er: '0.42%', rationale: 'Modified duration of 6-12 months targeting short-term goals under 3 years. Provides better returns than liquid funds while maintaining low interest rate sensitivity.' },
    { cat: 'Gold — SGB',                  fund: 'Sovereign Gold Bond (RBI)',                  er: '0%',    rationale: 'Government-backed gold exposure with 2.5% annual interest and zero capital gains tax at maturity (8 years). Most tax-efficient gold investment vehicle available.' },
    { cat: 'NPS — Retirement',            fund: 'NPS Tier I (Auto choice / LC75)',            er: '0.01%', rationale: 'Additional ₹50,000 deduction under Section 80CCD(1B) beyond 80C limit. Auto choice glide-path reduces equity gradually as retirement approaches. Lowest cost retirement vehicle.' }
  ];

  // ── State ──
  let activeView = 'overview';
  let gate3Checks = [false, false, false, false];

  // ── DOM Helpers ──
  const $ = (sel) => document.querySelector(sel);
  const $$ = (sel) => document.querySelectorAll(sel);

  // ── Navigation ──
  function setupNav() {
    $$('.nav-btn[data-view]').forEach(btn => {
      btn.addEventListener('click', () => {
        const view = btn.dataset.view;
        switchView(view);
      });
    });
  }

  function switchView(viewId) {
    activeView = viewId;
    $$('.nav-btn[data-view]').forEach(b => b.classList.toggle('active', b.dataset.view === viewId));
    $$('.view').forEach(v => v.classList.toggle('active', v.id === `view-${viewId}`));

    const labels = {
      'overview': 'Overview', 'input-review': 'Input Review', 'allocation': 'Allocation',
      'products': 'Products', 'fullplan': 'Full Plan', 'gate3': 'Gate 3'
    };
    $('#crumb').textContent = labels[viewId] || viewId;
    renderCurrentView();
  }

  // ── Client Selector ──
  function populateClientSelector() {
    const sel = $('#sel-client');
    const clients = NF.getClients();
    const activeId = NF.getActiveClientId();

    sel.innerHTML = '<option value="">— Select client —</option>';
    clients.forEach(c => {
      const opt = document.createElement('option');
      opt.value = c.id;
      opt.textContent = `${c.id} — ${c.profile.fname} ${c.profile.lname}`;
      if (c.id === activeId) opt.selected = true;
      sel.appendChild(opt);
    });

    sel.addEventListener('change', () => {
      NF.setActiveClientId(sel.value);
      refreshAll();
    });
  }

  // ── Access Check ──
  function getActiveClient() {
    const id = NF.getActiveClientId();
    return id ? NF.getClient(id) : null;
  }

  function checkAccess() {
    const client = getActiveClient();
    const noClient = $('#no-client-screen');
    const guard = $('#guard-screen');
    const views = $$('.view');
    const chip = $('#client-chip');

    if (!client) {
      noClient.style.display = 'block';
      guard.style.display = 'none';
      views.forEach(v => v.style.display = 'none');
      chip.style.display = 'none';
      return false;
    }

    chip.style.display = 'flex';
    $('#chip-label').textContent = `${client.profile.fname} ${client.profile.lname} (${client.id})`;

    if (!NF.isGatePassed(client.id, 2)) {
      noClient.style.display = 'none';
      guard.style.display = 'block';
      views.forEach(v => v.style.display = 'none');
      return false;
    }

    noClient.style.display = 'none';
    guard.style.display = 'none';
    return true;
  }

  // ── Refresh ──
  function refreshAll() {
    if (!checkAccess()) return;
    // Re-show the active view
    $$('.view').forEach(v => v.classList.toggle('active', v.id === `view-${activeView}`));
    renderCurrentView();
  }

  function renderCurrentView() {
    const client = getActiveClient();
    if (!client) return;

    switch (activeView) {
      case 'overview':     renderOverview(client); break;
      case 'input-review': renderInputReview(client); break;
      case 'allocation':   renderAllocation(client); break;
      case 'products':     renderProducts(client); break;
      case 'fullplan':     renderFullPlan(client); break;
      case 'gate3':        renderGate3(client); break;
    }
  }

  // ═══════════════════════════════════════════
  //  VIEW: OVERVIEW
  // ═══════════════════════════════════════════
  function renderOverview(client) {
    // Stats
    const riskCat = client.riskCategory || '—';
    const riskScore = client.riskScore || 0;
    const goalCount = (client.goals || []).length;
    const artCount = NF.getReadableArtifacts(client.id, 'researcher').length;

    $('#overview-stats').innerHTML = `
      <div class="stat glass">
        <div class="stat-icon" style="background:rgba(168,85,247,.15)">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--accent-purple)" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
        </div>
        <div><div class="stat-val">${riskScore}/100</div><div class="stat-lbl">Risk Score</div></div>
      </div>
      <div class="stat glass">
        <div class="stat-icon" style="background:rgba(245,158,11,.15)">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--accent-amber)" stroke-width="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
        </div>
        <div><div class="stat-val">${riskCat}</div><div class="stat-lbl">Risk Category</div></div>
      </div>
      <div class="stat glass">
        <div class="stat-icon" style="background:rgba(16,185,129,.15)">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--accent-green)" stroke-width="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
        </div>
        <div><div class="stat-val">${goalCount}</div><div class="stat-lbl">Client Goals</div></div>
      </div>
      <div class="stat glass">
        <div class="stat-icon" style="background:rgba(99,102,241,.15)">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--accent-blue)" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
        </div>
        <div><div class="stat-val">${artCount}</div><div class="stat-lbl">Artifacts Available</div></div>
      </div>
    `;

    // Gate Status
    const gates = NF.getGateStatus(client.id);
    const gateTimestamps = client.gateTimestamps || {};
    let gatesHTML = '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:14px;margin-bottom:22px">';
    for (let i = 1; i <= 4; i++) {
      const passed = gates[i];
      const cls = passed ? 'passed' : (i <= 3 ? (i === 3 ? 'active' : 'passed') : 'locked');
      const numCls = passed ? 'ok' : (i === 3 && gates[2] ? 'pending' : 'off');
      const label = ['', 'RM Intake', 'Analyst Review', 'Strategic Review', 'Final Delivery'][i];
      const ts = gateTimestamps[i] ? NF.fmtDate(gateTimestamps[i]) : 'Pending';
      gatesHTML += `
        <div class="gate-card ${cls}">
          <div class="gate-hdr">
            <div class="gate-num ${numCls}">${i}</div>
            <div>
              <div class="gate-title">Gate ${i}</div>
              <div class="gate-sub">${label} — ${passed ? 'Passed' : ts === 'Pending' ? 'Pending' : ts}</div>
            </div>
          </div>
        </div>`;
    }
    gatesHTML += '</div>';
    $('#overview-gates').innerHTML = gatesHTML;

    // Input Availability
    const inputArts = [
      { id: '02', name: 'Risk Profile', agent: 'RM' },
      { id: '07', name: 'Goal Gap Analysis', agent: 'Analyst' },
      { id: '08', name: 'Tax Optimization', agent: 'Analyst' },
      { id: '09', name: 'Retirement Analysis', agent: 'Analyst' }
    ];
    let inputHTML = '<div class="card"><h3><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--accent-purple)" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg> Available Inputs</h3>';
    inputHTML += '<table class="tbl"><thead><tr><th>Artifact</th><th>Name</th><th>Source</th><th>Status</th><th>Generated</th></tr></thead><tbody>';
    inputArts.forEach(a => {
      const art = NF.getArtifact(client.id, a.id, 'researcher');
      const status = art ? '<span class="tag tag-green">Available</span>' : '<span class="tag tag-amber">Pending</span>';
      const ts = art ? NF.fmtDate(art.generatedAt) : '—';
      inputHTML += `<tr><td style="font-weight:700;color:var(--accent-purple)">${a.id}</td><td>${a.name}</td><td>${a.agent}</td><td>${status}</td><td style="font-size:.75rem">${ts}</td></tr>`;
    });
    inputHTML += '</tbody></table>';

    // Output status
    const outputArts = [
      { id: '10', name: 'Asset Allocation' },
      { id: '11', name: 'Product Recommendations' },
      { id: '12', name: 'Comprehensive Plan' }
    ];
    inputHTML += '<div class="form-sec" style="margin-top:22px">Researcher Outputs</div>';
    inputHTML += '<table class="tbl"><thead><tr><th>Artifact</th><th>Name</th><th>Status</th><th>Generated</th><th>Version</th></tr></thead><tbody>';
    outputArts.forEach(a => {
      const art = NF.getArtifact(client.id, a.id, 'researcher');
      const status = art ? '<span class="tag tag-green">Generated</span>' : '<span class="tag tag-purple">Not Yet</span>';
      const ts = art ? NF.fmtDate(art.generatedAt) : '—';
      const ver = art ? `v${art.version}` : '—';
      inputHTML += `<tr><td style="font-weight:700;color:var(--accent-purple)">${a.id}</td><td>${a.name}</td><td>${status}</td><td style="font-size:.75rem">${ts}</td><td>${ver}</td></tr>`;
    });
    inputHTML += '</tbody></table></div>';
    $('#overview-inputs').innerHTML = inputHTML;
  }

  // ═══════════════════════════════════════════
  //  VIEW: INPUT REVIEW
  // ═══════════════════════════════════════════
  function renderInputReview(client) {
    const panels = [
      { id: '02', name: 'Risk Profile', icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--accent-purple)" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>' },
      { id: '07', name: 'Goal Gap Analysis', icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--accent-amber)" stroke-width="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>' },
      { id: '08', name: 'Tax Optimization', icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--accent-green)" stroke-width="2"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>' },
      { id: '09', name: 'Retirement Analysis', icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--accent-blue)" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>' }
    ];

    let html = '';
    panels.forEach((p, idx) => {
      const art = NF.getArtifact(client.id, p.id, 'researcher');
      const openClass = idx === 0 ? 'open' : ''; // first panel open by default
      html += `<div class="artifact-panel ${openClass}" id="panel-art-${p.id}">`;
      html += `<div class="artifact-panel-hdr" onclick="togglePanel('${p.id}')">
        <h3>${p.icon} Artifact ${p.id} — ${p.name}
          ${art ? '<span class="tag tag-green" style="margin-left:8px">Available</span>' : '<span class="tag tag-amber" style="margin-left:8px">Pending</span>'}
        </h3>
        <svg class="chevron" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"/></svg>
      </div>`;
      if (art) {
        html += `<div class="artifact-viewer">${escapeHtml(art.content)}</div>`;
      } else {
        html += `<div class="empty-msg">Artifact ${p.id} (${p.name}) has not been generated yet. This artifact will become available once the ${p.id === '02' ? 'RM' : 'Analyst'} completes their work.</div>`;
      }
      html += `</div>`;
    });

    $('#input-review-panels').innerHTML = html;
  }

  // Global toggle for panels
  window.togglePanel = function (artId) {
    const panel = $(`#panel-art-${artId}`);
    if (panel) panel.classList.toggle('open');
  };

  // ═══════════════════════════════════════════
  //  VIEW: ALLOCATION (10)
  // ═══════════════════════════════════════════
  function renderAllocation(client) {
    const score = client.riskScore || 0;
    const catData = NF.scoreToCategory(score);

    // Risk summary
    $('#alloc-risk-summary').innerHTML = `
      <div class="score-header glass">
        <div class="score-ring">
          <svg viewBox="0 0 120 120">
            <circle class="score-track" cx="60" cy="60" r="52"/>
            <circle class="score-fill" cx="60" cy="60" r="52"
              style="stroke:${catData.color};stroke-dashoffset:${326.7 - (326.7 * score / 100)}"/>
          </svg>
          <div class="score-inner">
            <span class="score-num" style="color:${catData.color}">${score}</span>
            <span class="score-den">/ 100</span>
          </div>
        </div>
        <div class="score-info">
          <div class="cat-label" style="color:${catData.color}">${catData.cat}</div>
          <div class="alloc-preview">
            Equity ${catData.eq}% · Debt ${catData.debt}% · Gold ${catData.gold}%<br/>
            Based on ${NF.RISK_QUESTIONS.length}-question risk assessment
          </div>
        </div>
      </div>
    `;

    // Donut
    const eqPct = catData.eq;
    const debtPct = catData.debt;
    const goldPct = catData.gold;
    const eqDeg = (eqPct / 100) * 360;
    const debtDeg = (debtPct / 100) * 360;
    const goldDeg = (goldPct / 100) * 360;

    $('#alloc-donut-area').innerHTML = `
      <div class="alloc-wrap">
        <div class="donut" style="background:conic-gradient(#6366f1 0deg ${eqDeg}deg, #10b981 ${eqDeg}deg ${eqDeg + debtDeg}deg, #f59e0b ${eqDeg + debtDeg}deg ${eqDeg + debtDeg + goldDeg}deg)">
          <div class="donut-hole"></div>
        </div>
        <div>
          <div class="legend-item"><div class="legend-dot" style="background:#6366f1"></div> Equity <span class="legend-pct">${eqPct}%</span></div>
          <div class="legend-item"><div class="legend-dot" style="background:#10b981"></div> Debt <span class="legend-pct">${debtPct}%</span></div>
          <div class="legend-item"><div class="legend-dot" style="background:#f59e0b"></div> Gold <span class="legend-pct">${goldPct}%</span></div>
        </div>
      </div>
    `;

    // Goal-Horizon Bucketing
    const goals = getClientGoals(client);
    let tblHTML = '';
    if (goals.length === 0) {
      tblHTML = '<p style="color:var(--text-muted);font-size:.82rem;font-style:italic">No goals available. Goals will be populated from RM/Analyst artifacts.</p>';
    } else {
      tblHTML = '<table class="tbl"><thead><tr><th>Goal</th><th>Target</th><th>Horizon</th><th>Bucket</th><th>Equity</th><th>Debt</th><th>Gold</th></tr></thead><tbody>';
      goals.forEach(g => {
        const horizon = g.horizon || g.timeframe || 0;
        let bucket, eq, debt, gold;
        if (horizon < 3) {
          bucket = 'Short-term (< 3y)';
          eq = 0; debt = 100; gold = 0;
        } else if (horizon <= 7) {
          bucket = 'Medium-term (3-7y)';
          eq = 40; debt = 50; gold = 10;
        } else {
          bucket = 'Long-term (> 7y)';
          eq = catData.eq; debt = catData.debt; gold = catData.gold;
        }
        const amt = g.targetAmount || g.futureValue || g.amount || 0;
        tblHTML += `<tr>
          <td style="font-weight:600">${g.name || g.goal || '—'}</td>
          <td style="color:var(--accent-green);font-weight:700">${NF.fmt(amt)}</td>
          <td>${horizon} yrs</td>
          <td><span class="tag ${horizon < 3 ? 'tag-amber' : horizon <= 7 ? 'tag-blue' : 'tag-purple'}">${bucket}</span></td>
          <td>${eq}%</td>
          <td>${debt}%</td>
          <td>${gold}%</td>
        </tr>`;
      });
      tblHTML += '</tbody></table>';
    }
    $('#alloc-horizon-table').innerHTML = tblHTML;
  }

  function getClientGoals(client) {
    // Try multiple sources
    if (client.goals && client.goals.length) return client.goals;
    if (client.analysis && client.analysis.goalAnalysis && client.analysis.goalAnalysis.length) return client.analysis.goalAnalysis;
    // Try to parse from artifact 07
    const art07 = NF.getArtifact(client.id, '07', 'researcher');
    if (art07 && art07.content) {
      // Try to extract goals from markdown — basic pattern
      const goals = [];
      const lines = art07.content.split('\n');
      let inTable = false;
      lines.forEach(line => {
        if (line.includes('|') && !line.includes('---')) {
          const cells = line.split('|').map(c => c.trim()).filter(Boolean);
          if (cells.length >= 3 && cells[0] !== 'Goal' && cells[0] !== 'Field') {
            const name = cells[0];
            const amt = parseFloat((cells[1] || '0').replace(/[₹,]/g, '')) || 0;
            const horizon = parseFloat(cells[2]) || 0;
            if (name && (amt || horizon)) {
              goals.push({ name, targetAmount: amt, horizon });
            }
          }
        }
      });
      if (goals.length) return goals;
    }
    return [];
  }

  // ═══════════════════════════════════════════
  //  VIEW: PRODUCTS (11)
  // ═══════════════════════════════════════════
  function renderProducts(client) {
    let html = '';
    PRODUCTS.forEach((p, i) => {
      html += `
        <div class="product-row" id="product-${i}">
          <div class="prod-hdr">
            <span class="prod-name">${p.fund}</span>
            <span class="prod-er">ER: ${p.er}</span>
          </div>
          <div class="prod-cat">${p.cat}</div>
          <div class="fgroup full">
            <label>Suitability Rationale (editable)</label>
            <textarea id="rationale-${i}" rows="3">${p.rationale}</textarea>
          </div>
        </div>`;
    });
    $('#products-list').innerHTML = html;
  }

  // ═══════════════════════════════════════════
  //  VIEW: FULL PLAN (12)
  // ═══════════════════════════════════════════
  function renderFullPlan(client) {
    const readableIds = ['02', '07', '08', '09', '10', '11'];
    let html = '';
    readableIds.forEach(id => {
      const art = NF.getArtifact(client.id, id, 'researcher');
      const name = NF.ARTIFACT_NAMES[id];
      const ok = !!art;
      html += `<div class="plan-check ${ok ? 'ok' : 'missing'}">
        ${ok ? '✓' : '✗'} Artifact ${id} — ${name} ${ok ? `(v${art.version}, ${NF.fmtDate(art.generatedAt)})` : '— NOT YET GENERATED'}
      </div>`;
    });

    // Check Artifact 12 compilation status
    const art12 = NF.getArtifact(client.id, '12', 'researcher');
    if (art12) {
      html += `<div class="plan-check ok" style="margin-top:14px;border-top:1px solid var(--border-subtle);padding-top:10px">
        ✓ Artifact 12 — Compiled Plan (v${art12.version}, ${NF.fmtDate(art12.generatedAt)})
      </div>`;
      html += `<div class="form-sec" style="margin-top:20px">Preview Compiled Dossier</div>`;
      html += `<div class="artifact-viewer">${escapeHtml(art12.content)}</div>`;
      const expBtn = $('#btn-export-pdf');
      if (expBtn) expBtn.style.display = 'inline-flex';
    } else {
      html += `<div class="plan-check missing" style="margin-top:14px;border-top:1px solid var(--border-subtle);padding-top:10px">
        ✗ Artifact 12 — Compiled Plan — NOT YET COMPILED
      </div>`;
      const expBtn = $('#btn-export-pdf');
      if (expBtn) expBtn.style.display = 'none';
    }

    $('#plan-availability').innerHTML = html;
  }

  // ═══════════════════════════════════════════
  //  VIEW: GATE 3
  // ═══════════════════════════════════════════
  function renderGate3(client) {
    const g3passed = NF.isGatePassed(client.id, 3);
    const checkLabels = [
      'Asset allocation matches risk category',
      'All products are Direct plans only',
      'Suitability rationale documented per SEBI Reg 17',
      'Goal-horizon bucketing is correct'
    ];

    let html = `<div class="gate-card ${g3passed ? 'passed' : 'active'}">
      <div class="gate-hdr">
        <div class="gate-num ${g3passed ? 'ok' : 'pending'}">3</div>
        <div>
          <div class="gate-title">Gate 3 — Strategic Review</div>
          <div class="gate-sub">${g3passed ? 'Approved — ' + NF.fmtDate((client.gateTimestamps || {})[3]) : 'Pending approval by Researcher'}</div>
        </div>
      </div>
      <ul class="gate-checks">`;

    checkLabels.forEach((label, i) => {
      const on = g3passed || gate3Checks[i];
      html += `<li>
        <div class="chk-box ${on ? 'on' : ''}" id="g3-chk-${i}" ${!g3passed ? `onclick="toggleGate3Check(${i})"` : ''}></div>
        ${label}
      </li>`;
    });

    html += `</ul>`;

    if (!g3passed) {
      const allChecked = gate3Checks.every(Boolean);
      html += `<div class="form-actions" style="margin-top:16px">
        <button class="btn btn-success btn-lg" id="btn-approve-gate3" ${allChecked ? '' : 'disabled'}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
          Approve Gate 3 — Release to RM Phase 2
        </button>
      </div>`;
    } else {
      html += `<div style="margin-top:14px;padding:12px 16px;background:rgba(16,185,129,.08);border:1px solid rgba(16,185,129,.2);border-radius:var(--radius-sm);color:var(--accent-green);font-size:.82rem;font-weight:600">
        ✓ Gate 3 has been approved. The plan has been released to the RM for client delivery.
      </div>`;
    }

    html += `</div>`;

    // Prerequisite checks
    const art10 = NF.getArtifact(client.id, '10', 'researcher');
    const art11 = NF.getArtifact(client.id, '11', 'researcher');
    const art12 = NF.getArtifact(client.id, '12', 'researcher');
    if (!art10 || !art11 || !art12) {
      html += `<div class="card" style="border-color:rgba(245,158,11,.3)">
        <h3 style="color:var(--accent-amber)">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--accent-amber)" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
          Prerequisites Missing
        </h3>
        <div style="font-size:.82rem;color:var(--text-secondary);line-height:1.6">
          ${!art10 ? '<div style="color:var(--accent-red)">✗ Artifact 10 (Asset Allocation) — not generated</div>' : '<div style="color:var(--accent-green)">✓ Artifact 10 (Asset Allocation) — generated</div>'}
          ${!art11 ? '<div style="color:var(--accent-red)">✗ Artifact 11 (Product Recommendations) — not generated</div>' : '<div style="color:var(--accent-green)">✓ Artifact 11 (Product Recommendations) — generated</div>'}
          ${!art12 ? '<div style="color:var(--accent-red)">✗ Artifact 12 (Comprehensive Plan) — not generated</div>' : '<div style="color:var(--accent-green)">✓ Artifact 12 (Comprehensive Plan) — generated</div>'}
          <p style="margin-top:10px;color:var(--text-muted);font-style:italic">All three Researcher artifacts should be generated before approving Gate 3.</p>
        </div>
      </div>`;
    }

    $('#gate3-content').innerHTML = html;

    // Bind approve button
    const approveBtn = $('#btn-approve-gate3');
    if (approveBtn) {
      approveBtn.addEventListener('click', () => {
        NF.passGate(client.id, 3);
        gate3Checks = [true, true, true, true];
        NF.toast('Gate 3 approved — Plan released to RM Phase 2', 'success');
        renderGate3(NF.getClient(client.id));
      });
    }
  }

  window.toggleGate3Check = function (idx) {
    gate3Checks[idx] = !gate3Checks[idx];
    const box = $(`#g3-chk-${idx}`);
    if (box) box.classList.toggle('on', gate3Checks[idx]);
    const btn = $('#btn-approve-gate3');
    if (btn) btn.disabled = !gate3Checks.every(Boolean);
  };

  // ═══════════════════════════════════════════
  //  ARTIFACT GENERATION
  // ═══════════════════════════════════════════

  function generateArtifact10() {
    const client = getActiveClient();
    if (!client) return;
    const score = client.riskScore || 0;
    const catData = NF.scoreToCategory(score);
    const goals = getClientGoals(client);
    const ts = new Date().toISOString();

    let md = `# Artifact 10 — Asset Allocation\n`;
    md += `**Generated:** ${NF.fmtDate(ts)} | **Client:** ${client.id}\n`;
    md += `---\n\n`;

    md += `## Risk Assessment Summary\n`;
    md += `| Field | Value |\n|---|---|\n`;
    md += `| Risk Score | ${score} / 100 |\n`;
    md += `| Risk Category | ${catData.cat} |\n`;
    md += `| Assessment Method | ${NF.RISK_QUESTIONS.length}-Question Scored Questionnaire |\n\n`;

    md += `## Strategic Asset Allocation\n`;
    md += `| Asset Class | Allocation | Rationale |\n|---|---|---|\n`;
    md += `| Equity | ${catData.eq}% | Growth engine — diversified across large, mid, and flexi cap |\n`;
    md += `| Debt | ${catData.debt}% | Capital preservation and income — AAA/AA+ rated instruments |\n`;
    md += `| Gold | ${catData.gold}% | Portfolio hedge against currency risk and geopolitical uncertainty |\n\n`;

    if (goals.length > 0) {
      md += `## Goal-Horizon Bucketing\n`;
      md += `| Goal | Target Amount | Horizon | Bucket | Equity | Debt | Gold |\n|---|---|---|---|---|---|---|\n`;
      goals.forEach(g => {
        const horizon = g.horizon || g.timeframe || 0;
        let bucket, eq, debt, gold;
        if (horizon < 3) {
          bucket = 'Short-term (< 3y)'; eq = 0; debt = 100; gold = 0;
        } else if (horizon <= 7) {
          bucket = 'Medium-term (3-7y)'; eq = 40; debt = 50; gold = 10;
        } else {
          bucket = 'Long-term (> 7y)'; eq = catData.eq; debt = catData.debt; gold = catData.gold;
        }
        const amt = g.targetAmount || g.futureValue || g.amount || 0;
        md += `| ${g.name || g.goal || '—'} | ${NF.fmt(amt)} | ${horizon} yrs | ${bucket} | ${eq}% | ${debt}% | ${gold}% |\n`;
      });
      md += `\n`;
    }

    md += `## Allocation Principles\n`;
    md += `1. **Horizon-based bucketing** — Short-term goals (<3 years) receive 100% debt allocation to protect capital\n`;
    md += `2. **Medium-term goals** (3-7 years) use a balanced 40/50/10 split regardless of risk category\n`;
    md += `3. **Long-term goals** (>7 years) use the full risk-category allocation to maximize compounding\n`;
    md += `4. **Rebalancing** — Annual rebalancing when any asset class deviates by more than 5% from target\n`;
    md += `5. **Direct plans only** — All mutual fund investments via direct plans to minimize expense drag\n`;

    NF.setArtifact(client.id, '10', md, 'researcher');
    NF.toast('Artifact 10 — Asset Allocation generated successfully', 'success');
    renderAllocation(NF.getClient(client.id));
  }

  function generateArtifact11() {
    const client = getActiveClient();
    if (!client) return;
    const score = client.riskScore || 0;
    const catData = NF.scoreToCategory(score);
    const ts = new Date().toISOString();
    const goals = getClientGoals(client);

    // Determine tax regime from analysis or default
    let taxRegime = 'New Regime';
    if (client.analysis && client.analysis.tax) {
      taxRegime = client.analysis.tax.recommendation || 'New Regime';
    }

    // Build goal summary for context
    const goalSummary = goals.map(g => `${g.name || g.goal} (${g.horizon || 0}y)`).join(', ') || 'No goals mapped';

    // Collect rationales from textareas (user-edited overrides)
    const rationales = PRODUCTS.map((p, i) => {
      const ta = $(`#rationale-${i}`);
      return ta ? ta.value : p.rationale;
    });

    let md = `# Artifact 11 — Product Recommendations\n`;
    md += `**Generated:** ${NF.fmtDate(ts)} | **Client:** ${client.id}\n`;
    md += `---\n\n`;

    md += `## Client Risk Profile: ${catData.cat} (Score: ${score}/100)\n`;
    md += `**Target Allocation:** Equity ${catData.eq}% · Debt ${catData.debt}% · Gold ${catData.gold}%\n`;
    md += `**Recommended Tax Regime:** ${taxRegime}\n`;
    md += `**Mapped Goals:** ${goalSummary}\n\n`;

    md += `## Recommended Product Universe\n\n`;
    md += `> All products listed are **Direct Plans** only, in compliance with SEBI RIA regulations.\n`;
    md += `> No commissions, trailing fees, or revenue-sharing arrangements exist with any AMC.\n\n`;

    md += `| # | Category | Fund | Expense Ratio |\n|---|---|---|---|\n`;
    PRODUCTS.forEach((p, i) => {
      md += `| ${i + 1} | ${p.cat} | ${p.fund} | ${p.er} |\n`;
    });
    md += `\n`;

    md += `## Suitability Rationale (per SEBI Reg 17)\n\n`;
    md += `> Each rationale is client-specific, referencing **${client.profile.fname} ${client.profile.lname}** (${client.id}), Risk Score **${score}/100** (${catData.cat}), Tax Regime: **${taxRegime}**.\n\n`;

    PRODUCTS.forEach((p, i) => {
      md += `### ${i + 1}. ${p.fund}\n`;
      md += `**Category:** ${p.cat} | **Expense Ratio:** ${p.er}\n\n`;
      // Inject client-specific context wrapper around user-provided rationale
      md += `**Risk Profile Match:** Client ${client.id} scores ${score}/100 (${catData.cat}), targeting ${catData.eq}% equity / ${catData.debt}% debt / ${catData.gold}% gold. `;
      if (p.cat.includes('Equity')) {
        md += `This equity product aligns with the ${catData.eq}% equity allocation band.\n\n`;
      } else if (p.cat.includes('Debt') || p.cat.includes('Liquid')) {
        md += `This debt product aligns with the ${catData.debt}% debt allocation band.\n\n`;
      } else if (p.cat.includes('Gold')) {
        md += `This gold product aligns with the ${catData.gold}% defensive gold allocation band.\n\n`;
      } else if (p.cat.includes('NPS')) {
        md += `NPS provides additional Section 80CCD(1B) tax efficiency under the ${taxRegime}.\n\n`;
      }
      md += `**Product Rationale:** ${rationales[i]}\n\n`;
    });

    md += `## Important Disclosures\n`;
    md += `- Past performance does not guarantee future returns\n`;
    md += `- Mutual fund investments are subject to market risks\n`;
    md += `- All recommendations are Direct Plans — no commission is earned by the adviser\n`;
    md += `- Product selection is based on quantitative screening and fiduciary suitability analysis\n`;
    md += `- The adviser is SEBI Registered (RIA) and operates under a fee-only model\n`;

    NF.setArtifact(client.id, '11', md, 'researcher');
    NF.toast('Artifact 11 — Product Recommendations generated successfully', 'success');
    renderProducts(NF.getClient(client.id));
  }

  function generateArtifact12() {
    const client = getActiveClient();
    if (!client) return;
    const ts = new Date().toISOString();
    const execSummary = ($('#plan-exec-summary') || {}).value || '';
    const implNotes = ($('#plan-impl-notes') || {}).value || '';

    let md = `# Artifact 12 — Comprehensive Financial Plan\n`;
    md += `**Generated:** ${NF.fmtDate(ts)} | **Client:** ${client.id}\n`;
    md += `**Classification:** Confidential — For Client Use Only\n`;
    md += `---\n\n`;

    // Section 1: Executive Summary
    md += `## 1. Executive Summary\n\n`;
    if (execSummary.trim()) {
      md += `${execSummary.trim()}\n\n`;
    } else {
      md += `This comprehensive financial plan has been prepared for Client ${client.id} to achieve their stated financial goals through a disciplined, risk-appropriate investment strategy aligned with SEBI regulatory requirements.\n\n`;
    }

    // Section 2: Risk Assessment (Artifact 02)
    md += `## 2. Risk Assessment\n\n`;
    const art02 = NF.getArtifact(client.id, '02', 'researcher');
    if (art02) {
      md += `*Source: Artifact 02 — Risk Profile*\n\n`;
      md += art02.content.split('\n').filter(l => !l.startsWith('# ')).join('\n') + '\n\n';
    } else {
      md += `*Artifact 02 (Risk Profile) is not yet available.*\n\n`;
    }

    // Section 3: Goal Analysis (Artifact 07)
    md += `## 3. Goal Gap Analysis\n\n`;
    const art07 = NF.getArtifact(client.id, '07', 'researcher');
    if (art07) {
      md += `*Source: Artifact 07 — Goal Gap Analysis*\n\n`;
      md += art07.content.split('\n').filter(l => !l.startsWith('# ')).join('\n') + '\n\n';
    } else {
      md += `*Artifact 07 (Goal Gap Analysis) is not yet available.*\n\n`;
    }

    // Section 4: Tax Strategy (Artifact 08)
    md += `## 4. Tax Optimization Strategy\n\n`;
    const art08 = NF.getArtifact(client.id, '08', 'researcher');
    if (art08) {
      md += `*Source: Artifact 08 — Tax Optimization*\n\n`;
      md += art08.content.split('\n').filter(l => !l.startsWith('# ')).join('\n') + '\n\n';
    } else {
      md += `*Artifact 08 (Tax Optimization) is not yet available.*\n\n`;
    }

    // Section 5: Retirement Plan (Artifact 09)
    md += `## 5. Retirement Analysis\n\n`;
    const art09 = NF.getArtifact(client.id, '09', 'researcher');
    if (art09) {
      md += `*Source: Artifact 09 — Retirement Analysis*\n\n`;
      md += art09.content.split('\n').filter(l => !l.startsWith('# ')).join('\n') + '\n\n';
    } else {
      md += `*Artifact 09 (Retirement Analysis) is not yet available.*\n\n`;
    }

    // Section 6: Strategic Allocation (Artifact 10)
    md += `## 6. Strategic Asset Allocation\n\n`;
    const art10 = NF.getArtifact(client.id, '10', 'researcher');
    if (art10) {
      md += `*Source: Artifact 10 — Asset Allocation*\n\n`;
      md += art10.content.split('\n').filter(l => !l.startsWith('# ')).join('\n') + '\n\n';
    } else {
      md += `*Artifact 10 (Asset Allocation) has not been generated yet.*\n\n`;
    }

    // Section 7: Product Recommendations (Artifact 11)
    md += `## 7. Product Recommendations\n\n`;
    const art11 = NF.getArtifact(client.id, '11', 'researcher');
    if (art11) {
      md += `*Source: Artifact 11 — Product Recommendations*\n\n`;
      md += art11.content.split('\n').filter(l => !l.startsWith('# ')).join('\n') + '\n\n';
    } else {
      md += `*Artifact 11 (Product Recommendations) has not been generated yet.*\n\n`;
    }

    // Section 8: Implementation Notes
    md += `## 8. Implementation Notes\n\n`;
    if (implNotes.trim()) {
      md += `${implNotes.trim()}\n\n`;
    } else {
      md += `Detailed implementation steps to be provided during client delivery (Artifact 13).\n\n`;
    }

    // Section 9: Disclaimers
    md += `## 9. Disclaimers & Disclosures\n\n`;
    md += `1. This plan is prepared by a SEBI Registered Investment Adviser operating under a fee-only model.\n`;
    md += `2. No commissions, trailing fees, or revenue-sharing arrangements exist with any product manufacturer.\n`;
    md += `3. All mutual fund recommendations are Direct Plans only.\n`;
    md += `4. Past performance of any investment product does not guarantee future returns.\n`;
    md += `5. Mutual fund investments are subject to market risks. Please read all scheme-related documents carefully.\n`;
    md += `6. The projections and estimates in this plan are based on historical data and assumed growth rates. Actual returns may vary.\n`;
    md += `7. This plan should be reviewed annually or upon any material change in the client's financial circumstances.\n`;
    md += `8. Tax laws are subject to change. Tax calculations are based on FY 2025-26 rules.\n`;
    md += `9. The adviser recommends consulting a qualified tax professional for specific tax advice.\n`;
    md += `10. This document is confidential and intended solely for the named client.\n\n`;

    md += `---\n`;
    md += `*Plan compiled on ${NF.fmtDate(ts)} by NeuroFi Researcher Agent*\n`;
    md += `*© NeuroFi FP&WM Intelligence System — All rights reserved*\n`;

    NF.setArtifact(client.id, '12', md, 'researcher');
    NF.toast('Artifact 12 — Comprehensive Plan generated successfully', 'success');
    renderFullPlan(NF.getClient(client.id));
  }

  // ── HTML Escaping ──
  function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  // ── Markdown to HTML Simple Parser for PDF Print ──
  function markdownToHtml(md) {
    if (!md) return '';
    let html = md;
    
    // Escape HTML first to prevent any script injection
    html = html
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
      
    // Headings
    html = html.replace(/^#\s+(.+)$/gm, '<h1>$1</h1>');
    html = html.replace(/^##\s+(.+)$/gm, '<h2>$1</h2>');
    html = html.replace(/^###\s+(.+)$/gm, '<h3>$1</h3>');
    
    // Bold / Strong
    html = html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
    // Italics
    html = html.replace(/\*([^*]+)\*/g, '<em>$1</em>');
    
    // Quotes / Blocks
    html = html.replace(/^>\s+(.+)$/gm, '<blockquote>$1</blockquote>');
    
    // Unordered lists
    html = html.replace(/^\s*-\s+(.+)$/gm, '<li>$1</li>');
    html = html.replace(/(<li>.+<\/li>)+/gs, '<ul>$&</ul>');
    
    // GFM Tables parsing
    const lines = html.split('\n');
    let inTable = false;
    let tableHtml = '';
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (line.startsWith('|') && line.endsWith('|')) {
        const cells = line.split('|').map(c => c.trim()).filter((_, idx, arr) => idx > 0 && idx < arr.length - 1);
        if (line.includes('---|') || line.includes('-:|') || line.includes(':-:')) {
          continue;
        }
        if (!inTable) {
          inTable = true;
          tableHtml = '<table><thead><tr>' + cells.map(c => `<th>${c}</th>`).join('') + '</tr></thead><tbody>';
        } else {
          tableHtml += '<tr>' + cells.map(c => `<td>${c}</td>`).join('') + '</tr>';
        }
        lines[i] = '';
      } else {
        if (inTable) {
          inTable = false;
          tableHtml += '</tbody></table>';
          lines[i] = tableHtml + '\n' + lines[i];
          tableHtml = '';
        }
      }
    }
    
    html = lines.filter(l => l !== '').join('\n');
    
    // Paragraphs
    html = html.split('\n\n').map(p => {
      if (p.trim().startsWith('<h') || p.trim().startsWith('<table') || p.trim().startsWith('<ul') || p.trim().startsWith('<blockquote')) {
        return p;
      }
      return `<p>${p.replace(/\n/g, '<br/>')}</p>`;
    }).join('\n');
    
    return html;
  }

  // ── PDF Export Function ──
  function exportPlan() {
    const client = getActiveClient();
    if (!client) return;
    
    const art12 = NF.getArtifact(client.id, '12', 'researcher');
    if (!art12) {
      NF.toast('Artifact 12 has not been compiled yet.', 'error');
      return;
    }
    
    const printWin = window.open('', '_blank');
    if (!printWin) {
      NF.toast('Popup blocked! Please allow popups to print.', 'error');
      return;
    }
    
    const htmlContent = markdownToHtml(art12.content);
    
    printWin.document.write(`
<!DOCTYPE html>
<html>
<head>
  <title>NeuroFi Comprehensive Advisory Dossier — ${client.id}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;700;800&family=Inter:wght@400;500;600&display=swap');
    
    body {
      font-family: 'Inter', sans-serif;
      color: #0f172a;
      line-height: 1.6;
      padding: 40px;
      max-width: 800px;
      margin: 0 auto;
      background: #ffffff;
    }
    
    h1, h2, h3 {
      font-family: 'Outfit', sans-serif;
      color: #1e3a8a;
      margin-top: 24px;
      margin-bottom: 12px;
      letter-spacing: -0.01em;
    }
    
    h1 {
      font-size: 2.2rem;
      border-bottom: 2px solid #2563EB;
      padding-bottom: 12px;
      color: #1d4ed8;
    }
    
    h2 {
      font-size: 1.5rem;
      border-bottom: 1px solid #e2e8f0;
      padding-bottom: 8px;
      margin-top: 36px;
    }
    
    h3 {
      font-size: 1.1rem;
      color: #059669;
    }
    
    p {
      margin-bottom: 16px;
      font-size: 0.95rem;
      color: #334155;
    }
    
    ul, ol {
      margin-bottom: 16px;
      padding-left: 20px;
      font-size: 0.95rem;
      color: #334155;
    }
    
    li {
      margin-bottom: 6px;
    }
    
    blockquote {
      background: #f8fafc;
      border-left: 4px solid #7C3AED;
      padding: 12px 18px;
      margin: 18px 0;
      font-style: italic;
      color: #475569;
    }
    
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 20px 0;
      font-size: 0.9rem;
    }
    
    th, td {
      border: 1px solid #e2e8f0;
      padding: 10px 12px;
      text-align: left;
    }
    
    th {
      background: #f1f5f9;
      font-weight: 600;
      color: #1e293b;
    }
    
    tr:nth-child(even) {
      background: #f8fafc;
    }
    
    .header {
      border-bottom: 3px double #cbd5e1;
      margin-bottom: 32px;
      padding-bottom: 16px;
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
    }
    
    .header-logo {
      font-family: 'Outfit', sans-serif;
      font-weight: 900;
      font-size: 2.2rem;
      color: #1e3a8a;
      letter-spacing: -0.03em;
    }
    
    .header-logo span {
      color: #7C3AED;
    }
    
    .header-meta {
      text-align: right;
      font-size: 0.8rem;
      color: #64748b;
    }
    
    .footer {
      margin-top: 56px;
      font-size: 0.75rem;
      color: #64748b;
      border-top: 1px solid #e2e8f0;
      padding-top: 14px;
      text-align: center;
      line-height: 1.5;
    }
    
    @media print {
      body {
        padding: 0;
      }
      .no-print {
        display: none;
      }
      @page {
        margin: 20mm;
      }
    }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <div class="header-logo">Neuro<span>Fi</span></div>
      <div style="font-size:0.85rem;color:#475569;font-weight:600;margin-top:4px">Wealth Management Operating System</div>
    </div>
    <div class="header-meta">
      <div><strong>CLIENT ID:</strong> ${client.id}</div>
      <div><strong>DATE:</strong> ${new Date().toLocaleDateString('en-IN')}</div>
      <div style="color:#059669;font-weight:600">SEBI RIA COMPLIANT</div>
    </div>
  </div>
  
  ${htmlContent}
  
  <div class="footer">
    This document is confidential and prepared exclusively for the named client.<br/>
    This constitutes the regulatory advisory output under SEBI Investment Advisers Regulations, 2013.<br/>
    <strong>NeuroFi Fiduciary Intelligence System · 5-Year Compliance Vault Archival</strong>
  </div>
</body>
</html>
    `);
    
    printWin.document.close();
    setTimeout(() => {
      printWin.print();
    }, 250);
  }

  // Expose global namespace RE for HTML click binding
  window.RE = {
    exportPlan
  };

  // ═══════════════════════════════════════════
  //  INIT
  // ═══════════════════════════════════════════
  function init() {
    setupNav();
    populateClientSelector();

    // Bind generate buttons
    $('#btn-gen-10').addEventListener('click', generateArtifact10);
    $('#btn-gen-11').addEventListener('click', generateArtifact11);
    $('#btn-gen-12').addEventListener('click', generateArtifact12);

    refreshAll();
  }

  // Boot
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
