/* ═══════════════════════════════════════════
   NeuroFi — Researcher Portal (Agent 3)
   Strategic Allocation · Product Selection · Plan Compilation
   ═══════════════════════════════════════════ */

(function () {
  'use strict';

  // ── State ──
  let activeView = 'overview';
  let gate3Checks = [false, false, false, false];
  let searchedMobile = '';
  let goalsCache = null;
  let allocationCache = null;
  let productsCache = null;
  let planCache = null;
  let productRowSeq = 0;
  let catalogCache = null;

  const API_BASE = window.NF_API_BASE !== undefined ? window.NF_API_BASE : 'http://localhost:8080';

  // ── DOM Helpers ──
  const $ = (sel) => document.querySelector(sel);
  const $$ = (sel) => Array.from(document.querySelectorAll(sel));

  // ── Navigation ──
  function setupNav() {
    $$('.nav-btn[data-view]').forEach(btn => {
      btn.addEventListener('click', () => {
        if (btn.classList.contains('locked')) {
          NF.toast('Search for a client by mobile number first.', 'error');
          return;
        }
        switchView(btn.dataset.view);
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

  function resetCaches() {
    goalsCache = null;
    allocationCache = null;
    productsCache = null;
    planCache = null;
  }

  async function searchClientByPhone(mobile) {
    if (!mobile) {
      NF.toast('Enter a mobile number to search.', 'error');
      return;
    }

    const btn = $('#btn-search-client');
    if (btn) btn.disabled = true;
    resetCaches();

    try {
      const res = await fetch(`${API_BASE}/api/onboarding/search?mobile=${encodeURIComponent(mobile)}`);

      if (res.status === 404) {
        searchedMobile = '';
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
      NF.setActiveClientId(String(data.onboardingId));

      NF.toast('Client found. Researcher sections unlocked.', 'success');

      applyAccessState();
    } catch (err) {
      searchedMobile = '';
      NF.toast(err.message || 'Could not reach the server.', 'error');
      applyAccessState();
    } finally {
      if (btn) btn.disabled = false;
    }
  }

  // ── Access Gating ──
  // Overview is always reachable (it's where the phone search lives). Every
  // other tab locks until a client is found. (Gate 2 check disabled for now.)
  function applyAccessState() {
    const onboardingId = NF.getActiveClientId();
    const ready = !!onboardingId;
    const chip = $('#client-chip');
    const chipLabel = $('#chip-label');

    if (onboardingId && searchedMobile) {
      chip.style.display = 'flex';
      chipLabel.textContent = `${searchedMobile} (Onboarding #${onboardingId})`;
    } else {
      chip.style.display = 'none';
    }

    $$('.nav-btn[data-view]').forEach(btn => {
      btn.classList.toggle('locked', btn.dataset.view !== 'overview' && !ready);
    });

    // If the currently open tab just became locked (e.g. a fresh search reset
    // state), bounce back to Overview rather than leaving a dead view showing.
    if (activeView !== 'overview' && !ready) {
      switchView('overview');
      return;
    }

    renderCurrentView();
  }

  function renderCurrentView() {
    if (activeView === 'overview') {
      renderOverview();
      return;
    }

    const onboardingId = NF.getActiveClientId();
    if (!onboardingId) return;

    switch (activeView) {
      case 'input-review': renderInputReview(onboardingId); break;
      case 'allocation': renderAllocationView(onboardingId); break;
      case 'products': renderProductsView(onboardingId); break;
      case 'fullplan': renderFullPlanView(onboardingId); break;
      case 'gate3': renderGate3(onboardingId); break;
    }
  }

  // ── Shared goal cache (used by Allocation + Products forms) ──
  async function ensureGoalsLoaded(onboardingId) {
    if (goalsCache) return goalsCache;
    try {
      const res = await fetch(`${API_BASE}/api/customers/${onboardingId}/goals`);
      goalsCache = res.ok ? await res.json() : [];
    } catch {
      goalsCache = [];
    }
    return goalsCache;
  }

  // Static, customer-agnostic curated product list — only fetched once per session.
  async function ensureCatalogLoaded(onboardingId) {
    if (catalogCache) return catalogCache;
    try {
      const res = await fetch(`${API_BASE}/api/customers/${onboardingId}/research/products/catalog`);
      catalogCache = res.ok ? await res.json() : [];
    } catch {
      catalogCache = [];
    }
    return catalogCache;
  }

  function populateCatalogSelect(catalog) {
    const sel = $('#pf-catalog-select');
    if (!sel) return;
    sel.innerHTML = catalog.length
      ? catalog.map((c, idx) => `<option value="${idx}">${escapeHtml(c.productName)} — ${escapeHtml(c.category)} (${c.assetClass}, ${escapeHtml(c.expenseRatio)})</option>`).join('')
      : '<option value="">No catalog products available</option>';
  }

  async function fetchTextOrMessage(url, notFoundMessage) {
    try {
      const res = await fetch(url);
      if (res.status === 404) return notFoundMessage;
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.message || 'Request failed.');
      }
      return JSON.stringify(await res.json(), null, 2);
    } catch (err) {
      return err.message || 'Could not reach the server.';
    }
  }

  // ═══════════════════════════════════════════
  //  VIEW: OVERVIEW
  // ═══════════════════════════════════════════
  function renderOverview() {
    const onboardingId = NF.getActiveClientId();
    $('#overview-gates').innerHTML = '';

    if (!onboardingId) {
      $('#overview-stats').innerHTML = '';
      $('#overview-inputs').innerHTML = `
        <p style="color:var(--text-muted);font-size:.85rem;margin-top:12px">
          Enter a client's mobile number above and click <strong>Get Client</strong> to begin.
        </p>
      `;
      return;
    }

    $('#overview-stats').innerHTML = `
      <div class="stat glass">
        <div class="stat-icon"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4-4v2"/><circle cx="9" cy="7" r="4"/></svg></div>
        <div><div class="stat-val">#${onboardingId}</div><div class="stat-lbl">Onboarding ID</div></div>
      </div>
    `;
    $('#overview-inputs').innerHTML = `
      <p style="color:var(--text-muted);font-size:.85rem;margin-top:12px">
        Use the sidebar to review Analyst inputs, set the strategic allocation, recommend products,
        and compile the full plan for this client.
      </p>
    `;
  }

  // ═══════════════════════════════════════════
  //  VIEW: INPUT REVIEW
  // ═══════════════════════════════════════════
  async function renderInputReview(onboardingId) {
    const panels = [
      { id: '02', name: 'Risk Profile' },
      { id: '07', name: 'Goal Gap Analysis' },
      { id: '08', name: 'Tax Optimization' },
      { id: '09', name: 'Retirement Analysis' }
    ];

    let html = '';
    panels.forEach((p, idx) => {
      const openClass = idx === 0 ? 'open' : '';
      html += `<div class="artifact-panel ${openClass}" id="panel-art-${p.id}">
        <div class="artifact-panel-hdr" onclick="togglePanel('${p.id}')">
          <h3>Artifact ${p.id} — ${p.name}</h3>
          <svg class="chevron" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"/></svg>
        </div>
        <div class="artifact-viewer" id="panel-viewer-${p.id}">Loading…</div>
      </div>`;
    });
    $('#input-review-panels').innerHTML = html;

    const [risk, goalGaps, tax, retirement] = await Promise.all([
      fetchTextOrMessage(`${API_BASE}/api/customers/${onboardingId}/risk-assessment`, 'Risk assessment not yet completed.'),
      fetchTextOrMessage(`${API_BASE}/api/customers/${onboardingId}/analyst/reports/GOAL_GAPS/latest`, 'Goal Gap report not yet generated.'),
      fetchTextOrMessage(`${API_BASE}/api/customers/${onboardingId}/analyst/reports/TAX/latest`, 'Tax report not yet generated.'),
      fetchTextOrMessage(`${API_BASE}/api/customers/${onboardingId}/analyst/reports/RETIREMENT_PLANNING/latest`, 'Retirement report not yet generated.')
    ]);

    const v02 = $('#panel-viewer-02'); if (v02) v02.textContent = risk;
    const v07 = $('#panel-viewer-07'); if (v07) v07.textContent = goalGaps;
    const v08 = $('#panel-viewer-08'); if (v08) v08.textContent = tax;
    const v09 = $('#panel-viewer-09'); if (v09) v09.textContent = retirement;
  }

  window.togglePanel = function (artId) {
    const panel = $(`#panel-art-${artId}`);
    if (panel) panel.classList.toggle('open');
  };

  // ═══════════════════════════════════════════
  //  VIEW: ALLOCATION (10)
  // ═══════════════════════════════════════════
  async function renderAllocationView(onboardingId) {
    try {
      const res = await fetch(`${API_BASE}/api/customers/${onboardingId}/research/allocation`);

      if (res.status === 404) {
        allocationCache = null;
        await openAllocationForm(onboardingId, null);
        return;
      }
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.message || 'Failed to load allocation.');
      }

      allocationCache = await res.json();
      renderAllocationViewMode(allocationCache);
    } catch (err) {
      NF.toast(err.message || 'Could not reach the server.', 'error');
    }
  }

  function renderAllocationViewMode(data) {
    const sa = data.strategicAllocation || {};
    const eq = sa.equityPct || 0, debt = sa.debtPct || 0, gold = sa.goldPct || 0;
    const eqDeg = (eq / 100) * 360, debtDeg = (debt / 100) * 360, goldDeg = (gold / 100) * 360;

    $('#alloc-risk-summary').innerHTML = `
      <div class="card glass" style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:12px">
        <div>
          <div style="font-size:.78rem;color:var(--text-muted);text-transform:uppercase;letter-spacing:.06em">Status</div>
          <div style="font-weight:700;color:${data.status === 'CONFIRMED' ? 'var(--accent-green)' : 'var(--accent-amber)'}">${data.status}</div>
        </div>
        <div style="text-align:right">
          <div style="font-size:.78rem;color:var(--text-muted)">Total Monthly SIP / Corpus Allocated</div>
          <div style="font-weight:700">${NF.fmt(data.totalMonthlySipInr || 0)} / ${NF.fmt(data.totalCorpusAllocatedInr || 0)}</div>
        </div>
      </div>
    `;

    $('#alloc-donut-area').innerHTML = `
      <div class="alloc-wrap">
        <div class="donut" style="background:conic-gradient(#6366f1 0deg ${eqDeg}deg, #10b981 ${eqDeg}deg ${eqDeg + debtDeg}deg, #f59e0b ${eqDeg + debtDeg}deg ${eqDeg + debtDeg + goldDeg}deg)">
          <div class="donut-hole"></div>
        </div>
        <div>
          <div class="legend-item"><div class="legend-dot" style="background:#6366f1"></div> Equity <span class="legend-pct">${eq}%</span></div>
          <div class="legend-item"><div class="legend-dot" style="background:#10b981"></div> Debt <span class="legend-pct">${debt}%</span></div>
          <div class="legend-item"><div class="legend-dot" style="background:#f59e0b"></div> Gold <span class="legend-pct">${gold}%</span></div>
          ${sa.overrideReason ? `<div style="margin-top:10px;font-size:.78rem;color:var(--text-muted)"><strong>Override:</strong> ${escapeHtml(sa.overrideReason)}</div>` : ''}
        </div>
      </div>
    `;

    const goals = data.goalAllocations || [];
    let tbl;
    if (goals.length === 0) {
      tbl = '<p style="color:var(--text-muted);font-size:.82rem;font-style:italic">No per-goal allocations recorded.</p>';
    } else {
      tbl = '<table class="tbl"><thead><tr><th>Goal</th><th>Horizon</th><th>Bucket</th><th>Equity</th><th>Debt</th><th>Gold</th><th>Monthly SIP</th><th>Corpus</th></tr></thead><tbody>';
      goals.forEach(g => {
        const bucketTag = g.bucket === 'SHORT' ? 'tag-amber' : g.bucket === 'MEDIUM' ? 'tag-blue' : 'tag-purple';
        tbl += `<tr>
          <td style="font-weight:600">${escapeHtml(g.goalName || '—')}</td>
          <td>${g.timelineYears} yrs</td>
          <td><span class="tag ${bucketTag}">${g.bucket}</span></td>
          <td>${g.equityPct}%</td>
          <td>${g.debtPct}%</td>
          <td>${g.goldPct}%</td>
          <td style="color:var(--accent-green);font-weight:700">${NF.fmt(g.monthlySipAssignedInr)}</td>
          <td>${NF.fmt(g.corpusAllocatedInr)}</td>
        </tr>`;
      });
      tbl += '</tbody></table>';
    }
    $('#alloc-horizon-table').innerHTML = tbl;

    const sd = data.surplusDeployment || {};
    $('#alloc-surplus-area').innerHTML = `
      <div class="metrics">
        <div class="m-item"><div class="m-lbl">Emergency Fund</div><div class="m-val">${NF.fmt(sd.emergencyFundMonthlyInr || 0)}</div></div>
        <div class="m-item"><div class="m-lbl">NPS</div><div class="m-val">${NF.fmt(sd.npsMonthlyInr || 0)}</div></div>
        <div class="m-item"><div class="m-lbl">Wealth Creation</div><div class="m-val">${NF.fmt(sd.wealthCreationMonthlyInr || 0)}</div></div>
        <div class="m-item"><div class="m-lbl">Total Deployed</div><div class="m-val pos">${NF.fmt(sd.totalDeployedMonthlyInr || 0)}</div></div>
      </div>
    `;

    $('#alloc-notes-view').innerHTML = data.notes
      ? `<div class="card"><h3>Notes</h3><p style="color:var(--text-secondary)">${escapeHtml(data.notes)}</p></div>`
      : '';

    $('#alloc-view-mode').style.display = 'block';
    $('#alloc-form').style.display = 'none';
  }

  async function openAllocationForm(onboardingId, prefill) {
    const goals = await ensureGoalsLoaded(onboardingId);

    $('#af-equity').value = prefill ? prefill.strategicAllocation.equityPct : '';
    $('#af-debt').value = prefill ? prefill.strategicAllocation.debtPct : '';
    $('#af-gold').value = prefill ? prefill.strategicAllocation.goldPct : '';
    $('#af-override-reason').value = prefill ? (prefill.strategicAllocation.overrideReason || '') : '';
    $('#af-emergency').value = prefill ? prefill.surplusDeployment.emergencyFundMonthlyInr : 0;
    $('#af-nps').value = prefill ? prefill.surplusDeployment.npsMonthlyInr : 0;
    $('#af-wealth').value = prefill ? prefill.surplusDeployment.wealthCreationMonthlyInr : 0;
    $('#af-notes').value = prefill ? (prefill.notes || '') : '';

    const rowsContainer = $('#af-goal-rows');
    if (!goals.length) {
      rowsContainer.innerHTML = '<p style="color:var(--text-muted);font-size:.82rem;font-style:italic">No goals found for this client yet.</p>';
    } else {
      const existingByGoal = {};
      (prefill ? prefill.goalAllocations : []).forEach(g => { existingByGoal[g.goalId] = g; });
      rowsContainer.innerHTML = goals.map(g => {
        const ex = existingByGoal[g.id];
        return `
          <div class="frow" data-goal-id="${g.id}">
            <div class="fgroup"><label>${escapeHtml(g.name)} — Monthly SIP (₹)</label><input type="number" min="0" class="af-goal-sip" value="${ex ? ex.monthlySipAssignedInr : 0}"/></div>
            <div class="fgroup"><label>Corpus Allocated (₹)</label><input type="number" min="0" class="af-goal-corpus" value="${ex ? ex.corpusAllocatedInr : 0}"/></div>
          </div>
        `;
      }).join('');
    }

    $('#alloc-view-mode').style.display = 'none';
    $('#alloc-form').style.display = 'block';
    $('#btn-cancel-allocation').style.display = prefill ? 'inline-flex' : 'none';
  }

  function setupAllocationForm() {
    const form = $('#alloc-form');
    if (!form) return;

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const onboardingId = NF.getActiveClientId();
      if (!onboardingId) return;

      const equityPct = parseInt($('#af-equity').value, 10);
      const debtPct = parseInt($('#af-debt').value, 10);
      const goldPct = parseInt($('#af-gold').value, 10);
      if (equityPct + debtPct + goldPct !== 100) {
        NF.toast('Equity + Debt + Gold must total 100%.', 'error');
        return;
      }

      const goalAllocations = $$('#af-goal-rows [data-goal-id]').map(row => ({
        goalId: parseInt(row.dataset.goalId, 10),
        monthlySipAssignedInr: parseFloat(row.querySelector('.af-goal-sip').value || '0'),
        corpusAllocatedInr: parseFloat(row.querySelector('.af-goal-corpus').value || '0')
      }));

      const payload = {
        strategicAllocation: { equityPct, debtPct, goldPct, overrideReason: $('#af-override-reason').value.trim() || null },
        goalAllocations,
        surplusDeployment: {
          emergencyFundMonthlyInr: parseFloat($('#af-emergency').value || '0'),
          npsMonthlyInr: parseFloat($('#af-nps').value || '0'),
          wealthCreationMonthlyInr: parseFloat($('#af-wealth').value || '0')
        },
        notes: $('#af-notes').value.trim() || null
      };

      const btn = $('#btn-save-allocation');
      if (btn) btn.disabled = true;
      try {
        const res = await fetch(`${API_BASE}/api/customers/${onboardingId}/research/allocation`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body.message || 'Failed to save allocation.');
        }
        allocationCache = await res.json();
        NF.toast('Allocation saved successfully!', 'success');
        renderAllocationViewMode(allocationCache);
      } catch (err) {
        NF.toast(err.message || 'Could not reach the server.', 'error');
      } finally {
        if (btn) btn.disabled = false;
      }
    });

    const cancelBtn = $('#btn-cancel-allocation');
    if (cancelBtn) cancelBtn.addEventListener('click', () => {
      if (allocationCache) renderAllocationViewMode(allocationCache);
    });

    const editBtn = $('#btn-edit-allocation');
    if (editBtn) editBtn.addEventListener('click', () => {
      const onboardingId = NF.getActiveClientId();
      if (onboardingId) openAllocationForm(onboardingId, allocationCache);
    });
  }

  // ═══════════════════════════════════════════
  //  VIEW: PRODUCTS (11)
  // ═══════════════════════════════════════════
  async function renderProductsView(onboardingId) {
    try {
      const res = await fetch(`${API_BASE}/api/customers/${onboardingId}/research/products`);

      if (res.status === 404) {
        productsCache = null;
        await openProductsForm(onboardingId, null);
        return;
      }
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.message || 'Failed to load products.');
      }

      productsCache = await res.json();
      renderProductsViewMode(productsCache);
    } catch (err) {
      NF.toast(err.message || 'Could not reach the server.', 'error');
    }
  }

  function renderProductsViewMode(data) {
    const s = data.summary || {};
    $('#products-summary-card').innerHTML = `
      <div class="card glass">
        <div class="metrics">
          <div class="m-item"><div class="m-lbl">Tax Regime</div><div class="m-val">${data.taxRegime}</div></div>
          <div class="m-item"><div class="m-lbl">Status</div><div class="m-val" style="color:${data.status === 'CONFIRMED' ? 'var(--accent-green)' : 'var(--accent-amber)'}">${data.status}</div></div>
          <div class="m-item"><div class="m-lbl">Total Monthly SIP</div><div class="m-val pos">${NF.fmt(s.totalMonthlySipInr || 0)}</div></div>
          <div class="m-item"><div class="m-lbl">Total Lump Sum</div><div class="m-val pos">${NF.fmt(s.totalLumpSumInr || 0)}</div></div>
        </div>
        ${data.notes ? `<p style="margin-top:14px;color:var(--text-secondary)">${escapeHtml(data.notes)}</p>` : ''}
      </div>
    `;

    const rows = data.products || [];
    $('#products-list').innerHTML = rows.length ? rows.map((p, idx) => {
      const tagClass = p.assetClass === 'EQUITY' ? 'tag-blue' : p.assetClass === 'DEBT' ? 'tag-green' : p.assetClass === 'GOLD' ? 'tag-amber' : 'tag-purple';
      return `
      <div class="product-row">
        <div class="prod-hdr">
          <span class="prod-name">${escapeHtml(p.productName)}</span>
          <div style="display:flex;align-items:center;gap:10px">
            <span class="prod-er">ER: ${escapeHtml(p.expenseRatio)}</span>
            <button type="button" class="goal-del" data-delete-product="${idx}" title="Remove product">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
            </button>
          </div>
        </div>
        <div class="prod-cat">${escapeHtml(p.category)} · <span class="tag ${tagClass}">${p.assetClass}</span> · ${p.allocationPctOfPortfolio}% of portfolio</div>
        <div style="font-size:.85rem;color:var(--text-secondary);margin-bottom:8px">
          <strong>Monthly SIP:</strong> ${NF.fmt(p.monthlySipInr)} &nbsp; <strong>Lump Sum:</strong> ${NF.fmt(p.lumpSumInr)} &nbsp; <strong>Goals:</strong> ${(p.goalIds || []).join(', ') || '—'}
        </div>
        <div style="font-size:.82rem;color:var(--text-tertiary);line-height:1.5"><strong>Suitability:</strong> ${escapeHtml(p.suitabilityRationale)}</div>
      </div>`;
    }).join('') : '<p style="color:var(--text-muted);font-size:.82rem;font-style:italic">No products recorded.</p>';

    $$('#products-list [data-delete-product]').forEach(btn => {
      btn.addEventListener('click', () => deleteProduct(parseInt(btn.dataset.deleteProduct, 10)));
    });

    $('#products-view-mode').style.display = 'block';
    $('#products-form').style.display = 'none';
  }

  // No single-product DELETE endpoint exists — removal re-saves the full list
  // (minus the removed product) via the same upsert POST /research/products.
  async function deleteProduct(index) {
    const onboardingId = NF.getActiveClientId();
    if (!onboardingId || !productsCache) return;

    const remaining = (productsCache.products || []).filter((_, i) => i !== index);
    if (remaining.length === 0) {
      NF.toast('At least one product is required — edit the list instead of removing the last one.', 'error');
      return;
    }

    const totalPct = remaining.reduce((sum, p) => sum + p.allocationPctOfPortfolio, 0);
    if (totalPct !== 100) {
      NF.toast(`Removing this product leaves allocation at ${totalPct}% — edit the remaining products' percentages before removing.`, 'error');
      return;
    }

    const payload = {
      taxRegime: productsCache.taxRegime,
      products: remaining.map(p => ({
        productName: p.productName,
        category: p.category,
        assetClass: p.assetClass,
        expenseRatio: p.expenseRatio,
        allocationPctOfPortfolio: p.allocationPctOfPortfolio,
        monthlySipInr: p.monthlySipInr,
        lumpSumInr: p.lumpSumInr,
        suitabilityRationale: p.suitabilityRationale,
        goalIds: p.goalIds || []
      })),
      notes: productsCache.notes || null
    };

    try {
      const res = await fetch(`${API_BASE}/api/customers/${onboardingId}/research/products`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.message || 'Failed to remove product.');
      }
      productsCache = await res.json();
      NF.toast('Product removed.', 'success');
      renderProductsViewMode(productsCache);
    } catch (err) {
      NF.toast(err.message || 'Could not reach the server.', 'error');
    }
  }

  function buildProductRowHTML(rowId, goals, data) {
    data = data || {};
    const goalIds = data.goalIds || [];
    const goalOptions = goals.map(g => `<option value="${g.id}" ${goalIds.includes(g.id) ? 'selected' : ''}>${escapeHtml(g.name)}</option>`).join('');
    return `
      <div class="product-row" data-row-id="${rowId}">
        <div class="prod-hdr">
          <span class="prod-name">Product</span>
          <button type="button" class="goal-del" data-remove-row="${rowId}">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
          </button>
        </div>
        <div class="frow">
          <div class="fgroup"><label>Product Name *</label><input type="text" class="pr-name" value="${escapeHtml(data.productName || '')}" required/></div>
          <div class="fgroup"><label>Category *</label><input type="text" class="pr-category" value="${escapeHtml(data.category || '')}" required placeholder="e.g. Flexi Cap"/></div>
        </div>
        <div class="frow">
          <div class="fgroup"><label>Asset Class *</label>
            <select class="pr-assetclass">
              <option value="EQUITY" ${data.assetClass === 'EQUITY' ? 'selected' : ''}>Equity</option>
              <option value="DEBT" ${data.assetClass === 'DEBT' ? 'selected' : ''}>Debt</option>
              <option value="GOLD" ${data.assetClass === 'GOLD' ? 'selected' : ''}>Gold</option>
              <option value="NPS" ${data.assetClass === 'NPS' ? 'selected' : ''}>NPS</option>
            </select>
          </div>
          <div class="fgroup"><label>Expense Ratio *</label><input type="text" class="pr-er" value="${escapeHtml(data.expenseRatio || '')}" placeholder="0.35%" required/></div>
        </div>
        <div class="frow">
          <div class="fgroup"><label>Allocation % of Portfolio *</label><input type="number" class="pr-pct" min="0" max="100" value="${data.allocationPctOfPortfolio ?? ''}" required/></div>
          <div class="fgroup"><label>Monthly SIP (₹) *</label><input type="number" class="pr-sip" min="0" value="${data.monthlySipInr ?? 0}" required/></div>
        </div>
        <div class="frow">
          <div class="fgroup"><label>Lump Sum (₹)</label><input type="number" class="pr-lumpsum" min="0" value="${data.lumpSumInr ?? 0}"/></div>
          <div class="fgroup"><label>Goals Served</label><select class="pr-goals" multiple size="3">${goalOptions}</select></div>
        </div>
        <div class="fgroup full"><label>Suitability Rationale (SEBI Reg 17) *</label><textarea class="pr-rationale" rows="3" required>${escapeHtml(data.suitabilityRationale || '')}</textarea></div>
      </div>
    `;
  }

  function bindProductRowRemovers() {
    $$('#pf-product-rows [data-remove-row]').forEach(btn => {
      btn.onclick = () => btn.closest('.product-row').remove();
    });
  }

  async function openProductsForm(onboardingId, prefill) {
    const goals = await ensureGoalsLoaded(onboardingId);
    $('#pf-tax-regime').value = prefill ? prefill.taxRegime : 'NEW';
    $('#pf-notes').value = (prefill && prefill.notes) ? prefill.notes : '';

    const catalog = await ensureCatalogLoaded(onboardingId);
    populateCatalogSelect(catalog);

    const container = $('#pf-product-rows');
    container.innerHTML = '';
    // No existing recommendation yet: start empty and let the researcher pick
    // from the curated catalog (or add a blank row for manual entry).
    const rows = (prefill && prefill.products) ? prefill.products : [];
    rows.forEach(p => {
      productRowSeq += 1;
      container.insertAdjacentHTML('beforeend', buildProductRowHTML(productRowSeq, goals, p));
    });
    bindProductRowRemovers();

    $('#products-view-mode').style.display = 'none';
    $('#products-form').style.display = 'block';
    $('#btn-cancel-products').style.display = prefill ? 'inline-flex' : 'none';
  }

  function setupProductsForm() {
    const addBtn = $('#btn-add-product');
    if (addBtn) addBtn.addEventListener('click', async () => {
      const onboardingId = NF.getActiveClientId();
      if (!onboardingId) return;
      const goals = await ensureGoalsLoaded(onboardingId);
      productRowSeq += 1;
      $('#pf-product-rows').insertAdjacentHTML('beforeend', buildProductRowHTML(productRowSeq, goals, {}));
      bindProductRowRemovers();
    });

    const addFromCatalogBtn = $('#btn-add-from-catalog');
    if (addFromCatalogBtn) addFromCatalogBtn.addEventListener('click', async () => {
      const onboardingId = NF.getActiveClientId();
      if (!onboardingId) return;

      const sel = $('#pf-catalog-select');
      const idx = sel ? sel.value : '';
      if (idx === '') {
        NF.toast('Select a product from the catalog first.', 'error');
        return;
      }

      const catalog = await ensureCatalogLoaded(onboardingId);
      const item = catalog[parseInt(idx, 10)];
      if (!item) return;

      const goals = await ensureGoalsLoaded(onboardingId);
      productRowSeq += 1;
      $('#pf-product-rows').insertAdjacentHTML('beforeend', buildProductRowHTML(productRowSeq, goals, {
        productName: item.productName,
        category: item.category,
        assetClass: item.assetClass,
        expenseRatio: item.expenseRatio,
        suitabilityRationale: item.defaultSuitabilityRationale,
        allocationPctOfPortfolio: '',
        monthlySipInr: 0,
        lumpSumInr: 0,
        goalIds: []
      }));
      bindProductRowRemovers();
      NF.toast(`${item.productName} added — enter the allocation amount.`, 'success');
    });

    const form = $('#products-form');
    if (form) {
      form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const onboardingId = NF.getActiveClientId();
        if (!onboardingId) return;

        const rows = $$('#pf-product-rows .product-row');
        if (rows.length === 0) {
          NF.toast('Add at least one product before saving.', 'error');
          return;
        }
        const products = rows.map(row => ({
          productName: row.querySelector('.pr-name').value.trim(),
          category: row.querySelector('.pr-category').value.trim(),
          assetClass: row.querySelector('.pr-assetclass').value,
          expenseRatio: row.querySelector('.pr-er').value.trim(),
          allocationPctOfPortfolio: parseInt(row.querySelector('.pr-pct').value || '0', 10),
          monthlySipInr: parseFloat(row.querySelector('.pr-sip').value || '0'),
          lumpSumInr: parseFloat(row.querySelector('.pr-lumpsum').value || '0'),
          suitabilityRationale: row.querySelector('.pr-rationale').value.trim(),
          goalIds: Array.from(row.querySelector('.pr-goals').selectedOptions).map(o => parseInt(o.value, 10))
        }));

        const totalPct = products.reduce((sum, p) => sum + p.allocationPctOfPortfolio, 0);
        if (totalPct !== 100) {
          NF.toast(`Allocation percentages must total 100% (currently ${totalPct}%).`, 'error');
          return;
        }
        if (products.some(p => !p.suitabilityRationale)) {
          NF.toast('Suitability rationale is required for every product.', 'error');
          return;
        }

        const payload = {
          taxRegime: $('#pf-tax-regime').value,
          products,
          notes: $('#pf-notes').value.trim() || null
        };

        const btn = $('#btn-save-products');
        if (btn) btn.disabled = true;
        try {
          const res = await fetch(`${API_BASE}/api/customers/${onboardingId}/research/products`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
          });
          if (!res.ok) {
            const body = await res.json().catch(() => ({}));
            throw new Error(body.message || 'Failed to save products.');
          }
          productsCache = await res.json();
          NF.toast('Products saved successfully!', 'success');
          renderProductsViewMode(productsCache);
        } catch (err) {
          NF.toast(err.message || 'Could not reach the server.', 'error');
        } finally {
          if (btn) btn.disabled = false;
        }
      });
    }

    const cancelBtn = $('#btn-cancel-products');
    if (cancelBtn) cancelBtn.addEventListener('click', () => {
      if (productsCache) renderProductsViewMode(productsCache);
    });

    const editBtn = $('#btn-edit-products');
    if (editBtn) editBtn.addEventListener('click', () => {
      const onboardingId = NF.getActiveClientId();
      if (onboardingId) openProductsForm(onboardingId, productsCache);
    });
  }

  // ═══════════════════════════════════════════
  //  VIEW: FULL PLAN (12)
  // ═══════════════════════════════════════════
  async function renderFullPlanView(onboardingId) {
    try {
      const res = await fetch(`${API_BASE}/api/customers/${onboardingId}/research/plan`);
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.message || 'Failed to load plan.');
      }
      planCache = await res.json();
      renderPlanAvailability(planCache.prerequisites);

      const genBtn = $('#btn-gen-12');
      const expBtn = $('#btn-export-pdf');
      const snapCard = $('#plan-snapshot-card');

      if (planCache.planId) {
        $('#plan-exec-summary').value = planCache.executiveSummary || '';
        $('#plan-impl-notes').value = planCache.implementationNotes || '';
        $('#plan-version-label').textContent = planCache.planVersion || 1;
        $('#plan-snapshot-viewer').textContent = JSON.stringify(planCache.snapshot, null, 2);
        snapCard.style.display = 'block';
        if (expBtn) expBtn.style.display = 'inline-flex';
        if (genBtn) genBtn.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg> Regenerate Artifact 12 — Comprehensive Plan`;
      } else {
        snapCard.style.display = 'none';
        if (expBtn) expBtn.style.display = 'none';
        if (genBtn) genBtn.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg> Generate Artifact 12 — Comprehensive Plan`;
      }
      if (genBtn) genBtn.disabled = !(planCache.prerequisites && planCache.prerequisites.canGenerate);
    } catch (err) {
      NF.toast(err.message || 'Could not reach the server.', 'error');
    }
  }

  function renderPlanAvailability(prereq) {
    if (!prereq) {
      $('#plan-availability').innerHTML = '';
      return;
    }
    const rows = [
      ['profile', 'Client Profile'], ['goals', 'Goal Map'], ['riskAssessment', 'Risk Assessment'],
      ['financials', 'Financial Snapshot'], ['allocation', 'Strategic Allocation'], ['products', 'Product Recommendations']
    ];
    let html = rows.map(([key, label]) => {
      const ok = !!prereq[key];
      return `<div class="plan-check ${ok ? 'ok' : 'missing'}">${ok ? '✓' : '✗'} ${label}${ok ? '' : ' — NOT YET RECORDED'}</div>`;
    }).join('');

    const ar = prereq.analystReports || {};
    const arRows = [['netWorth', 'Net Worth'], ['insurance', 'Insurance'], ['tax', 'Tax'], ['retirementPlanning', 'Retirement'], ['goalGaps', 'Goal Gaps']];
    html += `<div style="margin-top:10px;padding-top:10px;border-top:1px solid var(--border-subtle)">`;
    html += arRows.map(([key, label]) => {
      const ok = !!ar[key];
      return `<div class="plan-check ${ok ? 'ok' : 'missing'}" style="font-size:.75rem">${ok ? '✓' : '○'} Analyst Report — ${label}${ok ? '' : ' (optional, not generated)'}</div>`;
    }).join('');
    html += `</div>`;

    html += `<div class="plan-check ${prereq.canGenerate ? 'ok' : 'missing'}" style="margin-top:10px;border-top:1px solid var(--border-subtle);padding-top:10px;font-weight:700">
      ${prereq.canGenerate ? '✓ All blocking prerequisites met — ready to generate' : '✗ Complete the missing items above before generating'}
    </div>`;

    $('#plan-availability').innerHTML = html;
  }

  function setupFullPlanForm() {
    const btn = $('#btn-gen-12');
    if (!btn) return;
    btn.addEventListener('click', async () => {
      const onboardingId = NF.getActiveClientId();
      if (!onboardingId) return;
      const executiveSummary = $('#plan-exec-summary').value.trim();
      if (!executiveSummary) {
        NF.toast('Executive summary is required.', 'error');
        return;
      }

      const payload = { executiveSummary, implementationNotes: $('#plan-impl-notes').value.trim() || null };
      btn.disabled = true;
      try {
        const res = await fetch(`${API_BASE}/api/customers/${onboardingId}/research/plan`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body.message || 'Failed to generate plan.');
        }
        planCache = await res.json();
        NF.toast(`Comprehensive Plan generated (v${planCache.planVersion}).`, 'success');
        renderFullPlanView(onboardingId);
      } catch (err) {
        NF.toast(err.message || 'Could not reach the server.', 'error');
      } finally {
        btn.disabled = false;
      }
    });
  }

  function exportPlan() {
    if (!planCache || !planCache.planId) {
      NF.toast('No plan to export yet.', 'error');
      return;
    }
    const printWin = window.open('', '_blank');
    printWin.document.write(`
      <html><head><title>NeuroFi Comprehensive Plan</title>
      <style>body{font-family:Georgia,serif;padding:40px;color:#111}h1{font-size:22px}h2{font-size:16px;margin-top:24px}pre{white-space:pre-wrap;font-family:monospace;font-size:11px;background:#f5f5f5;padding:12px;border-radius:6px}</style>
      </head><body>
      <h1>NeuroFi Comprehensive Financial Plan</h1>
      <p><strong>Onboarding #${planCache.onboardingId}</strong> · Version ${planCache.planVersion} · ${planCache.status}</p>
      <h2>Executive Summary</h2><p>${escapeHtml(planCache.executiveSummary || '').replace(/\n/g, '<br/>')}</p>
      <h2>Implementation Notes</h2><p>${escapeHtml(planCache.implementationNotes || '').replace(/\n/g, '<br/>')}</p>
      <h2>Plan Snapshot</h2><pre>${escapeHtml(JSON.stringify(planCache.snapshot, null, 2))}</pre>
      <p style="margin-top:40px;font-size:11px;color:#888">NeuroFi Fiduciary Intelligence System · Compliance Vault</p>
      </body></html>
    `);
    printWin.document.close();
    setTimeout(() => printWin.print(), 250);
  }

  window.RE = { exportPlan };

  // ═══════════════════════════════════════════
  //  VIEW: GATE 3
  // ═══════════════════════════════════════════
  async function renderGate3(onboardingId) {
    let gate3Passed = false;
    try {
      const res = await fetch(`${API_BASE}/api/customers/${onboardingId}/gates`);
      if (res.ok) {
        const data = await res.json();
        const g3 = (data.gates || []).find(g => g.gateNumber === 3);
        gate3Passed = !!(g3 && g3.passed);
      }
    } catch {
      gate3Passed = false;
    }

    const checkLabels = [
      'Asset allocation matches risk category',
      'All products are Direct plans only',
      'Suitability rationale documented per SEBI Reg 17',
      'Goal-horizon bucketing is correct'
    ];

    let html = `<div class="gate-card ${gate3Passed ? 'passed' : 'active'}">
      <div class="gate-hdr">
        <div class="gate-num ${gate3Passed ? 'ok' : 'pending'}">3</div>
        <div>
          <div class="gate-title">Gate 3 — Strategic Review</div>
          <div class="gate-sub">${gate3Passed ? 'Approved' : 'Pending approval by Researcher'}</div>
        </div>
      </div>
      <ul class="gate-checks">`;

    checkLabels.forEach((label, i) => {
      const on = gate3Passed || gate3Checks[i];
      html += `<li><div class="chk-box ${on ? 'on' : ''}" id="g3-chk-${i}" ${!gate3Passed ? `onclick="toggleGate3Check(${i})"` : ''}></div>${label}</li>`;
    });
    html += `</ul>`;

    if (!gate3Passed) {
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

    const hasAlloc = !!allocationCache;
    const hasProducts = !!productsCache;
    const hasPlan = !!(planCache && planCache.planId);
    if (!hasAlloc || !hasProducts || !hasPlan) {
      html += `<div class="card" style="border-color:rgba(245,158,11,.3)">
        <h3 style="color:var(--accent-amber)">Prerequisites Missing</h3>
        <div style="font-size:.82rem;color:var(--text-secondary);line-height:1.6">
          ${!hasAlloc ? '<div style="color:var(--accent-red)">✗ Strategic Allocation — not saved</div>' : '<div style="color:var(--accent-green)">✓ Strategic Allocation — saved</div>'}
          ${!hasProducts ? '<div style="color:var(--accent-red)">✗ Product Recommendations — not saved</div>' : '<div style="color:var(--accent-green)">✓ Product Recommendations — saved</div>'}
          ${!hasPlan ? '<div style="color:var(--accent-red)">✗ Comprehensive Plan — not generated</div>' : '<div style="color:var(--accent-green)">✓ Comprehensive Plan — generated</div>'}
          <p style="margin-top:10px;color:var(--text-muted);font-style:italic">Visit the Allocation, Products and Full Plan tabs first if any of these are missing.</p>
        </div>
      </div>`;
    }

    $('#gate3-content').innerHTML = html;

    const approveBtn = $('#btn-approve-gate3');
    if (approveBtn) {
      approveBtn.addEventListener('click', async () => {
        try {
          const res = await fetch(`${API_BASE}/api/customers/${onboardingId}/gates/3`, { method: 'PUT' });
          if (!res.ok) {
            const body = await res.json().catch(() => ({}));
            throw new Error(body.message || 'Failed to approve Gate 3.');
          }
          NF.toast('Gate 3 approved — Plan released to RM Phase 2', 'success');
          renderGate3(onboardingId);
        } catch (err) {
          NF.toast(err.message || 'Could not reach the server.', 'error');
        }
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

  // ── HTML Escaping ──
  function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str == null ? '' : str;
    return div.innerHTML;
  }

  // ═══════════════════════════════════════════
  //  INIT
  // ═══════════════════════════════════════════
  function init() {
    setupNav();
    setupClientSearch();
    setupAllocationForm();
    setupProductsForm();
    setupFullPlanForm();
    applyAccessState();
  }

  // Boot
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
