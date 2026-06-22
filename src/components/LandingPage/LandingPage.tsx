import React, { useEffect, useRef, useState } from 'react';
import './LandingPage.css';

const formatRupees = (num: number) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(num);

const PORTFOLIO_OPTIONS = [
  { label: '10L', value: 1000000 },
  { label: '50L', value: 5000000 },
  { label: '1Cr', value: 10000000 },
  { label: '5Cr', value: 50000000 },
];

const LandingPage: React.FC = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isStickyCtaVisible, setIsStickyCtaVisible] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [trustCounts, setTrustCounts] = useState({ direct: 0, conflict: 100 });
  const [portfolioSize, setPortfolioSize] = useState(5000000);
  const countingStartedRef = useRef(false);
  const sectionRefs = useRef<Map<string, HTMLElement>>(new Map());
  const [visibleSections, setVisibleSections] = useState<Set<string>>(new Set());

  const registerSection = (key: string) => (el: HTMLElement | null) => {
    if (el) sectionRefs.current.set(key, el);
  };

  useEffect(() => {
    const onScroll = () => {
      setIsScrolled(window.scrollY > 50);
      setIsStickyCtaVisible(window.scrollY > 400);
    };
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
  }, [isMobileMenuOpen]);

  const startCounting = () => {
    if (countingStartedRef.current) return;
    countingStartedRef.current = true;

    const duration = 2000;
    const stepTime = 16;
    const steps = duration / stepTime;

    let directCurrent = 0;
    const directIncrement = 100 / steps;
    let conflictCurrent = 100;
    const conflictIncrement = -100 / steps;

    const tick = () => {
      directCurrent += directIncrement;
      conflictCurrent += conflictIncrement;

      const directDone = directCurrent >= 100;
      const conflictDone = conflictCurrent <= 0;

      setTrustCounts({
        direct: directDone ? 100 : Math.round(directCurrent),
        conflict: conflictDone ? 0 : Math.round(conflictCurrent),
      });

      if (!directDone || !conflictDone) {
        requestAnimationFrame(tick);
      }
    };

    requestAnimationFrame(tick);
  };

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries, obs) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const key = (entry.target as HTMLElement).dataset.sectionKey;
            if (key) {
              setVisibleSections((prev) => new Set(prev).add(key));
              if (key === 'trust-strip') {
                startCounting();
              }
            }
            obs.unobserve(entry.target);
          }
        });
      },
      { root: null, rootMargin: '0px', threshold: 0.15 },
    );

    sectionRefs.current.forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  }, []);

  const sectionClass = (key: string, base: string) =>
    `${base} section-scroll${visibleSections.has(key) ? ' visible' : ''}`;

  const annualCost = portfolioSize * 0.01;
  const rDirect = 0.12;
  const rRegular = 0.11;
  const loss10Year =
    portfolioSize * Math.pow(1 + rDirect, 10) - portfolioSize * Math.pow(1 + rRegular, 10);
  const loss20Year =
    portfolioSize * Math.pow(1 + rDirect, 20) - portfolioSize * Math.pow(1 + rRegular, 20);

  const closeMobileMenu = () => setIsMobileMenuOpen(false);

  return (
    <>
      <div className="texture-overlay"></div>

      <div className={`mobile-sticky-cta${isStickyCtaVisible ? ' visible' : ''}`}>
        <a href="#contact" className="btn btn-primary-mobile">Talk to an Advisor</a>
      </div>

      <nav className={`navbar${isScrolled ? ' scrolled' : ''}`}>
        <div className="container nav-container">
          <div className="logo">
            <a href="#">NeuroFi<span className="logo-dot">.</span></a>
          </div>

          <div className="nav-links">
            <a href="#how-it-works">How It Works</a>
            <a href="#who-we-serve">Who We Serve</a>
            <a href="#know-your-risk">Know Your Risk</a>
            <a href="#clarify-your-goals">Clarify Your Goals</a>
            <a href="#fiduciary">Why NeuroFi</a>
            <a href="#contact" className="btn btn-nav">Talk to an Advisor</a>
          </div>

          <button
            className={`hamburger${isMobileMenuOpen ? ' active' : ''}`}
            aria-label="Menu"
            onClick={() => setIsMobileMenuOpen((v) => !v)}
          >
            <span className="bar"></span>
            <span className="bar"></span>
            <span className="bar"></span>
          </button>
        </div>
      </nav>

      <div className={`mobile-menu${isMobileMenuOpen ? ' active' : ''}`}>
        <div className="mobile-nav-links">
          <a href="#how-it-works" className="mobile-link" onClick={closeMobileMenu}>How It Works</a>
          <a href="#who-we-serve" className="mobile-link" onClick={closeMobileMenu}>Who We Serve</a>
          <a href="#know-your-risk" className="mobile-link" onClick={closeMobileMenu}>Know Your Risk</a>
          <a href="#clarify-your-goals" className="mobile-link" onClick={closeMobileMenu}>Clarify Your Goals</a>
          <a href="#fiduciary" className="mobile-link" onClick={closeMobileMenu}>Fiduciary Difference</a>
        </div>
      </div>

      <header className={sectionClass('hero', 'hero')} ref={registerSection('hero')} data-section-key="hero">
        <div className="container hero-grid">
          <div className="hero-content">
            <h1 className="hero-title">
              <span className="title-dimmed">We don't have any incentive to sell an investment product,</span>
              <br />
              <span className="title-but">BUT</span>
              <br />
              <span className="title-accented">we have every incentive to give you the best advice.</span>
            </h1>
            <p className="hero-subtitle">
              Our Expert advisors are augmented by our proprietary AI to understand your financial position
              &amp; situation better, model your needs &amp; risks, and deliver personalized recommendations to
              you. <strong className="subtitle-highlight">Helping you make the most out of your Money.</strong>
            </p>
            <div className="hero-ctas">
              <a href="#contact" className="btn btn-primary">Talk to an Advisor Who Works in Your Best Interest</a>
              <a href="#how-it-works" className="btn btn-secondary">See How NeuroFi Works</a>
            </div>
          </div>
          <div className="hero-visual">
            <svg
              width="100%"
              height="100%"
              viewBox="0 0 500 350"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="hero-svg"
            >
              <path d="M40 310 L480 310" stroke="#8A99AD" strokeWidth="1" />
              <path d="M40 40 L40 310" stroke="#8A99AD" strokeWidth="1" />

              <text x="40" y="330" fill="#8A99AD" fontFamily="Inter" fontSize="12">Age 24</text>
              <text x="140" y="330" fill="#8A99AD" fontFamily="Inter" fontSize="12">Age 32</text>
              <text x="240" y="330" fill="#8A99AD" fontFamily="Inter" fontSize="12">Age 40</text>
              <text x="340" y="330" fill="#8A99AD" fontFamily="Inter" fontSize="12">Age 50</text>
              <text x="440" y="330" fill="#8A99AD" fontFamily="Inter" fontSize="12">Age 60+</text>

              <path d="M40 310 Q 200 280, 480 60" stroke="#C8972A" strokeWidth="3" fill="none" />
              <path d="M40 310 Q 200 280, 480 60 L 480 310 Z" fill="url(#grad)" opacity="0.1" />

              <circle cx="90" cy="296" r="4" fill="#080E14" stroke="#C8972A" strokeWidth="2" />
              <text x="85" y="286" fill="#F5F6F8" fontFamily="Inter" fontSize="11" transform="rotate(-75, 85, 286)">Car Purchase ✓</text>

              <circle cx="128" cy="283" r="4" fill="#080E14" stroke="#C8972A" strokeWidth="2" />
              <text x="123" y="273" fill="#F5F6F8" fontFamily="Inter" fontSize="11" transform="rotate(-75, 123, 273)">Home Downpayment ✓</text>

              <circle cx="187" cy="256" r="4" fill="#080E14" stroke="#C8972A" strokeWidth="2" />
              <text x="182" y="246" fill="#F5F6F8" fontFamily="Inter" fontSize="11" transform="rotate(-75, 182, 246)">Family Vacation ✓</text>

              <circle cx="275" cy="206" r="4" fill="#080E14" stroke="#C8972A" strokeWidth="2" />
              <text x="270" y="196" fill="#F5F6F8" fontFamily="Inter" fontSize="11" transform="rotate(-75, 270, 196)">Child's Higher Ed ✓</text>

              <circle cx="373" cy="140" r="4" fill="#080E14" stroke="#C8972A" strokeWidth="2" />
              <text x="368" y="130" fill="#F5F6F8" fontFamily="Inter" fontSize="11" transform="rotate(-75, 368, 130)">Retirement Fund ✓</text>

              <defs>
                <linearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#C8972A" />
                  <stop offset="100%" stopColor="#080E14" stopOpacity="0" />
                </linearGradient>
              </defs>
            </svg>
          </div>
        </div>
      </header>

      <section
        className={sectionClass('trust-strip', 'trust-strip')}
        ref={registerSection('trust-strip')}
        data-section-key="trust-strip"
      >
        <div className="container trust-container">
          <div className="trust-item">
            <div className="trust-value-wrapper">
              <span className="trust-number">{trustCounts.direct}</span>
              <span className="trust-suffix">%</span>
            </div>
            <span className="trust-label">Direct-Only<br />Placements</span>
          </div>
          <div className="trust-item">
            <div className="trust-value-wrapper">
              <svg
                className="trust-icon-svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="12" cy="12" r="10"></circle>
                <polyline points="16 8 10 14 8 12"></polyline>
              </svg>
            </div>
            <span className="trust-label sebi-label">SEBI Registered<br />Investment Advisory<br />Standard</span>
          </div>
          <div className="trust-item">
            <div className="trust-value-wrapper">
              <span className="trust-number">{trustCounts.conflict}</span>
              <span className="trust-suffix">%</span>
            </div>
            <span className="trust-label">Zero conflict<br />of Interest</span>
          </div>
        </div>
      </section>

      <section
        className={sectionClass('problem', 'problem-section')}
        ref={registerSection('problem')}
        data-section-key="problem"
      >
        <div className="container problem-stack">
          <div className="problem-quote">
            <h2>
              "The value of money is happiness without stress.<br />
              The purpose of wealth is to fulfill dreams without anxiety.<br />
              That is the only outcome we work towards."
            </h2>
          </div>
          <div className="problem-intro">
            <p>We operate on 5 Non-Negotiable Commitments that,</p>
            <p className="problem-intro-no">Neither</p>
            <p>Commission-Driven Distributor</p>
            <p className="problem-intro-or">Nor</p>
            <p>Product-Tied Advisor</p>
            <p>can deliver to you.</p>
          </div>
          <div className="problem-cards">
            <div className="problem-card">
              <div className="problem-card-title">Your Interest, Always First</div>
              <div className="problem-card-desc">We are legally bound to act in your best interest — not ours. Zero commissions from fund houses. Zero product quotas. Your financial goals are our only mandate.</div>
            </div>
            <div className="problem-card">
              <div className="problem-card-title">Direct Plans, Better Returns</div>
              <div className="problem-card-desc">We invest exclusively through zero-commission direct mutual fund plans. The difference? Lakhs more in your portfolio over time — money that would otherwise go to distributors.</div>
            </div>
            <div className="problem-card">
              <div className="problem-card-title">Beyond Just Picking Funds</div>
              <div className="problem-card-desc">We don't just recommend investments. We map your goals, assess your real risks, and build a plan that accounts for taxes, insurance, liabilities, and life events.</div>
            </div>
            <div className="problem-card">
              <div className="problem-card-title">Your Complete Wealth, Managed</div>
              <div className="problem-card-desc">Tax optimization, insurance review, emergency planning, estate structuring — we manage the full spectrum of your financial well-being, not just your investment portfolio.</div>
            </div>
            <div className="problem-card">
              <div className="problem-card-title">Institutional Discipline, For You</div>
              <div className="problem-card-desc">The same research-backed, risk-managed asset allocation used by large family offices and institutional investors — now applied to your personal wealth.</div>
            </div>
          </div>
        </div>
      </section>

      <section
        id="how-it-works"
        className={sectionClass('process', 'process-section')}
        ref={registerSection('process')}
        data-section-key="process"
      >
        <div className="container">
          <div className="section-header">
            <h2>The Advisory Process</h2>
            <p>A structured methodology combining AI-driven analysis with human stewardship.</p>
          </div>

          <div className="timeline">
            <div className="timeline-line"></div>

            <div className="timeline-step step-reveal visible">
              <div className="step-number">1</div>
              <div className="step-content">
                <h3>Understand your financial picture</h3>
                <p>Our intelligence engine gathers, organizes, and analyzes your current financial position with surgical precision, identifying risks and inefficiencies instantly.</p>
              </div>
            </div>

            <div className="timeline-step step-reveal visible">
              <div className="step-number">2</div>
              <div className="step-content">
                <h3>Get clarity on your goals and risks</h3>
                <p>We model long-horizon scenarios. Advisors review these projections and frame decisions with structured judgment, ensuring realism over optimism.</p>
              </div>
            </div>

            <div className="timeline-step step-reveal visible">
              <div className="step-number">3</div>
              <div className="step-content">
                <h3>Receive fiduciary advice</h3>
                <p>A human advisor aligns recommendations strictly to your best interest. Every decision is documented, transparent, and built for compounding.</p>
              </div>
            </div>
          </div>

          <div className="ai-human-bridge">
            <p>Our AI models scenarios and identifies risks with surgical precision — but it does not make the final call. Every recommendation you receive comes from a dedicated human advisor who carries full fiduciary responsibility for your wealth.</p>
          </div>

          <div className="cta-container">
            <a href="#contact" className="btn btn-secondary">Start With a Conversation</a>
          </div>
        </div>
      </section>

      <section
        id="who-we-serve"
        className={sectionClass('serve', 'serve-section')}
        ref={registerSection('serve')}
        data-section-key="serve"
      >
        <div className="container">
          <div className="section-header">
            <h2>Built for the Long-Horizon Investor</h2>
          </div>

          <div className="cards-grid">
            <div className="serve-card">
              <div className="card-accent-line"></div>
              <h3>For Corporate Professionals</h3>
              <ul className="serve-list">
                <li><strong>Your Struggle:</strong> Savings scattered across too many instruments — mutual funds, insurance policies, company benefits — with no unified strategy connecting them.</li>
                <li><strong>Your Desire:</strong> A consolidated, tax-efficient plan that turns fragmented savings into structured, long-term wealth.</li>
                <li><strong>Our Solution:</strong> Portfolio rationalization, tax-optimized allocation, and a clear financial roadmap aligned to your life milestones.</li>
              </ul>
            </div>

            <div className="serve-card">
              <div className="card-accent-line"></div>
              <h3>For Freelancers &amp; Independent Professionals</h3>
              <ul className="serve-list">
                <li><strong>Your Struggle:</strong> Irregular income makes planning hard. No employer benefits, no pension, no safety net — just you and your hustle.</li>
                <li><strong>Your Desire:</strong> Financial stability and a disciplined path to building wealth, despite unpredictable cash flows.</li>
                <li><strong>Our Solution:</strong> Cash flow structuring, emergency reserves, and a flexible investment framework designed for variable income patterns.</li>
              </ul>
            </div>

            <div className="serve-card">
              <div className="card-accent-line"></div>
              <h3>For Business Owners</h3>
              <ul className="serve-list">
                <li><strong>Your Struggle:</strong> Personal wealth tangled with business finances. No clear separation between what's yours and what's the company's.</li>
                <li><strong>Your Desire:</strong> Protect family wealth independent of business outcomes, with clarity on succession and liquidity planning.</li>
                <li><strong>Our Solution:</strong> Business-personal wealth separation, succession structuring, and risk ring-fencing — so your family's future isn't tied to your P&amp;L.</li>
              </ul>
            </div>

            <div className="serve-card">
              <div className="card-accent-line"></div>
              <h3>For Families</h3>
              <ul className="serve-list">
                <li><strong>Your Struggle:</strong> Coordinating finances across generations — parents' retirement, children's education, estate transfer — with no unified view.</li>
                <li><strong>Your Desire:</strong> Peace of mind that every family member's financial future is planned, protected, and on track.</li>
                <li><strong>Our Solution:</strong> Multi-generational wealth planning, estate structuring, and unified family advisory under one fiduciary standard.</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      <section
        id="know-your-risk"
        className={sectionClass('risk', 'risk-section')}
        ref={registerSection('risk')}
        data-section-key="risk"
      >
        <div className="container">
          <div className="section-header">
            <h2>Risk Is Not What You Think It Is</h2>
            <p>Most investors confuse volatility with risk. Real risk is permanent loss of capital — or worse, failing to reach the financial goals that matter to you.</p>
          </div>

          <div className="risk-grid">
            <div className="risk-card">
              <div className="card-accent-line"></div>
              <h3>Inflation Risk</h3>
              <p>If your money grows at 7% but inflation runs at 6%, your real wealth grows at just 1%. Safe-feeling instruments like FDs often lose to inflation after tax.</p>
            </div>

            <div className="risk-card">
              <div className="card-accent-line"></div>
              <h3>Concentration Risk</h3>
              <p>Having 60% of your net worth in one asset — your home, your company's stock, or a single sector — is not conviction. It is unmanaged exposure.</p>
            </div>

            <div className="risk-card">
              <div className="card-accent-line"></div>
              <h3>Advisor Misalignment Risk</h3>
              <p>The most expensive risk isn't market risk. It's the risk that your advisor's incentives don't match your goals. A commission-driven recommendation compounds against you silently.</p>
            </div>
          </div>

          <div className="risk-footer">
            <p>NeuroFi's advisory begins with an honest risk assessment — not a questionnaire that tells you what you want to hear.</p>
            <a href="#contact" className="btn btn-primary">Talk to an Advisor About Your Risk Profile</a>
          </div>
        </div>
      </section>

      <section
        id="clarify-your-goals"
        className={sectionClass('goals', 'goals-section')}
        ref={registerSection('goals')}
        data-section-key="goals"
      >
        <div className="container">
          <div className="section-header">
            <h2>What Are You Actually Planning For?</h2>
            <p>Before we recommend a single instrument, we need to understand what success looks like for you.</p>
          </div>

          <div className="goals-list">
            <div className="goal-row">
              <div className="goal-title">Retirement without compromise</div>
              <div className="goal-desc">Replacing your income stream permanently — so that your lifestyle isn't a negotiation.</div>
            </div>
            <div className="goal-row">
              <div className="goal-title">Children's higher education</div>
              <div className="goal-desc">Funding a ₹30–80L education goal in 8–15 years requires structured, inflation-adjusted planning — not hope.</div>
            </div>
            <div className="goal-row">
              <div className="goal-title">First home or second property</div>
              <div className="goal-desc">Separating emotion from math. We model downpayment timelines, EMI loads, and opportunity costs.</div>
            </div>
            <div className="goal-row">
              <div className="goal-title">Wealth transfer &amp; estate clarity</div>
              <div className="goal-desc">Ensuring your assets reach the right people, at the right time, with minimum friction and maximum tax efficiency.</div>
            </div>
            <div className="goal-row">
              <div className="goal-title">Financial independence before 50</div>
              <div className="goal-desc">FIRE isn't a meme for everyone. For some, it's a serious, achievable, numbers-driven plan.</div>
            </div>
          </div>

          <div className="goals-footer">
            <p>Your goals define your strategy. Not the other way around.</p>
            <a href="#contact" className="btn btn-primary">Start With Your Goals</a>
          </div>
        </div>
      </section>

      <section
        id="fiduciary"
        className={sectionClass('fiduciary', 'fiduciary-section')}
        ref={registerSection('fiduciary')}
        data-section-key="fiduciary"
      >
        <div className="container">
          <div className="section-header">
            <h2>The Fiduciary Standard</h2>
            <p>A fiduciary advisor is legally and ethically obligated to act in your best interest. No commissions. No product quotas. No conflicts.</p>
          </div>

          <div className="fiduciary-grid">
            <div className="comparison-panel">
              <div className="compare-row compare-header">
                <div className="compare-col-label"></div>
                <div className="compare-col-traditional">Traditional Distributor</div>
                <div className="compare-col-bank">Bank Affiliated Distributors</div>
                <div className="compare-col-neurofi">NeuroFi Fiduciary</div>
              </div>

              <div className="compare-row">
                <div className="compare-col-label">Compensation</div>
                <div className="compare-col-traditional">Hidden Product Commissions</div>
                <div className="compare-col-bank">Cross-Selling &amp; Targets</div>
                <div className="compare-col-neurofi highlight-text">Flat Advisory Fee</div>
              </div>

              <div className="compare-row">
                <div className="compare-col-label">Mutual Funds Used</div>
                <div className="compare-col-traditional">Regular Plans (High Expense)</div>
                <div className="compare-col-bank">In-House Products Pushed</div>
                <div className="compare-col-neurofi highlight-text">Direct Plans (Low Expense)</div>
              </div>

              <div className="compare-row">
                <div className="compare-col-label">Legal Duty</div>
                <div className="compare-col-traditional">Suitability Standard</div>
                <div className="compare-col-bank">Corporate Mandate</div>
                <div className="compare-col-neurofi highlight-text">Strict Fiduciary Standard</div>
              </div>

              <div className="compare-row">
                <div className="compare-col-label">Incentive</div>
                <div className="compare-col-traditional">Sell High-Margin Products</div>
                <div className="compare-col-bank">Meet Branch Quotas</div>
                <div className="compare-col-neurofi highlight-text">Grow Your Net Worth</div>
              </div>
            </div>

            <div className="calculator-panel">
              <h3>The Hidden Commission Calculator</h3>
              <p className="calc-desc">See the impact of 1% hidden distributor commissions (Regular vs Direct plans) on your wealth over time.</p>

              <div className="calc-input-group">
                <label>Current Portfolio Size (₹)</label>
                <div className="portfolio-buttons">
                  {PORTFOLIO_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      className={`calc-btn${portfolioSize === opt.value ? ' active' : ''}`}
                      onClick={() => setPortfolioSize(opt.value)}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="calc-results">
                <div className="result-box">
                  <span className="result-label">Hidden Annual Cost</span>
                  <span className="result-value text-red">{formatRupees(annualCost)}</span>
                </div>
                <div className="result-box">
                  <span className="result-label">Wealth Lost (10 Yrs)*</span>
                  <span className="result-value">{formatRupees(loss10Year)}</span>
                </div>
                <div className="result-box highlighted-result">
                  <span className="result-label">Wealth Lost (20 Yrs)*</span>
                  <span className="result-value text-gold">{formatRupees(loss20Year)}</span>
                </div>
              </div>
              <p className="calc-note">*Assuming 12% annual growth. The cost of conflicted advice compounds against you.</p>
            </div>
          </div>
        </div>
      </section>

      <hr className="section-divider" />

      <section
        className={sectionClass('scenarios', 'scenarios-section')}
        ref={registerSection('scenarios')}
        data-section-key="scenarios"
      >
        <div className="container">
          <div className="section-header">
            <h2>Client Stories</h2>
            <p>Real advisory experiences from our practice — coming soon.</p>
          </div>
        </div>
      </section>

      <section
        className={sectionClass('security', 'security-strip')}
        ref={registerSection('security')}
        data-section-key="security"
      >
        <div className="container">
          <div className="security-strip-grid">
            <div className="security-strip-item">
              <svg className="security-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
              </svg>
              <div className="security-strip-text">
                <strong>Your Data Stays Yours</strong>
                <span>We never sell or share your financial data with third parties.</span>
              </div>
            </div>
            <div className="security-strip-item">
              <svg className="security-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
              </svg>
              <div className="security-strip-text">
                <strong>256-Bit Encrypted</strong>
                <span>All interactions secured with bank-grade SSL encryption.</span>
              </div>
            </div>
            <div className="security-strip-item">
              <svg className="security-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                <polyline points="22 4 12 14.01 9 11.01"></polyline>
              </svg>
              <div className="security-strip-text">
                <strong>Direct Settlement Only</strong>
                <span>Your money moves directly between your bank and official AMCs. Never pooled.</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section
        id="contact"
        className={sectionClass('cta-footer', 'cta-footer')}
        ref={registerSection('cta-footer')}
        data-section-key="cta-footer"
      >
        <div className="container cta-footer-container">
          <p className="cta-kicker">The most expensive financial mistake isn't a bad investment.</p>
          <h2>It's years of advice that was never in your interest.</h2>
          <div className="cta-actions">
            <a href="#" className="btn btn-primary btn-large">Get a Free Portfolio Review</a>
            <a href="#how-it-works" className="btn btn-secondary btn-large">Understand Our Process First</a>
          </div>
          <div className="contact-details">
            <p className="cta-reassurance">No products to sell. No obligations. Just an honest assessment of where you stand.</p>
            <p>advisory@neurofi.in | We respond within 4 hours.</p>
          </div>
        </div>
      </section>

      <footer className="footer">
        <div className="container footer-grid">
          <div className="footer-brand">
            <div className="logo">NeuroFi<span className="logo-dot">.</span></div>
            <p>Judgment, not incentives.</p>
          </div>
          <div className="footer-links">
            <h4>Navigation</h4>
            <a href="#how-it-works">How It Works</a>
            <a href="#who-we-serve">Who We Serve</a>
            <a href="#fiduciary">Why NeuroFi</a>
          </div>
          <div className="footer-links">
            <h4>Legal</h4>
            <a href="#">Privacy Policy</a>
            <a href="#">Terms of Service</a>
            <a href="#">SEBI Investor Charter</a>
          </div>
          <div className="footer-social">
            <h4>Connect</h4>
            <a href="#">LinkedIn</a>
            <a href="#">YouTube</a>
          </div>
        </div>
        <div className="container footer-bottom">
          <p className="footer-compliance">SEBI Registered Investment Advisor · Flat Fee Advisory · Zero Product Commissions · Strict Conflict of Interest Policy</p>
          <p>&copy; 2026 NeuroFi Advisory. All rights reserved.</p>
          <p className="disclaimer">Disclaimer: Investment in securities market is subject to market risks; there is no guaranteed or assured return. Past performance is not indicative of future results. NeuroFi provides advisory services based on structured analysis; investors must read all related documents carefully and assess their own risk appetite before making investment decisions. NeuroFi does not guarantee specific outcomes or returns. Registration granted by SEBI does not certify the correctness, completeness, or adequacy of the services provided. Fee schedules and full disclosures are available upon request at advisory@neurofi.in.</p>
        </div>
      </footer>
    </>
  );
};

export default LandingPage;
