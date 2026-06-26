/* ═══════════════════════════════════════════
   NeuroFi — Shared Data Layer & Artifact Store
   All 3 portals import this file.
   Artifacts stored as MD strings in localStorage.
   ═══════════════════════════════════════════ */

const NF = (() => {
  const STORAGE_KEY = 'nf_system';

  // ── Access Control Matrix (enforces selective dependency routing) ──
  const ACCESS = {
    rm:         { write: ['01','02','03','04','13','14'], read: ['01','02','03','04','12','13','14'] },
    analyst:    { write: ['05','06','07','08','09'],      read: ['01','03','04','05','06','07','08','09'] },
    researcher: { write: ['10','11','12'],                read: ['02','07','08','09','10','11','12'] }
  };

  const ARTIFACT_NAMES = {
    '01': 'Client Profile', '02': 'Risk Profile', '03': 'Financial Snapshot', '04': 'Goal Map',
    '05': 'Net Worth & Cash Flow', '06': 'Insurance Analysis', '07': 'Goal Gap Analysis',
    '08': 'Tax Optimization', '09': 'Retirement Analysis', '10': 'Asset Allocation',
    '11': 'Product Recommendations', '12': 'Comprehensive Plan',
    '13': 'Client Delivery', '14': 'Client Consent'
  };

  const ARTIFACT_AGENTS = {
    '01':'RM','02':'RM','03':'RM','04':'RM','05':'Analyst','06':'Analyst',
    '07':'Analyst','08':'Analyst','09':'Analyst','10':'Researcher','11':'Researcher',
    '12':'Researcher','13':'RM','14':'RM'
  };

  // ── Persistence ──
  // ── Persistence ──
  function _load() {
    let data;
    try { data = JSON.parse(localStorage.getItem(STORAGE_KEY)) || { clients: [], settings: {} }; }
    catch { data = { clients: [], settings: {} }; }
    if (!data.settings) data.settings = {};
    
    // Seed Anuj Sharma if no clients exist
    if (data.clients && data.clients.length === 0 && !data.settings.seeded) {
      const anuj = {
        id: 'AS-3105-1001',
        profile: {
          fname: 'Anuj',
          lname: 'Sharma',
          dob: '1993-08-15',
          gender: 'Male',
          marital: 'Married',
          city: 'Gurgaon',
          metro: 'Metro',
          pan: 'AN***82D',
          occupation: 'Salaried & Freelance',
          lifestage: 'Early-to-mid career',
          employer: 'Apex Marketing Solutions Pvt Ltd',
          designation: 'Senior Marketing Strategist',
          stability: 'Moderate',
          spouse: 'Priya Sharma',
          dependents: 2,
          depdetails: 'Spouse (Homemaker), Son Aarav (Age 5)',
          phone: '+91 98100 98100',
          email: 'anuj.sharma@apexmkt.com'
        },
        financials: {
          income: { basic: 60000, hra: 30000, special: 0, rental: 0, dividend: 0, otherinc: 30000 },
          expenses: { housing: 25000, household: 25000, education: 5000, healthcare: 0, lifestyle: 10000, loanemi: 0, inspremium: 0, otherexp: 0 },
          assets: { bank: 600000, mf: 3200000, equity: 0, epf: 0, ppf: 0, nps: 0, realestate: 0, gold: 200000, surrender: 0 },
          liabilities: { homeloan: 0, vehicleloan: 0, personalloan: 0, eduloan: 0 },
          insurance: { termlife: 0, termpremium: 0, healthsi: 500000, bundledsa: 0 }
        },
        goals: [
          { id: 'G-01', name: 'Bike Purchase', priority: 'Important', horizon: 2, costToday: 150000, inflationCat: 'lifestyle', inflRate: 0.075, earmarked: 130000, earreturn: 7.0, futureCost: 173344 },
          { id: 'G-02', name: 'Europe Vacation', priority: 'Aspirational', horizon: 2, costToday: 200000, inflationCat: 'lifestyle', inflRate: 0.075, earmarked: 170000, earreturn: 7.0, futureCost: 231125 },
          { id: 'G-03', name: 'Home Loan Downpayment', priority: 'Critical', horizon: 3, costToday: 2500000, inflationCat: 'cpi', inflRate: 0.0, earmarked: 500000, earreturn: 10.5, futureCost: 2500000 },
          { id: 'G-04', name: "Aarav's Higher Education", priority: 'Critical', horizon: 13, costToday: 2000000, inflationCat: 'education', inflRate: 0.10, earmarked: 0, earreturn: 10.5, futureCost: 6904543 },
          { id: 'G-05', name: 'Retirement Corpus', priority: 'Critical', horizon: 28, costToday: 780000, inflationCat: 'cpi', inflRate: 0.06, earmarked: 2500000, earreturn: 10.0, futureCost: 109800000 },
          { id: 'G-06', name: 'Emergency Fund', priority: 'Critical', horizon: 0, costToday: 390000, inflationCat: 'cpi', inflRate: 0.06, earmarked: 400000, earreturn: 6.0, futureCost: 390000 }
        ],
        gates: { 1: true, 2: true, 3: true, 4: true },
        gateTimestamps: {
          1: '2026-06-05T11:30:00.000Z',
          2: '2026-06-05T11:45:00.000Z',
          3: '2026-06-05T12:00:00.000Z',
          4: '2026-06-05T12:15:00.000Z'
        },
        riskAnswers: {
          0: 4, 1: 4, 2: 2, 3: 5, 4: 3, 5: 5, 6: 3,
          7: 4, 8: 4, 9: 4, 10: 4, 11: 4, 12: 5, 13: 4,
          14: 4, 15: 4, 16: 5, 17: 5, 18: 5, 19: 4
        },
        riskScore: 74,
        riskCategory: 'Moderately Aggressive',
        createdAt: '2026-06-05T11:00:00.000Z',
        updatedAt: '2026-06-05T12:15:00.000Z',
        artifacts: {}
      };

      anuj.artifacts['01'] = { id: '01', name: 'Client Profile', agent: 'RM', generatedAt: '2026-06-05T11:30:00Z', version: 1, content: `# Artifact 01: Client Profile (KYC & Demographics)

**Client ID:** AS-3105-1001  
**Date Generated:** 2026-06-05  
**Last Updated:** 2026-06-05  
**Assigned Advisor:** NeuroFi Wealth Management Team  
**Regulatory Class:** SEBI KYC Registry (Reg 19)

---

## 1. Personal & KYC Details
*   **Full Name:** Anuj Sharma
*   **Date of Birth:** 15-08-1993 (Age: 32)
*   **Gender:** Male
*   **Marital Status:** Married
*   **Permanent Account Number (PAN):** AN***82D (Masked)
*   **Residential Address:** Sector 62, Gurgaon, Haryana, India
*   **City / Metro Status:** Gurgaon (Delhi NCR) | Metro Status
*   **Life Stage:** Early-to-mid career

## 2. Family & Dependents
*   **Spouse Details:** Priya Sharma, Age 29, Homemaker
*   **Dependents Count:** 2 (Spouse, 1 Child)
*   **Dependents Breakdown:**
    *   Dependent 1: Priya Sharma, Spouse, Homemaker (No independent income)
    *   Dependent 2: Aarav Sharma, Son, Age 5, Milestones: Primary school admission completed

## 3. Professional Profile
*   **Occupation Type:** Salaried & Freelance Consultant (Dual Income streams)
*   **Employer / Firm Name:** Apex Marketing Solutions Pvt Ltd (Salaried) / Self-employed (Freelance)
*   **Designation:** Senior Marketing Strategist
*   **Employment Stability:** Moderate (Private sector and variable freelance contracts)
*   **Primary Chartered Accountant (CA):** R. K. Singhal & Associates` };

      anuj.artifacts['02'] = { id: '02', name: 'Risk Profile', agent: 'RM', generatedAt: '2026-06-05T11:30:00Z', version: 1, content: `# Artifact 02: Client Risk Profile (SEBI Reg 16 Assessment)

**Client ID:** AS-3105-1001  
**Date of Assessment:** 2026-06-05  
**Timestamp:** 11:30:00  
**Adviser ID:** INA000000000

---

## 1. Scored Questionnaire Breakdown
*   **Risk Capacity Score (A1 - A7):** 24 / 35
*   **Risk Tolerance Score (B1 - B7):** 28 / 35
*   **Risk Perception Score (C1 - C6):** 22 / 30
*   **Cumulative Score:** 74 / 100

## 2. Scored Questionnaire Responses
*   **A1 (Age 32):** Option [31 to 45 years] \`[4]\`
*   **A2 (Stability):** Option [Salaried - Established Corporate (Secure) with freelance upside] \`[4]\`
*   **A3 (Overheads):** Option [Rent + EMI consumes ~54% of income] \`[2]\`
*   **A4 (Debt-to-Asset):** Option [Zero debt] \`[5]\`
*   **A5 (Dependents):** Option [2 dependents] \`[3]\`
*   **A6 (Goal Horizon):** Option [More than 10 years for retirement/education] \`[5]\`
*   **A7 (Emergency Fund):** Option [3 to 6 months of reserves] \`[3]\`
*   **B1 (Volatility Reaction):** Option [I am completely comfortable with short-term volatility] \`[4]\`
*   **B2 (Portfolio Option):** Option [Portfolio 2: Max +18%, Worst -8%] \`[4]\`
*   **B3 (Investment Strategy):** Option [Moderate-to-high risk: 70% equity, 30% bonds] \`[4]\`
*   **B4 (Primary Objective):** Option [Steady long-term wealth accumulation with moderate growth] \`[4]\`
*   **B5 (High-volatility experience):** Option [Yes, occasionally with small allocations] \`[4]\`
*   **B6 (Lock-in Perspective):** Option [Comfortable locking in funds for 5-10 years for premium returns] \`[5]\`
*   **B7 (News downturn reaction):** Option [Maintain my systematic monthly investments (SIP) unchanged] \`[4]\`
*   **C1 (Inflation/Interest rates):** Option [Good: I understand inflation erodes real returns] \`[4]\`
*   **C2 (Guaranteed 18%):** Option [The investment must be carrying high risks; check credit rating] \`[4]\`
*   **C3 (Direct vs Regular):** Option [Thorough: Direct plans have lower expense ratios/no commissions] \`[5]\`
*   **C4 (Beat inflation):** Option [Diversified Equities / Equity Mutual Funds] \`[5]\`
*   **C5 (Diversification):** Option [Spreading assets across uncorrelated classes to lower overall risk] \`[5]\`
*   **C6 (Corporate Debt Risk):** Option [It is safer than equity, but capital is not guaranteed like bank FD] \`[4]\`

## 3. Risk Category & Allocation Bounds
*   **Assessed Risk Category:** **Moderately Aggressive**
*   **Strategic Asset Allocation Target Band:**
    *   **Equity:** 70% (Range: 65-75%)
    *   **Debt:** 20% (Range: 15-25%)
    *   **Gold / Alternatives:** 10% (Range: 5-15%)

## 4. Compliance Attestation
*   [x] Questionnaire administered in full.
*   [x] Results communicated to the Client on 2026-06-05.
*   [x] Signatures uploaded to document vault.` };

      anuj.artifacts['03'] = { id: '03', name: 'Financial Snapshot', agent: 'RM', generatedAt: '2026-06-05T11:30:00Z', version: 1, content: `# Artifact 03: Client Financial Snapshot

**Client ID:** AS-3105-1001  
**Date Generated:** 2026-06-05  
**Verification Level:** Complete (Client Provided Bank Statements & CAS)

---

## 1. Cash Inflows (Monthly)
*   **Salaried - Basic Salary:** ₹60,000
*   **Salaried - HRA:** ₹30,000
*   **Freelance Consulting / Business Inflow:** ₹30,000
*   **Total Gross Monthly Inflow (Net of TDS):** ₹1,20,000

## 2. Cash Outflows (Monthly Expenses)
*   **Housing Rent:** ₹25,000
*   **Household Expenses (Groceries, Utilities):** ₹25,000
*   **Education Fees (School Fee Monthly Equivalent):** ₹5,000
*   **Lifestyle & Discretionary Outflow:** ₹10,000
*   **Outstanding Loan EMIs:** ₹0
*   **Traditional Insurance Premiums:** ₹0
*   **Total Monthly Outflow:** ₹65,000

## 3. Statement of Assets
*   **Bank Accounts (Savings / FDs):** ₹6,00,000 (15% of Corpus)
*   **Mutual Funds (Direct Equity):** ₹32,00,000 (80% of Corpus)
*   **Sovereign Gold Bonds / Physical Gold:** ₹2,00,000 (5% of Corpus)
*   **Total Current Assets:** ₹40,00,000

## 4. Statement of Liabilities
*   **Home Loan Outstanding:** ₹0
*   **Car / Vehicle Loan Outstanding:** ₹0
*   **Personal / Credit Card Debts:** ₹0
*   **Total Liabilities:** ₹0

## 5. Existing Insurance Coverage
*   **Term Life Coverage:** ₹0 (Gap)
*   **Health Insurance (Corporate Floater):** ₹5,00,000 (Apex Marketing Solutions Employee Floater)
*   **Existing Bundled Insurance (ULIP/Endowment):** ₹0` };

      anuj.artifacts['04'] = { id: '04', name: 'Goal Map', agent: 'RM', generatedAt: '2026-06-05T11:30:00Z', version: 1, content: `# Artifact 04: Client Goal Map

**Client ID:** AS-3105-1001  
**Date Generated:** 2026-06-05  

---

## 1. Structured Goals Inventory

| Goal ID | Goal Name | Priority (Critical / Important / Aspirational) | Time Horizon (Years) | Cost in Today's Value (₹) | Inflation Category (CPI / Edu / Health / Life) | Funding Status | Flexibility |
|---|---|---|---|---|---|---|---|
| **G-01** | Bike Purchase | Important | 2 | ₹1,50,000 | Lifestyle (7.5%) | Not Started | Negotiable (+/- 6 months) |
| **G-02** | 10Y Europe Vacation | Aspirational | 2 | ₹2,00,000 | Lifestyle (7.5%) | Not Started | Negotiable |
| **G-03** | Home Loan Downpayment | Critical | 3 | ₹25,00,000 | Nominal (0%) | Partially Funded | Non-Negotiable |
| **G-04** | Aarav's Higher Education | Critical | 13 | ₹20,00,000 | Education (10.0%) | Not Started | Non-Negotiable |
| **G-05** | Retirement Corpus | Critical | 28 | ₹65,000 / month | CPI (6.0%) | Partially Funded | Non-Negotiable |
| **G-06** | Emergency Fund | Critical | Immediate | ₹3,90,000 | CPI (6.0%) | Fully Funded | Non-Negotiable |

## 2. Earmarked Portfolio Mapping
*   **G-06 (Emergency Fund):** ₹4,00,000 earmarked in Bank Fixed Deposits.
*   **G-01 & G-02 (Bike & Vacation):** ₹3,00,000 earmarked from rebalanced Bank Fixed Deposits.
*   **G-03 (Home Downpayment):** ₹5,00,000 earmarked from rebalanced Equity Mutual Funds.
*   **G-05 (Retirement):** ₹21,00,000 remaining Equity Mutual Funds and ₹4,00,000 Gold earmarked for long-term compound growth.` };

      anuj.artifacts['05'] = { id: '05', name: 'Net Worth & Cash Flow', agent: 'Analyst', generatedAt: '2026-06-05T11:45:00Z', version: 1, content: `# Artifact 05: Net Worth & Cash Flow Modeling

**Client ID:** AS-3105-1001  
**Date Generated:** 2026-06-05  
**Verification Level:** Complete

---

## 1. Net Worth Statement

| Asset Category | Asset Description | Current Value (₹) | Allocation (%) |
|---|---|---|---|
| **Liquid Assets** | Savings Account / FDs | ₹6,00,000 | 15.00% |
| **Growth Assets** | Direct Equity Mutual Funds | ₹32,00,000 | 80.00% |
| **Defensive Assets** | Physical Gold / SGBs | ₹2,00,000 | 5.00% |
| **Total Assets (A)** | | **₹40,00,000** | **100.00%** |
| **Liabilities (B)** | Nil | **₹0** | **0.00%** |
| **Net Worth (A - B)** | | **₹40,00,000** | |

---

## 2. Cash Flow & Surplus Statement

| Cash Inflow Category | Monthly Value (₹) | Cash Outflow Category | Monthly Value (₹) |
|---|---|---|---|
| Basic Salary (Net) | ₹60,000 | Housing Rent | ₹25,000 |
| HRA (Net) | ₹30,000 | Household Expenses | ₹25,000 |
| Freelance Consulting | ₹30,000 | School Fee Equivalent | ₹5,000 |
| | | Lifestyle & Discretionary | ₹10,000 |
| | | Loan EMIs | ₹0 |
| **Total Income** | **₹1,20,000** | **Total Outflows** | **₹65,000** |
| **Net Monthly Surplus** | **₹55,000** | | |

*   **Savings Rate:** **45.83%** (Net Monthly Surplus / Total Income)
*   **Debt Service Ratio:** **0.00%** (Total Loan EMIs / Total Income)

---

## 3. Emergency Fund Analysis

*   **Essential Monthly Expenses:** ₹55,000 (Rent ₹25k + Household ₹25k + School Fee ₹5k)
*   **Target Emergency Fund (6 Months of Essential Expenses):** **₹3,30,000**
*   **Fiduciary Buffer Target (Rounded up):** **₹3,90,000**
*   **Current Liquid Assets:** ₹6,00,000 (Held in Bank FDs)
*   **Emergency Fund Gap:** **₹0** (Fully Funded)
*   **Fiduciary Recommendation:** Earmark ₹4,00,000 out of the existing ₹6,00,000 FD strictly as "Emergency Reserves" in a high-interest sweep account.` };

      anuj.artifacts['06'] = { id: '06', name: 'Insurance Analysis', agent: 'Analyst', generatedAt: '2026-06-05T11:45:00Z', version: 1, content: `# Artifact 06: Insurance & HLV GAP Modeling

**Client ID:** AS-3105-1001  
**Date Generated:** 2026-06-05  

---

## 1. Human Life Value (HLV) Calculation

The HLV computes the financial replacement value of the client’s future earnings for his family, discounted at the sovereign risk-free rate of **7.05%** (India 10-Year G-Sec yield).

| Parameter | Value | Details |
|---|---|---|
| Monthly Net Inflow ($Y_{active}$) | ₹1,20,000 | In-hand monthly income |
| Personal Consumption ($E_{personal}$) | ₹36,000 | Assumed at 30% of net monthly income |
| Monthly Family Contribution | ₹84,000 | Net replacement requirement |
| Annual Family Contribution ($Y_{net\_annual}$) | ₹10,08,000 | Monthly contribution × 12 |
| Years to Retirement ($N_{ret}$) | 28 | Retiring at 60 (Current age: 32) |
| Sovereign Discount Rate ($R_f$) | 7.05% | Sovereign G-Sec Yield |
| **Capitalized HLV (Present Value)** | **₹1,21,63,536** | Discounted replacement value |
| Future Liabilities (Expected Home Loan) | ₹50,00,000 | Required coverage for planned 3Y debt |
| **Total Insurance Requirement** | **₹1,71,63,536** | Sum of HLV and future debt liability |
| **Fiduciary Recommended Cover** | **₹2,50,00,000** | Rounded up to secure family buffers |

---

## 2. Life Insurance Gap Analysis

*   **Existing Term Cover ($C_{existing}$):** ₹0
*   **Existing Endowment / ULIP Cover:** ₹0
*   **Total Recommended Term Insurance:** **₹2,50,00,000**
*   **Net Life Insurance Gap:** **₹2,50,00,000**
*   **Action Step:** Purchase a pure, unbundled Term Life policy for ₹2.5 Crores immediately.

---

## 3. Health Insurance Gap Analysis

*   **Residential Location Status:** Gurgaon (Delhi NCR - Metro Area)
*   **Base Family Floater Target:** **₹10,00,000** (Fiduciary standard for metro areas)
*   **Super Top-up Target:** **₹15,00,000** (with a ₹10,00,000 deductible)
*   **Existing Health Cover (Corporate):** ₹5,00,000 (Provided by employer - vulnerable to job transition risk)
*   **Existing Health Cover (Personal):** ₹0
*   **Net Health Insurance Gap:** **₹10,00,000 Base Floater**
*   **Action Step:** Purchase a personal, independent Family Floater of ₹10 Lakhs with a Super Top-up of ₹15 Lakhs. Do not rely solely on corporate insurance.

---

## 4. Cost-Benefit Analysis of Bundled Policies
*   **Status:** Anuj Sharma holds **no active endowment, money-back, or ULIP policies**. No unbundling calculations required.` };

      anuj.artifacts['07'] = { id: '07', name: 'Goal Gap Analysis', agent: 'Analyst', generatedAt: '2026-06-05T11:45:00Z', version: 1, content: `# Artifact 07: Goal Gap Compounding & Discounting

**Client ID:** AS-3105-1001  
**Date Generated:** 2026-06-05  

---

## 1. Goal Gap Calculation Ledger

All calculations are executed deterministically using base rates from \`reference/base_rates.md\`.

| Goal ID | Goal Name | Years ($N$) | Cost Today (₹) | Inflation ($Inf$) | Future Target ($FV_{goal}$) | Earmarked Assets | Expected Asset Return | Earmarked Asset FV ($FV_{assets}$) | Net Goal Gap ($G_{gap}$) | Recommended Monthly SIP (₹) |
|---|---|---|---|---|---|---|---|---|---|---|
| **G-01** | Bike Purchase | 2 | ₹1,50,000 | 7.50% | ₹1,73,344 | ₹1,30,000 | 7.00% | ₹1,48,837 | ₹24,507 | **₹959** |
| **G-02** | Europe Vacation | 2 | ₹2,00,000 | 7.50% | ₹2,31,125 | ₹1,70,000 | 7.00% | ₹1,94,633 | ₹36,492 | **₹1,427** |
| **G-03** | Home Downpayment| 3 | ₹25,00,000 | 0.00% | ₹25,00,000 | ₹5,00,000 | 10.50% | ₹6,74,606 | ₹18,25,394 | **₹46,128** |
| **G-04** | Aarav's Education | 13 | ₹20,00,000 | 10.00% | ₹69,04,543 | ₹0 | 10.50% | ₹0 | ₹69,04,543 | **₹20,727** * |
| **G-05** | Retirement Corpus| 28 | ₹7,80,000 | 6.00% | ₹10,98,00,000 | ₹25,00,000 | 10.00% | ₹3,60,51,008 | ₹7,37,48,992 | **₹22,971** * |

---

## 2. Surplus Cash Flow Matching & Flags

*   **Total Available Monthly Surplus:** **₹55,000**
*   **Active Recommended SIPs (Years 1 to 3):**
    *   *Bike & Vacation Goals SIP:* **₹2,500 / month**
    *   *Home Loan Downpayment SIP:* **₹47,000 / month**
    *   *Buffer / Cash Surplus:* **₹5,500 / month**
    *   **Total Active Saving: ₹55,000 / month** (Status: **100% UTILISED**)
*   > [!IMPORTANT]
    > **Advisory Flag (Deferred Savings Strategy)**:
    > The required monthly SIPs for Aarav's Education (₹20,727) and Retirement (₹22,971) cannot be funded from the current monthly surplus during the first 3 years without compromising the home downpayment goal.
    > 
    > **Fiduciary Solution**:
    > *   **Years 1–3**: Maximize Home Downpayment and Short-term goals. Earmark the remaining ₹25.0 Lakhs corpus to compound quietly in the background.
    > *   **Year 4 onwards**: Upon completion of G-01, G-02, and G-03, the monthly SIP of ₹47,000 is completely freed. Redirect **₹20,727/month** to Aarav's Education and the remaining **₹29,273/month** to Retirement.` };

      anuj.artifacts['08'] = { id: '08', name: 'Tax Optimization', agent: 'Analyst', generatedAt: '2026-06-05T11:45:00Z', version: 1, content: `# Artifact 08: Tax Optimization Report

**Client ID:** AS-3105-1001  
**Date Generated:** 2026-06-05  

---

## 1. Dual Tax Regime Side-by-Side Analysis

Calculations are modeled for a Gross Annual Salary equivalent of **₹16,00,000**.

| Income & Deduction Head | Old Tax Regime (₹) | New Tax Regime (₹) | Notes / Details |
|---|---|---|---|
| **Gross Salary** | **₹16,00,000** | **₹16,00,000** | Net in-hand + standard deductions |
| Standard Deduction | (₹50,000) | (₹75,000) | FY 2025-26 Standard Limits |
| House Rent Allowance (HRA) Exemption | (₹2,20,000) | Not Allowed | Rent paid minus 10% of Basic (Gurgaon Metro) |
| Section 80C | (₹1,50,000) | Not Allowed | EPF/PPF/ELSS (Fully utilized in Old) |
| Section 80D | (₹25,000) | Not Allowed | Health Insurance Premium |
| Section 24(b) (Home Loan Interest) | ₹0 | Not Allowed | Currently no home loan outstanding |
| **Taxable Income** | **₹11,55,000** | **₹15,25,000** | Net taxable income base |
| **Calculated Base Tax** | **₹1,59,000** | **₹1,08,750** | Computed using slab rates |
| Health & Education Cess (4%) | ₹6,360 | ₹4,350 | Standard Cess surcharge |
| **Total Net Tax Liability** | **₹1,65,360** | **₹1,13,100** | |
| **Annual Tax Savings (New Regime)** | | **₹52,260** | **₹4,355 / month added liquidity** |

---

## 2. Calculation Rationale & Specific Exemption Rules

*   **HRA Exemption Formula (Old Regime only):**
    *   *Basic Salary*: ₹8,00,000 p.a. (Assumed 50% of Gross)
    *   *Actual Rent Paid*: ₹3,00,000 p.a. (₹25,000/month)
    *   *Exemption Value*: \$\min(\\text{Actual HRA Received (₹3,60,000)}, \\text{Rent Paid} - 10\\% \\text{ of Basic (₹3,00,000 - ₹80,000 = ₹2,20,000)}, \\text{Metro Cap (₹4,00,000)})\$ = **₹2,20,000**.
*   **New Regime Slab Compounding:**
    *   Up to ₹4,00,000: **Nil**
    *   ₹4,00,001 to ₹8,00,000: **₹20,000** (5%)
    *   ₹8,00,001 to ₹12,00,000: **₹40,000** (10%)
    *   ₹12,00,001 to ₹15,25,000: **₹48,750** (15% on ₹3,25,000)
    *   *Total base tax*: **₹1,08,750** + 4% Cess = **₹1,13,100**.

---

## 3. Fiduciary Recommendation & Action Steps

*   **Recommendation:** Opt for the **New Tax Regime** (Section 115BAC). It delivers a definitive benefit of **₹52,260 p.a.** over the Old Regime, even assuming full deductions.
*   **Employer Declaration:** File the declaration form with the employer to continue TDS under the New Tax Regime.` };

      anuj.artifacts['09'] = { id: '09', name: 'Retirement Analysis', agent: 'Analyst', generatedAt: '2026-06-05T11:45:00Z', version: 1, content: `# Artifact 09: Retirement Accumulation & SWP Depletion

**Client ID:** AS-3105-1001  
**Date Generated:** 2026-06-05  

---

## 1. Retirement Corpus Requirements (Nominal Values)

| Planning Parameter | Value | Details / Formulas |
|---|---|---|
| Current Age | 32 | |
| Target Retirement Age | 60 | |
| Accumulation Phase ($N_{acc}$) | 28 Years | Age 60 minus Age 32 |
| Life Expectancy ($Life_{exp}$) | 85 Years | Standard planning limit |
| Distribution Phase ($N_{dist}$) | 25 Years | Age 85 minus Age 60 |
| Current Monthly Expense Target | ₹65,000 | In today's purchasing power |
| CPI Inflation Rate ($Inf_{cpi}$) | 6.00% | Long-term CPI anchor |
| **First Year Retirement Expense** | **₹39,87,113** | ₹65,000 × 12 × $(1.06)^{28}$ |
| Post-Retirement Portfolio Return | 7.50% | Conservative balanced hybrid asset mix |
| Post-Retirement Real Return ($r_{real}$)| 1.415% | $\\frac{1 + 0.075}{1 + 0.06} - 1$ |
| **Baseline Required Corpus** | **₹8,45,26,795** | Inflation-adjusted annuity value for 25 years |
| **Fiduciary Target Corpus (Buffered)**| **₹10,98,00,000**| Targeted corpus incorporating a ₹2.53Cr buffer |

---

## 2. Retirement Gap & Accumulation Plan

*   **Earmarked Current Assets for Retirement:**
    *   *Equity Base*: ₹21,00,000
    *   *Gold Base*: ₹4,00,000
    *   *Total Starting Base*: **₹25,00,000**
*   **Projected Future Value of Earmarked Base (in 28 Years):**
    *   Weighted compounding rate of **10.00% p.a.**:
    *   $FV_{base} = 25,00,000 \\times (1.10)^{28} = \\mathbf{₹3,60,51,008}$
*   **Corpus Shortfall (Target minus Base FV):**
    *   ₹10,98,00,000 - ₹3,60,51,008 = **₹7,37,48,992**
*   **Fiduciary SIP Funding Strategy:**
    *   *Years 1 to 3*: SIP is deferred (₹0 allocated to retirement).
    *   *Years 4 to 28 (25 Years)*: Initiate a monthly Equity SIP of **₹50,000/month**.
    *   *Projected Value of Year 4–28 SIP* (compounding at 10.50% p.a. in Equity):
    *   $FV_{SIP} = \\mathbf{₹7,38,00,000}$
    *   **Total Retirement Corpus at Age 60: ₹10.98 Crores (Target Fully Met!)**

---

## 3. Sustainable Post-Retirement SWP Timeline

*   **Age 60 (Year 1)**: Starting Corpus: ₹10.98 Crore | Withdrawal: ₹39.87 Lakhs | Closing: ₹11.33 Crore
*   **Age 65 (Year 6)**: Starting Corpus: ₹12.98 Crore | Withdrawal: ₹53.36 Lakhs | Closing: ₹13.33 Crore
*   **Age 70 (Year 11)**: Starting Corpus: ₹14.50 Crore | Withdrawal: ₹71.41 Lakhs | Closing: ₹14.75 Crore
*   **Age 75 (Year 16)**: Starting Corpus: ₹14.86 Crore | Withdrawal: ₹95.56 Lakhs | Closing: ₹14.85 Crore
*   **Age 80 (Year 21)**: Starting Corpus: ₹13.15 Crore | Withdrawal: ₹1.27 Crore | Closing: ₹12.63 Crore
*   **Age 85 (Year 26 - Final Year)**: Starting Corpus: ₹4.91 Crore | Withdrawal: ₹1.71 Crore | Closing Surplus: **₹3.28 Crore (Legacy Margin)**` };

      anuj.artifacts['10'] = { id: '10', name: 'Asset Allocation', agent: 'Researcher', generatedAt: '2026-06-05T12:00:00Z', version: 1, content: `# Artifact 10: Strategic Asset Allocation

**Client ID:** AS-3105-1001  
**Date Generated:** 2026-06-05  

---

## 1. Macro Strategic Asset Allocation Targets

Based on the risk profile score of **74 (Moderately Aggressive)**, the strategic asset allocation framework defines the following target bands:

| Asset Class | Target Weight (%) | Tactical Range (%) | Allocation Purpose |
|---|---|---|---|
| **Equity** | **70.00%** | 65.00% – 75.00% | Long-term capital growth and compounding |
| **Debt** | **20.00%** | 15.00% – 25.00% | Capital preservation, emergency buffer, and liquidity |
| **Gold** | **10.00%** | 5.00% – 15.00% | Defensive systemic hedge and inflation offset |
| **Total** | **100.00%** | | |

---

## 2. Current vs. Target Rebalancing Guide

| Asset Class | Current Value (₹) | Current Weight | Target Weight | Required Shift (₹) | Target Rebalanced Value (₹) |
|---|---|---|---|---|---|
| **Equity** | ₹32,00,000 | 80.00% | 70.00% | **(₹6,00,000)** | ₹26,00,000 (65.00%) * |
| **Debt** | ₹6,00,000 | 15.00% | 20.00% | **+₹4,00,000** | ₹10,00,000 (25.00%) * |
| **Gold** | ₹2,00,000 | 5.00% | 10.00% | **+₹2,00,000** | ₹4,00,000 (10.00%) |
| **Total** | **₹40,00,000** | **100.00%** | **100.00%** | **₹0** | **₹40,00,000** |

*   *Tactical Deviation Note:* The rebalanced allocation sets Debt at 25% and Equity at 65%. This slight deviation is structurally necessary because ₹10.0 Lakhs in Debt is required to secure the ₹4.0 Lakh Emergency Fund and the ₹4.04 Lakh short-term goals.

---

## 3. Horizon-Based Earmarked Goal Buckets

### A. Short-Term Horizon Bucket (<3 Years) — 100% Debt/Liquid
*   **Goals Funded:** Emergency Fund (₹4.0L), Bike Purchase (₹1.73L in 2Y), Europe Vacation (₹2.31L in 2Y).
*   **Asset Allocation:** ₹10,00,000 in Liquid & Short-Term Banking Debt Funds.

### B. Medium-Term Horizon Bucket (3–7 Years) — Conservative Growth
*   **Goals Funded:** Home Loan Downpayment (₹25.0L in 3Y).
*   **Asset Allocation:** ₹5,00,000 from current Equity + ₹47,000/month SIP in low-volatility Arbitrage Funds.

### C. Long-Term Horizon Bucket (>7 Years) — Growth-Heavy
*   **Goals Funded:** Aarav's Education (in 13Y), Retirement (in 28Y).
*   **Asset Allocation:** ₹21,00,000 in Equity (Flexi-Cap & Index) + ₹4,00,000 in Sovereign Gold Bonds.` };

      anuj.artifacts['11'] = { id: '11', name: 'Product Recommendations', agent: 'Researcher', generatedAt: '2026-06-05T12:00:00Z', version: 1, content: `# Artifact 11: Product Recommendations & Curation

**Client ID:** AS-3105-1001  
**Date Generated:** 2026-06-05  

---

## 1. Curated Investment Product Shortlist (Direct Plans Only)

### 1.1 Equity Mutual Funds (Core & Satellite)
*   **Core Passive (Large)**: **UTI Nifty 50 Index Fund - Direct Growth** (Expense: 0.20%)
*   **Core Active (Flexi)**: **Parag Parikh Flexi Cap Fund - Direct Growth** (Expense: 0.62%)

### 1.2 Debt, Arbitrage & Liquid Funds
*   **Emergency Fund Parking**: **ICICI Prudential Liquid Fund - Direct Growth** (Expense: 0.25%)
*   **Short-Term Goal SIP**: **SBI Banking & PSU Debt Fund - Direct Growth** (Expense: 0.32%)
*   **Medium-Term Home SIP**: **ICICI Prudential Arbitrage Fund - Direct Growth** (Expense: 0.35%)

### 1.3 Sovereign & Gold Schemes
*   **Sovereign Gold Bonds (SGB)**: Secondary market purchase or fresh tranches.
*   **Public Provident Fund (PPF)**: Core tax-free safe debt compounding.

---

## 2. SEBI Regulation 17 Suitability Rationale Ledger

*   **Parag Parikh Flexi Cap & UTI Nifty 50 Index**: Fits Anuj’s Moderately Aggressive profile and 28-year retirement horizon.
*   **ICICI Pru Liquid & SBI Banking & PSU Debt**: Provides capital preservation for emergency reserves and short-term goals.
*   **ICICI Pru Arbitrage**: Low-volatility cash-futures spreads taxed as Equity, offering a massive tax shield for the 3-year Home Goal.
*   **Sovereign Gold Bonds**: RBI backing and tax-exempt capital gains at 8-year maturity.` };

      anuj.artifacts['12'] = { id: '12', name: 'Comprehensive Plan', agent: 'Researcher', generatedAt: '2026-06-05T12:00:00Z', version: 1, content: `# Artifact 12: Comprehensive Financial Advisory Plan

**Client ID:** AS-3105-1001  
**Plan Date:** June 5, 2026  
**Advisory Firm:** NeuroFi Wealth Management  
**License Details:** SEBI Registered Investment Adviser (Reg No: INA000000000)

---

## 1. Cover & Executive Summary
Comprehensive financial blueprint designed for **Anuj Sharma** (32), spouse (homemaker), and child (5). Targets rebalanced assets, solves ₹29.04 Lakhs short-term goals, and targets a retirement corpus of **₹10.98 Crores**.

## 2. Client Profile & Risk Assessment Summary
*   **Risk Profile**: Moderately Aggressive (Score: 74)
*   **Target Asset Allocation**: 70% Equity | 20% Debt | 10% Gold

## 3. Current Financial Position
*   **Assets**: ₹40,00,000 | **Liabilities**: ₹0 | **Net Worth**: ₹40,00,000
*   **In-hand Income**: ₹1,20,000/mo | **Expenses**: ₹65,000/mo | **Surplus**: ₹55,000/mo

## 4. Insurance & Risk Mitigation Plan
*   *Life Cover Gap*: ₹2.5 Crore term policy required.
*   *Health Cover Gap*: ₹10 Lakh family floater + ₹15 Lakh Super Top-up.

## 5. Goal Funding & Compounding Roadmap
*   *Emergency Fund (₹3.9L)*: Earmarked from Bank FDs.
*   *Bike & Vacation (₹4.04L in 2Y)*: Earmark ₹3L FDs + ₹2,500/mo SIP.
*   *Home Loan Downpayment (₹25L in 3Y)*: Earmark ₹5L Equity + ₹47,000/mo Arbitrage SIP.
*   *Retirement & Education*: Earmark ₹25L base. Initiate ₹50,000/mo SIP in Year 4.

## 6. Tax Optimization Plan
Adopt the **New Tax Regime** (Section 115BAC), saving **₹52,260 p.a.** over the Old Regime.

## 7. Retirement Strategy & SWP Timeline
Protected ₹25L compounds to ₹3.6Cr. Year 4 SIP adds ₹7.38Cr. Total: ₹10.98Cr. Sustains inflation-adjusted withdrawals till age 85, leaving a ₹3.28Cr legacy surplus.

## 8. Asset Allocation & Product Selection
UTI Nifty 50 Direct, Parag Parikh Flexi Cap Direct, ICICI Arbitrage Direct, ICICI Liquid Direct, SBI Banking & PSU Direct, and Sovereign Gold Bonds (SGB).` };

      anuj.artifacts['13'] = { id: '13', name: 'Client Delivery', agent: 'RM', generatedAt: '2026-06-05T12:15:00Z', version: 1, content: `# Artifact 13: Client Delivery Briefing & Roadmap

**Client ID:** AS-3105-1001  
**Date of Delivery:** 2026-06-05  
**Adviser License:** INA000000000

---

## 1. Executive Reconciliation Summary
*   **Monthly Income**: ₹1,20,000 | **Living Expenses**: ₹65,000
*   **Active Savings (Y1-3)**: ₹49,500/month (Home + Short-term SIPs)
*   **Cash Flow Buffer**: ₹5,500/month

## 2. Immediate Implementation Roadmap
1.  **Term Life Cover**: Setup ₹2.5 Crore pure term life insurance.
2.  **Health Insurance**: Setup ₹10L Family Floater + ₹15L Top-up.
3.  **Rebalance Assets**: Move ₹6L from Equity to Debt (₹4L) & SGBs (₹2L).
4.  **Emergency sweep**: Lock ₹4 Lakhs FD as Emergency Reserve.
5.  **SIP Launch**: Start ₹47,000/mo Arbitrage SIP and ₹2,500/mo Banking Debt SIP.

## 3. Review Schedule
*   **Frequency**: Semi-annual. Next review: 05-12-2026.` };

      anuj.artifacts['14'] = { id: '14', name: 'Client Consent', agent: 'RM', generatedAt: '2026-06-05T12:15:00Z', version: 1, content: `# Artifact 14: Client Consent & Decision Record

**Client ID:** AS-3105-1001  
**Plan Date Reference:** 2026-06-05  
**Regulatory Standard:** SEBI RIA Regulation 17 (Fiduciary Informed Consent)

---

## 1. Recommendations Presented vs. Client Decisions
*   **Life Insurance (₹2.5Cr term)**: **Accepted**
*   **Health Insurance (₹10L+15L)**: **Accepted**
*   **Asset Allocation Rebalancing**: **Accepted**
*   **Home Downpayment Plan**: **Accepted**
*   **Retirement & Education Deferral**: **Accepted**
*   **New Tax Regime Choice**: **Accepted**

---

## 2. Execution Signatures
*   *Client*: Anuj Sharma (Signed 2026-06-05)
*   *Adviser*: NeuroFi Wealth Team (Signed 2026-06-05)` };

      data.clients.push(anuj);
    }
    
    if (!data.clients.find(c => c.id === 'VM-1510-2002')) {
      const vikram = _getVikramSeed();
      data.clients.push(vikram);
    }

    data.settings.seeded = true;
    _save(data);
    return data;
  }
  function _save(data) { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); }

  // ── Client CRUD ──
  function getClients() { return _load().clients; }

  function getClient(id) { return _load().clients.find(c => c.id === id) || null; }

  function deleteClient(id) {
    const data = _load();
    const idx = data.clients.findIndex(c => c.id === id);
    if (idx === -1) return false;
    data.clients.splice(idx, 1);
    if (data.clients.length > 0) {
      if (localStorage.getItem('nf_active_client') === id) {
        localStorage.setItem('nf_active_client', data.clients[0].id);
      }
    } else {
      localStorage.removeItem('nf_active_client');
    }
    _save(data);
    return true;
  }

  function createClient(profile) {
    const data = _load();
    const fi = (profile.fname[0] || 'X').toUpperCase();
    const li = (profile.lname[0] || 'X').toUpperCase();
    const d = new Date(profile.dob);
    const dd = String(d.getDate()).padStart(2, '0');
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const rand = String(Math.floor(1000 + Math.random() * 9000));
    const id = `${fi}${li}-${dd}${mm}-${rand}`;
    const client = {
      id,
      profile,
      artifacts: {},
      gates: { 1: false, 2: false, 3: false, 4: false },
      gateTimestamps: {},
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    data.clients.push(client);
    _save(data);
    return client;
  }

  function updateClient(id, updater) {
    const data = _load();
    const idx = data.clients.findIndex(c => c.id === id);
    if (idx === -1) return null;
    if (typeof updater === 'function') updater(data.clients[idx]);
    else Object.assign(data.clients[idx], updater);
    data.clients[idx].updatedAt = new Date().toISOString();
    _save(data);
    return data.clients[idx];
  }

  // ── Artifact Management ──
  // Gate prerequisites: which gate must be passed before an artifact can be written
  const ARTIFACT_GATE_REQ = {
    '01': 0, '02': 0, '03': 0, '04': 0,  // RM Phase 1 — no gate prerequisite
    '05': 1, '06': 1, '07': 1, '08': 1, '09': 1,  // Analyst — requires Gate 1
    '10': 2, '11': 2, '12': 2,  // Researcher — requires Gate 2
    '13': 3, '14': 3   // RM Phase 2 — requires Gate 3
  };

  function setArtifact(clientId, artifactId, mdContent, portal) {
    if (portal && !ACCESS[portal].write.includes(artifactId)) {
      console.error(`[ACCESS DENIED] ${portal} cannot write artifact ${artifactId}`);
      return false;
    }
    // Gate prerequisite enforcement
    const requiredGate = ARTIFACT_GATE_REQ[artifactId] || 0;
    if (requiredGate > 0 && !isGatePassed(clientId, requiredGate)) {
      console.error(`[GATE BLOCK] Artifact ${artifactId} requires Gate ${requiredGate} to be passed first.`);
      toast(`Cannot save Artifact ${artifactId}: Gate ${requiredGate} must be approved first.`, 'error');
      return false;
    }
    return updateClient(clientId, c => {
      c.artifacts[artifactId] = {
        id: artifactId,
        name: ARTIFACT_NAMES[artifactId],
        agent: ARTIFACT_AGENTS[artifactId],
        content: mdContent,
        generatedAt: new Date().toISOString(),
        version: (c.artifacts[artifactId]?.version || 0) + 1
      };
    });
  }

  function getArtifact(clientId, artifactId, portal) {
    if (portal && !ACCESS[portal].read.includes(artifactId)) return null; // enforced
    const client = getClient(clientId);
    return client?.artifacts?.[artifactId] || null;
  }

  function getReadableArtifacts(clientId, portal) {
    const client = getClient(clientId);
    if (!client) return [];
    return ACCESS[portal].read
      .filter(id => client.artifacts[id])
      .map(id => client.artifacts[id]);
  }

  // ── Gate Management ──
  function getGateStatus(clientId) {
    const client = getClient(clientId);
    return client?.gates || { 1: false, 2: false, 3: false, 4: false };
  }

  function passGate(clientId, gateNum) {
    // Sequential enforcement: gate N requires gate N-1
    if (gateNum > 1 && !isGatePassed(clientId, gateNum - 1)) {
      console.error(`[GATE BLOCK] Gate ${gateNum} requires Gate ${gateNum - 1} to be passed first.`);
      toast(`Cannot pass Gate ${gateNum}: Gate ${gateNum - 1} must be approved first.`, 'error');
      return false;
    }
    return updateClient(clientId, c => {
      c.gates[gateNum] = true;
      c.gateTimestamps[gateNum] = new Date().toISOString();
    });
  }

  function isGatePassed(clientId, gateNum) {
    return getGateStatus(clientId)[gateNum] === true;
  }

  // ── Client Selector (shared across portals) ──
  function getActiveClientId() { return localStorage.getItem('nf_active_client'); }
  function setActiveClientId(id) { localStorage.setItem('nf_active_client', id); }

  // ── Formatting Utilities ──
  function fmt(n) { return '₹' + Number(n || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 }); }
  function pct(n) { return (n || 0).toFixed(1) + '%'; }
  function fmtDate(iso) {
    if (!iso) return '—';
    return new Date(iso).toLocaleString('en-IN', {
      day:'2-digit', month:'short', year:'numeric', hour:'2-digit', minute:'2-digit', hour12:true
    });
  }

  // ── Toast Notifications ──
  function toast(msg, type = 'info') {
    let container = document.getElementById('toast-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'toast-container';
      container.style.cssText = 'position:fixed;top:20px;right:20px;z-index:9999;display:flex;flex-direction:column;gap:8px;';
      document.body.appendChild(container);
    }
    const el = document.createElement('div');
    el.className = `toast ${type}`;
    el.textContent = msg;
    container.appendChild(el);
    setTimeout(() => { el.style.opacity = '0'; setTimeout(() => el.remove(), 300); }, 3500);
  }

  // ── Risk Questionnaire Data ──
  const RISK_QUESTIONS = [
    {dim:'capacity',code:'A1',text:'What is your current age?',opts:[['Under 30',5],['31–45',4],['46–55',3],['56–65',2],['65+',1]]},
    {dim:'capacity',code:'A2',text:'Primary income stability?',opts:[['Govt/PSU salaried',5],['Corporate salaried',4],['Stable self-employed',3],['Startup/contract',2],['Commission/seasonal',1]]},
    {dim:'capacity',code:'A3',text:'% of income going to fixed costs (Rent, EMI, Bills)?',opts:[['<20%',5],['21–35%',4],['36–50%',3],['51–65%',2],['>65%',1]]},
    {dim:'capacity',code:'A4',text:'Debt-to-asset ratio?',opts:[['Zero debt',5],['<10%',4],['11–30%',3],['31–50%',2],['>50%',1]]},
    {dim:'capacity',code:'A5',text:'Number of financial dependents?',opts:[['None',5],['1',4],['2',3],['3',2],['4+',1]]},
    {dim:'capacity',code:'A6',text:'Time horizon for primary goal?',opts:[['>10 years',5],['7–10 years',4],['4–7 years',3],['1–3 years',2],['<1 year',1]]},
    {dim:'capacity',code:'A7',text:'Emergency fund coverage (months)?',opts:[['>9 months',5],['6–9 months',4],['3–6 months',3],['<3 months',2],['None',1]]},
    {dim:'tolerance',code:'B1',text:'Reaction to a sudden 15% portfolio drop?',opts:[['Buy more',5],['Comfortable',4],['Hold but worried',3],['Move to debt',2],['Panic sell',1]]},
    {dim:'tolerance',code:'B2',text:'Preferred 5-year portfolio profile?',opts:[['Max +25%, worst -15%',5],['Max +18%, worst -8%',4],['Max +12%, worst -2%',3],['Max +8%, worst +2%',2],['Max +6%, worst +4%',1]]},
    {dim:'tolerance',code:'B3',text:'₹10L investment strategy preference?',opts:[['100% mid/small cap',5],['70% equity, 30% bonds',4],['50/50 blue-chip & FD',3],['20% index, 80% govt',2],['100% FD & liquid',1]]},
    {dim:'tolerance',code:'B4',text:'Primary investment objective?',opts:[['Max capital growth',5],['Steady long-term',4],['Balanced growth+income',3],['Preserve + inflation',2],['Zero loss',1]]},
    {dim:'tolerance',code:'B5',text:'Experience with volatile assets (crypto, options)?',opts:[['Frequent, large sums',5],['Occasional, small',4],['Only MFs/index',3],['Only FD/PPF',2],['Actively avoid',1]]},
    {dim:'tolerance',code:'B6',text:'Comfort with lock-in periods?',opts:[['5–10 year lock-in OK',5],['Mix liquid + locked',4],['Up to 3yr for tax',3],['Dislike >1yr',2],['Need 100% access',1]]},
    {dim:'tolerance',code:'B7',text:'Instinct when markets warn of downturn?',opts:[['Look for bargains',5],['Continue SIPs',4],['Pause equity',3],['Redeem to cash',2],['Sell everything',1]]},
    {dim:'perception',code:'C1',text:'Understanding of inflation vs. returns?',opts:[['Excellent',5],['Good',4],['Basic',3],['Poor',2],['None',1]]},
    {dim:'perception',code:'C2',text:'Reaction to "guaranteed 18% annual return"?',opts:[['Likely fraudulent',5],['Extreme risk',4],['Sounds great',3],['Invest heavily',2],['Completely safe',1]]},
    {dim:'perception',code:'C3',text:'Familiarity with Direct vs Regular MFs?',opts:[['Thorough',5],['Moderate',4],['Basic',3],['Thought identical',2],['None',1]]},
    {dim:'perception',code:'C4',text:'Best asset to beat inflation over 10 years?',opts:[['Equity MFs',5],['Gold',4],['Real estate',3],['FDs/debt',2],['PPF/insurance',1]]},
    {dim:'perception',code:'C5',text:'Understanding of diversification?',opts:[['Across uncorrelated classes',5],['Many different MFs',4],['Across banks',3],['Different branches',2],['Single best asset',1]]},
    {dim:'perception',code:'C6',text:'View of corporate debt fund risk?',opts:[['Has interest+credit risk',5],['Safer than equity, not guaranteed',4],['Same as bank FD',3],['Risk-free',2],["Don't understand",1]]}
  ];

  function scoreToCategory(score) {
    if (score <= 39) return { cat: 'Conservative', eq: 15, debt: 75, gold: 10, color: '#06b6d4' };
    if (score <= 54) return { cat: 'Moderately Conservative', eq: 35, debt: 55, gold: 10, color: '#10b981' };
    if (score <= 69) return { cat: 'Moderate', eq: 50, debt: 40, gold: 10, color: '#f59e0b' };
    if (score <= 84) return { cat: 'Moderately Aggressive', eq: 70, debt: 20, gold: 10, color: '#a855f7' };
    return { cat: 'Aggressive', eq: 85, debt: 10, gold: 5, color: '#ef4444' };
  }

  // ── Shared Constants ──
  const BASE_RATES = {
    cpi: 0.06, education: 0.10, healthcare: 0.09, lifestyle: 0.075,
    equityLarge: 0.11, equityMidSmall: 0.13, equityIndex: 0.105,
    debtShort: 0.06, debtCorp: 0.07, gold: 0.075, hybrid: 0.09,
    ppf: 0.071, epf: 0.0825, nps: 0.10, gsec10y: 0.0705,
    postRetDef: 0.075
  };


  function _getVikramSeed() {
    const CLIENT_ID = 'VM-1510-2002';
    const vikram = {
      id: CLIENT_ID,
      profile: {
        fname: 'Vikram',
        lname: 'Mehta',
        dob: '1988-10-15',
        gender: 'Male',
        marital: 'Married',
        city: 'Mumbai',
        metro: 'Metro',
        stability: 'Stable',
        income: 250000,
        expenses: 150000,
        surplus: 100000,
        eq_pct: 70,
        debt_pct: 20,
        gold_pct: 10,
        corpus: 5300000,
        pan: 'VM***20M',
        occupation: 'Salaried',
        lifestage: 'Mid-career',
        employer: 'TechCorp Solutions Pvt Ltd',
        designation: 'Senior Director of Engineering',
        spouse: 'Ritu Mehta',
        dependents: 2,
        depdetails: 'Spouse (Homemaker), Daughter Anya (Age 8)',
        phone: '+91 98200 98200',
        email: 'vikram.mehta@techcorp.com'
      },
      financials: {
        income: { basic: 120000, hra: 60000, special: 70000, rental: 0, dividend: 0, otherinc: 0 },
        expenses: { housing: 40000, household: 50000, education: 10000, healthcare: 0, lifestyle: 30000, loanemi: 20000, inspremium: 0, otherexp: 0 },
        assets: { bank: 800000, mf: 1200000, equity: 1500000, epf: 1000000, ppf: 500000, nps: 0, realestate: 0, gold: 300000, surrender: 0 },
        liabilities: { homeloan: 0, vehicleloan: 600000, personalloan: 0, eduloan: 0 },
        insurance: { termlife: 5000000, termpremium: 12000, healthsi: 500000, bundledsa: 0 }
      },
      goals: [
        { id: 'G-01', name: "Anya's Higher Education", priority: 'Critical', horizon: 10, costToday: 3000000, inflRate: 0.10, earmarked: 800000, earreturn: 7.25, futureCost: 7781227 },
        { id: 'G-02', name: 'Retirement Corpus', priority: 'Critical', horizon: 22, costToday: 1200000, inflRate: 0.06, earmarked: 3700000, earreturn: 10.0, futureCost: 91800779 },
        { id: 'G-03', name: 'Car Upgrade', priority: 'Important', horizon: 4, costToday: 1000000, inflRate: 0.075, earmarked: 0, earreturn: 9.0, futureCost: 1335469 },
        { id: 'G-04', name: 'Emergency Fund', priority: 'Critical', horizon: 0, costToday: 720000, inflRate: 0.06, earmarked: 800000, earreturn: 6.0, futureCost: 720000 }
      ],
      gates: { 1: true, 2: true, 3: true, 4: true },
      gateTimestamps: {
        1: new Date().toISOString(),
        2: new Date().toISOString(),
        3: new Date().toISOString(),
        4: new Date().toISOString()
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      riskAnswers: {
        0: 4, 1: 4, 2: 2, 3: 4, 4: 3, 5: 5, 6: 4,
        7: 4, 8: 4, 9: 4, 10: 4, 11: 4, 12: 5, 13: 4,
        14: 4, 15: 4, 16: 5, 17: 5, 18: 5, 19: 4
      },
      riskScore: 72,
      riskCategory: 'Moderately Aggressive',
      artifacts: {}
    };

    const artContent = {"10":"# Artifact 10: Strategic Asset Allocation\n\n**Client ID:** VM-1510-2002  \n**Date Generated:** 2026-06-07  \n\n---\n\n## 1. Macro Strategic Asset Allocation Targets\n\nBased on the risk profile score of **72 (Moderately Aggressive)**, the strategic asset allocation framework defines the following target bands:\n\n| Asset Class | Target Weight (%) | Tactical Range (%) | Allocation Purpose |\n|---|---|---|---|\n| **Equity** | **70.00%** | 65.00% – 75.00% | Long-term capital growth and compounding |\n| **Debt** | **20.00%** | 15.00% – 25.00% | Capital preservation, emergency buffer, and liquidity |\n| **Gold** | **10.00%** | 5.00% – 15.00% | Defensive systemic hedge and inflation offset |\n| **Total** | **100.00%** | | |\n\n---\n\n## 2. Current vs. Target Rebalancing Guide\n\n| Asset Class | Current Value (₹) | Current Weight | Target Weight | Required Shift (₹) | Target Rebalanced Value (₹) |\n|---|---|---|---|---|---|\n| **Equity** | ₹27,00,000 | 50.94% | 70.00% | **+₹10,10,000** | ₹37,10,000 (70.00%) |\n| **Debt** | ₹23,00,000 | 43.40% | 20.00% | **(₹12,40,000)** | ₹10,60,000 (20.00%) * |\n| **Gold** | ₹3,00,000 | 5.66% | 10.00% | **+₹2,30,000** | ₹5,30,000 (10.00%) |\n| **Total** | **₹53,00,000** | **100.00%** | **100.00%** | **₹0** | **₹53,00,000** |\n\n*   *Tactical Rebalancing Note:* Over ₹15 Lakhs of current debt is held in locked-in EPF (₹10L) and PPF (₹5L). These must NOT be liquidated. Rebalancing will be achieved by:\n    1. Directing the ₹1,00,000 monthly surplus cash flow entirely into Equity Mutual Fund SIPs and Sovereign Gold Bond secondary purchases.\n    2. Transitioning the ₹12,00,000 regular mutual funds to commission-free Direct Index and Flexi Cap schemes.\n\n---\n\n## 3. Horizon-Based Earmarked Goal Buckets\n\n### A. Short-Term Horizon Bucket (<3 Years) — 100% Debt/Liquid\n*   **Goals Funded:** Emergency Fund (₹7.20L).\n*   **Asset Allocation:** ₹7,20,000 earmarked in high-interest sweep deposits and liquid funds.\n\n### B. Medium-Term Horizon Bucket (3–7 Years) — Conservative Growth\n*   **Goals Funded:** Car Upgrade (₹13.35L in 4 Years).\n*   **Asset Allocation:** Funded by ₹23,044/month SIP in low-volatility Arbitrage & Debt schemes.\n\n### C. Long-Term Horizon Bucket (>7 Years) — Growth-Heavy\n*   **Goals Funded:** Anya's Higher Education (10 Years), Retirement (22 Years).\n*   **Asset Allocation:** ₹10,00,000 EPF + ₹5,00,000 PPF + ₹15,00,000 Direct Stocks + ₹12,00,000 rebalanced Mutual Funds + ongoing long-term SIPs.","11":"# Artifact 11: Product Recommendations & Curation\n\n**Client ID:** VM-1510-2002  \n**Date Generated:** 2026-06-07  \n\n---\n\n## 1. Curated Investment Product Shortlist (Direct Plans Only)\n\n### 1.1 Equity Mutual Funds (Core & Satellite)\n*   **Core Passive Large Cap**: **UTI Nifty 50 Index Fund - Direct Growth** (Expense: 0.20%)\n*   **Core Active Flexi Cap**: **Parag Parikh Flexi Cap Fund - Direct Growth** (Expense: 0.62%)\n\n### 1.2 Debt, Arbitrage & Liquid Funds\n*   **Emergency Fund Parking**: **ICICI Prudential Liquid Fund - Direct Growth** (Expense: 0.25%)\n*   **Short-Term / Liquid Debt**: **SBI Banking & PSU Debt Fund - Direct Growth** (Expense: 0.32%)\n*   **Medium-Term Car SIP**: **ICICI Prudential Arbitrage Fund - Direct Growth** (Expense: 0.35%)\n\n### 1.3 Sovereign & Gold Schemes\n*   **Sovereign Gold Bonds (SGB)**: Secondary market purchase (e.g., SGBFEB32) or fresh tranches.\n*   **Public Provident Fund (PPF)**: Core tax-free debt compounding.\n\n---\n\n## 2. SEBI Regulation 17 Suitability Rationale Ledger\n\n*   **UTI Nifty 50 Index & Parag Parikh Flexi Cap**: Perfectly matches Vikram’s Moderately Aggressive profile and long retirement/education horizons. Offers low cost and broad-based exposure.\n*   **ICICI Pru Liquid & SBI Banking & PSU Debt**: Ensures capital preservation and high liquidity for the ₹7.2L emergency reserves.\n*   **ICICI Pru Arbitrage**: Used for the 4-year Car Upgrade goal. Equity taxation (low tax rate) with low volatility via arbitrage spreads.\n*   **Sovereign Gold Bonds**: Hedges lifestyle inflation (lifestyle costs closely tracking gold prices in India). Tax-exempt capital gains at 8-year maturity.","12":"# Artifact 12: Comprehensive Financial Advisory Plan\n\n**Client ID:** VM-1510-2002  \n**Plan Date:** June 7, 2026  \n**Advisory Firm:** NeuroFi Wealth Management  \n**License Details:** SEBI Registered Investment Adviser (Reg No: INA000000000)\n\n---\n\n## 1. Cover & Executive Summary\nComprehensive financial blueprint designed for **Vikram Mehta** (38), spouse Ritu (homemaker), and daughter Anya (8). Resolves HLV gaps, maps Anya's education (₹77.8L FV), car upgrade (₹13.3L FV), and secures a retirement corpus of **₹9.18 Crores**.\n\n## 2. Client Profile & Risk Assessment Summary\n*   **Risk Profile**: Moderately Aggressive (Score: 72)\n*   **Target Asset Allocation**: 70% Equity | 20% Debt | 10% Gold\n\n## 3. Current Financial Position\n*   **Assets**: ₹53,00,000 | **Liabilities**: ₹6,00,000 | **Net Worth**: ₹47,00,000\n*   **Gross monthly income**: ₹2,50,000/mo | **Expenses**: ₹1,50,000/mo | **Surplus**: ₹1,00,000/mo\n\n## 4. Insurance & Risk Mitigation Plan\n*   *Life Cover Gap*: ₹1.79 Crore. Recommendation: Buy an additional ₹2.0 Crore term policy.\n*   *Health Cover Gap*: Corporate cover is ₹5 Lakhs. Recommendation: Secure personal ₹10 Lakhs Family Floater + ₹15 Lakhs Super Top-up.\n\n## 5. Goal Funding & Compounding Roadmap\n*   *Emergency Fund (₹7.2L)*: Earmarked from Bank FDs.\n*   *Anya's Education (₹77.8L)*: Earmarked SGB+PPF. Recommended monthly SIP: ₹29,014.\n*   *Car Upgrade (₹13.3L in 4Y)*: Recommended monthly SIP: ₹23,044 in Arbitrage fund.\n*   *Retirement Corpus (₹9.18Cr)*: Earmarked EPF + Stocks + MFs. Monthly SIP: ₹47,942 (Years 1-4), increasing to ₹70,986 (Year 5 onwards).\n\n## 6. Tax Optimization Plan\nAdopt the **New Tax Regime** (Section 115BAC), saving **₹1,18,768 p.a.** over the Old Regime.\n\n## 7. Retirement Strategy & SWP Timeline\nCompounded starting base + cascaded SIPs reach ₹9.18 Crores at age 60. Sustains inflation-adjusted withdrawals till age 85, leaving a ₹2.01 Crore legacy surplus.\n\n## 8. Asset Allocation & Product Selection\nUTI Nifty 50 Index Direct, Parag Parikh Flexi Cap Direct, ICICI Arbitrage Direct, ICICI Liquid Direct, SBI Banking & PSU Direct, Sovereign Gold Bonds, and PPF.","13":"# Artifact 13: Client Delivery Briefing & Roadmap\n\n**Client ID:** VM-1510-2002  \n**Date of Delivery:** 2026-06-07  \n**Adviser License:** INA000000000\n\n---\n\n## 1. Executive Reconciliation Summary\n*   **Monthly Income**: ₹2,50,000 | **Living Expenses**: ₹1,50,000\n*   **Active Savings (Y1-4)**: ₹1,00,000/month (Education + Car + Retirement)\n*   **Cash Flow Buffer**: ₹0/month (100% surplus utilization)\n*   **Attestation:** The comprehensive plan has been reconciled. All recommendations align perfectly with the assessed **Moderately Aggressive** profile.\n\n## 2. Immediate Implementation Roadmap\n\n| Priority | Action Step | Product Details | Platform / Channel | Responsible Party | Due Date |\n|---|---|---|---|---|---|\n| **1** | Purchase Term Life Insurance | Additional ₹2.0 Crore Term Policy | Direct Online portal | Client | 15-06-2026 |\n| **2** | Purchase Health Floater | ₹10L Family Floater + ₹15L Top-up | Direct Health Portal | Client | 20-06-2026 |\n| **3** | Earmark Emergency Fund | Lock ₹7.2 Lakhs FD as Emergency Reserve | High-interest sweep bank | Client | 10-06-2026 |\n| **4** | Mutual Fund Transition | Move ₹12 Lakhs regular MF to Direct index/flexi cap | Direct AMC Portal / MF Utility | Client | 30-06-2026 |\n| **5** | Launch Goal SIPs | Start ₹29,014/mo Education SIP, ₹23,044/mo Car SIP, and ₹47,942/mo Retirement SIP | Direct AMC Portal | Client | 07-06-2026 |\n\n## 3. Review Schedule\n*   **Frequency**: Semi-annual. Next review: 07-12-2026.","14":"# Artifact 14: Client Consent & Decision Record\n\n**Client ID:** VM-1510-2002  \n**Plan Date Reference:** 2026-06-07  \n**Regulatory Standard:** SEBI RIA Regulation 17 (Fiduciary Informed Consent)\n\n---\n\n## 1. Recommendations Presented vs. Client Decisions\n\n| Advisory Category | Recommended Fiduciary Action | Client Decision (Accepted / Modified / Rejected) | Client Rationale / Deviations |\n|---|---|---|---|\n| **Life Insurance** | Buy additional ₹2.0 Cr Term Cover | **Accepted** | - |\n| **Health Insurance** | Buy ₹10L Base Floater + ₹15L Super Top-up | **Accepted** | - |\n| **Asset Allocation** | Earmark PPF/SGB for education, EPF/stocks/MF for retirement | **Accepted** | - |\n| **Regular to Direct MF** | Transition regular MF (₹12L) to Direct schemes | **Accepted** | - |\n| **Cascaded Savings Plan** | Follow Y1-4 and Y5 onwards cascaded SIP plan | **Accepted** | - |\n| **New Tax Regime Choice** | Opt for New Tax Regime (Annual savings ₹1.18 Lakhs) | **Accepted** | - |\n\n## 2. Fiduciary Attestation & Disclosures\n*   The client confirms receipt of the Comprehensive Financial Plan (Ref: `comprehensive_plan.md`).\n*   The client acknowledges that the Adviser has received no commission or financial incentives for any products recommended.\n*   The client understands that mutual fund investments are subject to market risks.\n\n## 3. Execution Signatures\n\n```\nClient Signature:                                      Professional Sign-off:\n\n_________________________________________________      _________________________________________________\nName: Vikram Mehta                                     Name: NeuroFi Wealth Team\nDate: 2026-06-07                                       SEBI Registration No: INA000000000\n                                                       Date: 2026-06-07\n```","01":"# Artifact 01: Client Profile (KYC & Demographics)\n\n**Client ID:** VM-1510-2002  \n**Date Generated:** 2026-06-07  \n**Last Updated:** 2026-06-07  \n**Assigned Advisor:** NeuroFi Wealth Management Team  \n**Regulatory Class:** SEBI KYC Registry (Reg 19)\n\n---\n\n## 1. Personal & KYC Details\n*   **Full Name:** Vikram Mehta\n*   **Date of Birth:** 15-10-1988 (Age: 38)\n*   **Gender:** Male\n*   **Marital Status:** Married\n*   **Permanent Account Number (PAN):** VM***20M (Masked)\n*   **Residential Address:** Altamount Road, Cumballa Hill, Mumbai, Maharashtra, India\n*   **City / Metro Status:** Mumbai | Metro Status\n*   **Life Stage:** Mid-career (peak earnings phase)\n\n## 2. Family & Dependents\n*   **Spouse Details:** Ritu Mehta, Age 35, Homemaker\n*   **Dependents Count:** 2 (Spouse, 1 Child)\n*   **Dependents Breakdown:**\n    *   Dependent 1: Ritu Mehta, Spouse, Homemaker (No independent income)\n    *   Dependent 2: Anya Mehta, Daughter, Age 8, Milestones: Primary school completed\n\n## 3. Professional Profile\n*   **Occupation Type:** Salaried (Senior IT Manager)\n*   **Employer / Firm Name:** TechCorp Solutions Pvt Ltd\n*   **Designation:** Senior Director of Engineering\n*   **Employment Stability:** Stable (Corporate leadership)\n*   **Primary Chartered Accountant (CA):** Mehta & Sanghavi Associates","02":"# Artifact 02: Client Risk Profile (SEBI Reg 16 Assessment)\n\n**Client ID:** VM-1510-2002  \n**Date of Assessment:** 2026-06-07  \n**Timestamp:** 10:15:00  \n**Adviser ID:** INA000000000\n\n---\n\n## 1. Scored Questionnaire Breakdown\n*   **Risk Capacity Score (A1 - A7):** 23 / 35\n*   **Risk Tolerance Score (B1 - B7):** 27 / 35\n*   **Risk Perception Score (C1 - C6):** 22 / 30\n*   **Cumulative Score:** 72 / 100\n\n## 2. Scored Questionnaire Responses\n*   **A1 (Age 38):** Option [31 to 45 years] `[4]`\n*   **A2 (Stability):** Option [Salaried - Established Corporate (Secure)] `[4]`\n*   **A3 (Overheads):** Option [Rent + EMI consumes ~60% of income] `[2]`\n*   **A4 (Debt-to-Asset):** Option [Low debt < 15% of assets] `[4]`\n*   **A5 (Dependents):** Option [2 dependents] `[3]`\n*   **A6 (Goal Horizon):** Option [More than 10 years for retirement/education] `[5]`\n*   **A7 (Emergency Fund):** Option [6 to 9 months of reserves] `[4]`\n*   **B1 (Volatility Reaction):** Option [I am completely comfortable with short-term volatility] `[4]`\n*   **B2 (Portfolio Option):** Option [Portfolio 2: Max +18%, Worst -8%] `[4]`\n*   **B3 (Investment Strategy):** Option [Moderate-to-high risk: 70% equity, 30% bonds] `[4]`\n*   **B4 (Primary Objective):** Option [Steady long-term wealth accumulation with moderate growth] `[4]`\n*   **B5 (High-volatility experience):** Option [Yes, occasionally with small allocations] `[4]`\n*   **B6 (Lock-in Perspective):** Option [Comfortable locking in funds for 5-10 years for premium returns] `[5]`\n*   **B7 (News downturn reaction):** Option [Maintain my systematic monthly investments (SIP) unchanged] `[4]`\n*   **C1 (Inflation/Interest rates):** Option [Good: I understand inflation erodes real returns] `[4]`\n*   **C2 (Guaranteed 18%):** Option [The investment must be carrying high risks; check credit rating] `[4]`\n*   **C3 (Direct vs Regular):** Option [Thorough: Direct plans have lower expense ratios/no commissions] `[5]`\n*   **C4 (Beat inflation):** Option [Diversified Equities / Equity Mutual Funds] `[5]`\n*   **C5 (Diversification):** Option [Spreading assets across uncorrelated classes to lower overall risk] `[5]`\n*   **C6 (Corporate Debt Risk):** Option [It is safer than equity, but capital is not guaranteed like bank FD] `[4]`\n\n## 3. Risk Category & Allocation Bounds\n*   **Assessed Risk Category:** **Moderately Aggressive**\n*   **Strategic Asset Allocation Target Band:**\n    *   **Equity:** 70% (Range: 65-75%)\n    *   **Debt:** 20% (Range: 15-25%)\n    *   **Gold / Alternatives:** 10% (Range: 5-15%)\n\n## 4. Compliance Attestation\n*   [x] Questionnaire administered in full.\n*   [x] Results communicated to the Client on 2026-06-07.\n*   [x] Signatures uploaded to document vault.","03":"# Artifact 03: Client Financial Snapshot\n\n**Client ID:** VM-1510-2002  \n**Date Generated:** 2026-06-07  \n**Verification Level:** Complete (Client Provided Bank Statements, ITRs & CAS)\n\n---\n\n## 1. Cash Inflows (Monthly)\n*   **Salaried - Basic Salary:** ₹1,20,000\n*   **Salaried - HRA:** ₹60,000\n*   **Salaried - Special Allowance:** ₹70,000\n*   **Total Gross Monthly Inflow (Net of TDS):** ₹2,50,000\n\n## 2. Cash Outflows (Monthly Expenses)\n*   **Housing Rent:** ₹40,000\n*   **Household Expenses (Groceries, Utilities):** ₹50,000\n*   **Education Fees (School Fee Monthly Equivalent):** ₹10,000\n*   **Lifestyle & Discretionary Outflow:** ₹30,000\n*   **Outstanding Loan EMIs (Car Loan):** ₹20,000\n*   **Total Monthly Outflow:** ₹1,50,000\n\n## 3. Statement of Assets\n*   **Bank Accounts (Savings / FDs):** ₹8,00,000 (15.09% of Assets)\n*   **Mutual Funds (Regular Equity MFs):** ₹12,00,000 (22.64% of Assets)\n*   **Direct Equity (Listed Stocks):** ₹15,00,000 (28.30% of Assets)\n*   **EPF Balances:** ₹10,00,000 (18.87% of Assets)\n*   **PPF Balances:** ₹5,00,000 (9.43% of Assets)\n*   **Sovereign Gold Bonds / Gold ETFs:** ₹3,00,000 (5.66% of Assets)\n*   **Total Current Assets:** ₹53,00,000\n\n## 4. Statement of Liabilities\n*   **Car Loan Outstanding:** ₹6,00,000 (Tenure remaining: 36 Months)\n*   **Total Liabilities:** ₹6,00,000\n\n## 5. Existing Insurance Coverage\n*   **Term Life Coverage:** ₹50,00,000 (Annual Premium: ₹12,000)\n*   **Health Insurance (Corporate Floater):** ₹5,00,000 (Provided by TechCorp Solutions)\n*   **Existing Bundled Insurance (ULIP/Endowment):** ₹0","04":"# Artifact 04: Client Goal Map\n\n**Client ID:** VM-1510-2002  \n**Date Generated:** 2026-06-07  \n\n---\n\n## 1. Structured Goals Inventory\n\n| Goal ID | Goal Name | Priority (Critical / Important / Aspirational) | Time Horizon (Years) | Cost in Today's Value (₹) | Inflation Category (CPI / Edu / Health / Life) | Funding Status | Flexibility |\n|---|---|---|---|---|---|---|---|\n| **G-01** | Anya's Higher Education | Critical | 10 | ₹30,00,000 | Education (10.0%) | Partially Funded | Non-Negotiable |\n| **G-02** | Retirement Corpus | Critical | 22 | ₹1,00,000 / month | CPI (6.0%) | Partially Funded | Non-Negotiable |\n| **G-03** | Car Upgrade | Important | 4 | ₹10,00,000 | Lifestyle (7.5%) | Not Started | Negotiable (+/- 1 Year) |\n| **G-04** | Emergency Fund | Critical | Immediate | ₹7,20,000 | CPI (6.0%) | Fully Funded | Non-Negotiable |\n\n## 2. Earmarked Portfolio Mapping\n*   **G-04 (Emergency Fund):** ₹7,20,000 earmarked in Bank Fixed Deposits.\n*   **G-01 (Anya's Education):** ₹5,00,000 PPF + ₹3,00,000 Sovereign Gold Bonds earmarked.\n*   **G-02 (Retirement):** ₹10,00,000 EPF + ₹12,00,000 Regular MFs + ₹15,00,000 Direct Equity earmarked.","05":"# Artifact 05: Net Worth & Cash Flow Modeling\n\n**Client ID:** VM-1510-2002  \n**Date Generated:** 2026-06-07  \n**Verification Level:** Complete\n\n---\n\n## 1. Net Worth Statement\n\n| Asset Category | Asset Description | Current Value (₹) | Allocation (%) |\n|---|---|---|---|\n| **Liquid Assets** | Bank Savings / FDs | ₹8,00,000 | 15.09% |\n| **Growth Assets** | Regular Mutual Funds | ₹12,00,000 | 22.64% |\n| **Growth Assets** | Direct Equity (Stocks) | ₹15,00,000 | 28.30% |\n| **Defensive Assets** | Sovereign Gold Bonds | ₹3,00,000 | 5.66% |\n| **Retirement Assets**| EPF | ₹10,00,000 | 18.87% |\n| **Retirement Assets**| PPF | ₹5,00,000 | 9.43% |\n| **Total Assets (A)** | | **₹53,00,000** | **100.00%** |\n| **Liabilities (B)** | Car Loan Outstanding | **₹6,00,000** | **11.32%** |\n| **Net Worth (A - B)** | | **₹47,00,000** | |\n\n---\n\n## 2. Cash Flow & Surplus Statement\n\n| Cash Inflow Category | Monthly Value (₹) | Cash Outflow Category | Monthly Value (₹) |\n|---|---|---|---|\n| Basic Salary (Salaried) | ₹1,20,000 | Housing Rent | ₹40,000 |\n| HRA (Salaried) | ₹60,000 | Household Expenses | ₹50,000 |\n| Special Allowance | ₹70,000 | School Fee Equivalent | ₹10,000 |\n| | | Lifestyle & Discretionary | ₹30,000 |\n| | | Car Loan EMI | ₹20,000 |\n| **Total Income** | **₹2,50,000** | **Total Outflows** | **₹1,50,000** |\n| **Net Monthly Surplus** | **₹1,00,000** | | |\n\n*   **Savings Rate:** **40.00%** (Net Monthly Surplus / Total Income)\n*   **Debt Service Ratio:** **8.00%** (Total Loan EMIs / Total Income)\n\n---\n\n## 3. Emergency Fund Analysis\n\n*   **Essential Monthly Expenses:** ₹1,20,000 (Rent ₹40k + Household ₹50k + School Fee ₹10k + Loan EMI ₹20k)\n*   **Target Emergency Fund (6 Months of Essential Expenses):** **₹7,20,000**\n*   **Current Liquid Assets:** ₹8,00,000 (Held in Bank FDs)\n*   **Emergency Fund Gap:** **₹0** (Fully Funded)\n*   **Fiduciary Recommendation:** Earmark ₹7,20,000 out of the existing ₹8,00,000 bank FD strictly as \"Emergency Reserves\" in a high-interest sweep account.","06":"# Artifact 06: Insurance & HLV GAP Modeling\n\n**Client ID:** VM-1510-2002  \n**Date Generated:** 2026-06-07  \n\n---\n\n## 1. Human Life Value (HLV) Calculation\n\nThe HLV computes the financial replacement value of the client’s future earnings for his family, discounted at the sovereign risk-free rate of **7.05%** (India 10-Year G-Sec yield).\n\n| Parameter | Value | Details |\n|---|---|---|\n| Monthly Net Inflow ($Y_{active}$) | ₹2,50,000 | In-hand monthly income |\n| Personal Consumption ($E_{personal}$) | ₹75,000 | Assumed at 30% of net monthly income |\n| Monthly Family Contribution | ₹1,75,000 | Net replacement requirement |\n| Annual Family Contribution ($Y_{net_annual}$) | ₹21,00,000 | Monthly contribution × 12 |\n| Years to Retirement ($N_{ret}$) | 22 | Retiring at 60 (Current age: 38) |\n| Sovereign Discount Rate ($R_f$) | 7.05% | Sovereign G-Sec Yield |\n| **Capitalized HLV (Present Value)** | **₹2,31,32,611.88** | Discounted replacement value |\n| Future Liabilities (Car Loan) | ₹6,00,000 | Car loan debt repayment buffer |\n| **Total Insurance Requirement** | **₹2,37,32,611.88** | Sum of HLV and liabilities |\n| **Fiduciary Recommended Cover** | **₹2,50,00,000** | Rounded up to secure family buffers |\n\n---\n\n## 2. Life Insurance Gap Analysis\n\n*   **Existing Term Cover ($C_{existing}$):** ₹50,00,000\n*   **Existing Liquid Assets:** ₹8,00,000\n*   **Total Recommended Term Insurance:** **₹2,50,00,000** (Total cover)\n*   **Net Life Insurance Gap:** **₹1,79,32,611.88**\n*   **Fiduciary Action Step:** Purchase an additional pure, unbundled Term Life policy for **₹2.0 Crores** immediately to bridge this HLV gap.\n\n---\n\n## 3. Health Insurance Gap Analysis\n\n*   **Residential Location Status:** Mumbai (Metro Area)\n*   **Base Family Floater Target:** **₹10,00,000** (Fiduciary standard for metro areas)\n*   **Super Top-up Target:** **₹15,00,000** (with a ₹10,00,000 deductible)\n*   **Existing Health Cover (Corporate):** ₹5,00,000 (Provided by employer - vulnerable to job transition risk)\n*   **Existing Health Cover (Personal):** ₹0\n*   **Net Health Insurance Gap:** **₹10,00,000 Base Floater**\n*   **Action Step:** Purchase a personal, independent Family Floater of ₹10 Lakhs with a Super Top-up of ₹15 Lakhs. Do not rely solely on corporate coverage.\n\n---\n\n## 4. Cost-Benefit Analysis of Bundled Policies\n*   **Status:** Vikram Mehta holds **no active endowment, money-back, or ULIP policies**. No unbundling calculations required.","07":"# Artifact 07: Goal Gap Compounding & Discounting\n\n**Client ID:** VM-1510-2002  \n**Date Generated:** 2026-06-07  \n\n---\n\n## 1. Goal Gap Calculation Ledger\n\nAll calculations are executed deterministically using base rates from `reference/base_rates.md`.\n\n| Goal ID | Goal Name | Years ($N$) | Cost Today (₹) | Inflation ($Inf$) | Future Target ($FV_{goal}$) | Earmarked Assets | Expected Asset Return | Earmarked Asset FV ($FV_{assets}$) | Net Goal Gap ($G_{gap}$) | Recommended Monthly SIP (₹) |\n|---|---|---|---|---|---|---|---|---|---|---|\n| **G-01** | Anya's Higher Education | 10 | ₹30,00,000 | 10.00% | ₹77,81,227 | ₹5L (PPF) + ₹3L (SGB) | PPF 7.1%, SGB 7.5% | ₹16,11,116 | ₹61,70,111 | **₹29,014** |\n| **G-02** | Retirement Corpus | 22 | ₹1,00,000/mo | 6.00% | ₹9,18,00,779 * | EPF ₹10L + MF ₹12L + Stocks ₹15L | EPF 8.25%, MF 10.5%, EQ 11% | ₹3,14,13,825 | ₹6,03,86,955 | **₹54,188** |\n| **G-03** | Car Upgrade | 4 | ₹10,00,000 | 7.50% | ₹13,35,469 | ₹0 | 9.00% | ₹0 | ₹13,35,469 | **₹23,044** |\n| **G-04** | Emergency Fund | Immediate | ₹7,20,000 | 6.00% | ₹7,20,000 | Bank FDs ₹8,00,000 | 6.00% | ₹7,20,000 | ₹0 | **₹0** |\n\n* *Retirement target is the present value of 25 years of inflation-adjusted monthly expenses of ₹1.0 Lakh starting at age 60, discounted at post-retirement defensive return of 7.5%.*\n\n---\n\n## 2. Surplus Cash Flow Matching & Flags\n\n*   **Total Available Monthly Surplus:** **₹1,00,000**\n*   **Total Required Monthly SIPs:** **₹1,06,246 / month**\n*   **Fiduciary Cash Flow Budget Status:** **⚠️ DEFICIT (₹6,246/month Shortfall)**\n\n> [!IMPORTANT]\n> **Advisory Flag (Cascaded Savings Strategy)**:\n> The required monthly SIPs for Anya's Higher Education (₹29,014), Retirement (₹54,188), and Car Upgrade (₹23,044) total ₹1,06,246, which slightly exceeds the monthly cash surplus of ₹1,00,000.\n> \n> **Fiduciary Solution (Cascaded Allocation)**:\n> *   **Years 1–4**: Allocate the available ₹1,00,000 monthly surplus as follows:\n>     *   *Anya's Education (G-01) SIP:* **₹29,014 / month** (100% funded)\n>     *   *Car Upgrade (G-03) SIP:* **₹23,044 / month** (100% funded)\n>     *   *Retirement (G-02) SIP:* **₹47,942 / month** (Partial funding - Shortfall of ₹6,246/month)\n> *   **Year 5 onwards**: Upon completion of G-03 (Car Upgrade) in Year 4, the car monthly SIP of **₹23,044** is completely freed. Redirect this surplus to Retirement:\n>     *   *Retirement (G-02) SIP:* Increase from ₹47,942 to **₹70,986 / month** (Fully offsets the earlier deficit and compiles a surplus cushion of ₹10,552/month over the baseline).\n>     *   This ensures all goals are systematically met without expanding debt liabilities.","08":"# Artifact 08: Tax Optimization Report\n\n**Client ID:** VM-1510-2002  \n**Date Generated:** 2026-06-07  \n\n---\n\n## 1. Dual Tax Regime Side-by-Side Analysis\n\nCalculations are modeled for a Gross Annual Salary equivalent of **₹30,00,000**.\n\n| Income & Deduction Head | Old Tax Regime (₹) | New Tax Regime (₹) | Notes / Details |\n|---|---|---|---|\n| **Gross Salary** | **₹30,00,000** | **₹30,00,000** | Gross salary baseline |\n| Standard Deduction | (₹50,000) | (₹75,000) | FY 2025-26 Standard Limits |\n| House Rent Allowance (HRA) Exemption | (₹3,36,000) | Not Allowed | HRA exemption (Mumbai Metro) |\n| Section 80C | (₹1,50,000) | Not Allowed | EPF + PPF (Fully utilized in Old) |\n| Section 80D | ₹0 | Not Allowed | Currently no personal health premiums |\n| Section 24(b) (Home Loan Interest) | ₹0 | Not Allowed | Zero home loan interest |\n| **Taxable Income** | **₹24,64,000** | **₹29,25,000** | Net taxable income base |\n| **Calculated Base Tax** | **₹5,51,700** | **₹4,37,500** | Computed using slab rates |\n| Health & Education Cess (4%) | ₹22,068 | ₹17,500 | Standard Cess surcharge |\n| **Total Net Tax Liability** | **₹5,73,768** | **₹4,55,000** | |\n| **Annual Tax Savings (New Regime)** | | **₹1,18,768** | **₹9,897 / month added liquidity** |\n\n---\n\n## 2. Calculation Rationale & Specific Exemption Rules\n\n*   **HRA Exemption Formula (Old Regime only):**\n    *   *Basic Salary*: ₹14,40,000 p.a. (₹1,20,000/month)\n    *   *Actual Rent Paid*: ₹4,80,000 p.a. (₹40,000/month)\n    *   *Exemption Value*: $min(\\text{Actual HRA Received (₹7,20,000)}, \\text{Rent Paid} - 10\\% \\text{ of Basic (₹4,80,000 - ₹1,44,000 = ₹3,36,000)}, \\text{Metro Cap (₹7,20,000)})$ = **₹3,36,000**.\n*   **New Regime Slab Compounding:**\n    *   Up to ₹4,00,000: **Nil**\n    *   ₹4,00,001 to ₹8,00,000: **₹20,000** (5%)\n    *   ₹8,00,001 to ₹12,00,000: **₹40,000** (10%)\n    *   ₹12,00,001 to ₹16,00,000: **₹60,000** (15%)\n    *   ₹16,00,001 to ₹24,00,000: **₹1,60,000** (20%)\n    *   Above ₹24,00,000: **₹1,57,500** (30% on ₹5,25,000)\n    *   *Total base tax*: **₹4,37,500** + 4% Cess = **₹4,55,000**.\n\n---\n\n## 3. Fiduciary Recommendation & Action Steps\n\n*   **Recommendation:** Opt for the **New Tax Regime** (Section 115BAC). It delivers a definitive benefit of **₹1,18,768 p.a.** over the Old Regime, even assuming full deductions and rent.\n*   **Employer Declaration:** File the declaration form with the employer to continue TDS under the New Tax Regime.","09":"# Artifact 09: Retirement Accumulation & SWP Depletion\n\n**Client ID:** VM-1510-2002  \n**Date Generated:** 2026-06-07  \n\n---\n\n## 1. Retirement Corpus Requirements (Nominal Values)\n\n| Planning Parameter | Value | Details / Formulas |\n|---|---|---|\n| Current Age | 38 | |\n| Target Retirement Age | 60 | |\n| Accumulation Phase ($N_{acc}$) | 22 Years | Age 60 minus Age 38 |\n| Life Expectancy ($Life_{exp}$) | 85 Years | Standard planning limit |\n| Distribution Phase ($N_{dist}$) | 25 Years | Age 85 minus Age 60 |\n| Current Monthly Expense Target | ₹1,00,000 | In today's purchasing power |\n| CPI Inflation Rate ($Inf_{cpi}$) | 6.00% | Long-term CPI anchor |\n| **First Year Retirement Expense** | **₹43,24,245** | ₹1,00,000 × 12 × $(1.06)^{22}$ |\n| Post-Retirement Portfolio Return | 7.50% | Conservative balanced hybrid asset mix |\n| Post-Retirement Real Return ($r_{real}$)| 1.415% | $\\frac{1 + 0.075}{1 + 0.06} - 1$ |\n| **Baseline Required Corpus** | **₹9,18,00,779** | Inflation-adjusted annuity value for 25 years |\n| **Fiduciary Target Corpus (Buffered)**| **₹9,18,00,779**| Targeted corpus fully meeting needs |\n\n---\n\n## 2. Retirement Gap & Accumulation Plan\n\n*   **Earmarked Current Assets for Retirement:**\n    *   *EPF Balance*: ₹10,00,000 (compounding at 8.25% for 22 years = ₹57,20,236)\n    *   *Mutual Funds (Regular)*: ₹12,00,000 (compounding at 10.5% for 22 years = ₹1,07,93,228)\n    *   *Direct Equity (Stocks)*: ₹15,00,000 (compounding at 11.0% for 22 years = ₹1,49,00,361)\n    *   *Total Starting Base*: **₹37,00,000** (Projected FV = **₹3,14,13,825**)\n*   **Corpus Shortfall (Target minus Base FV):**\n    *   ₹9,18,00,779 - ₹3,14,13,825 = **₹6,03,86,955**\n*   **Fiduciary SIP Funding Strategy:**\n    *   *Years 1 to 4*: Initiate a monthly Equity SIP of **₹47,942 / month**.\n    *   *Years 5 to 22 (18 Years)*: Upon completion of car goal, increase SIP to **₹70,986 / month**.\n    *   *Projected Value of Cascaded SIPs* (compounding at 11.0% p.a. in Equity):\n        *   FV of Y1-4 SIP (₹47,942/mo) compounded for remaining 18 years = ₹1,34,51,023\n        *   FV of Y5-22 SIP (₹70,986/mo) compounded for 18 years = ₹4,69,42,109\n        *   Total SIP Future Value: **₹6,03,93,132**\n    *   **Total Retirement Corpus at Age 60: ₹9.18 Crores (Target Fully Met!)**\n\n---\n\n## 3. Sustainable Post-Retirement SWP Timeline\n\n*   **Age 60 (Year 1)**: Starting Corpus: ₹9.18 Crore | Withdrawal: ₹43.24 Lakhs | Closing: ₹9.42 Crore\n*   **Age 65 (Year 6)**: Starting Corpus: ₹10.66 Crore | Withdrawal: ₹57.87 Lakhs | Closing: ₹10.84 Crore\n*   **Age 70 (Year 11)**: Starting Corpus: ₹11.66 Crore | Withdrawal: ₹77.44 Lakhs | Closing: ₹11.72 Crore\n*   **Age 75 (Year 16)**: Starting Corpus: ₹12.04 Crore | Withdrawal: ₹1.04 Crore | Closing: ₹11.90 Crore\n*   **Age 80 (Year 21)**: Starting Corpus: ₹10.37 Crore | Withdrawal: ₹1.39 Crore | Closing: ₹9.67 Crore\n*   **Age 85 (Year 26 - Final Year)**: Starting Corpus: ₹3.69 Crore | Withdrawal: ₹1.86 Crore | Closing Surplus: **₹2.01 Crore (Legacy Margin)**"};
    const artNames = {"10":"Asset Allocation","11":"Product Recommendations","12":"Comprehensive Plan","13":"Client Delivery","14":"Client Consent","01":"Client Profile","02":"Risk Profile","03":"Financial Snapshot","04":"Goal Map","05":"Net Worth & Cash Flow","06":"Insurance Analysis","07":"Goal Gap Analysis","08":"Tax Optimization","09":"Retirement Analysis"};
    const artAgents = {"10":"Researcher","11":"Researcher","12":"Researcher","13":"RM","14":"RM","01":"RM","02":"RM","03":"RM","04":"RM","05":"Analyst","06":"Analyst","07":"Analyst","08":"Analyst","09":"Analyst"};
    
    Object.keys(artContent).forEach(id => {
      vikram.artifacts[id] = {
        id: id,
        name: artNames[id],
        agent: artAgents[id],
        generatedAt: new Date().toISOString(),
        version: 1,
        content: artContent[id]
      };
    });
    
    return vikram;
  }

  // ── Public API ──
  return {
    getClients, getClient, createClient, updateClient, deleteClient,
    setArtifact, getArtifact, getReadableArtifacts,
    getGateStatus, passGate, isGatePassed,
    getActiveClientId, setActiveClientId,
    fmt, pct, fmtDate, toast,
    RISK_QUESTIONS, scoreToCategory, BASE_RATES,
    ACCESS, ARTIFACT_NAMES, ARTIFACT_AGENTS
  };
})();
