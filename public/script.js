/**
 * NeuroFi Website Interactivity
 * Handles:
 * 1. Scroll-triggered animations (IntersectionObserver)
 * 2. Navigation bar scrolling behavior
 * 3. Mobile Hamburger Menu
 * 4. Metrics Counting Animation
 * 5. Hidden Commission Calculator Logic
 */

document.addEventListener("DOMContentLoaded", () => {
    
    // 1. Navigation Scrolled State
    const navbar = document.querySelector('.navbar');
    const mobileStickyCta = document.getElementById('mobileStickyCta');
    
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }

        // Mobile Sticky CTA trigger (show after scrolling past hero)
        if (window.scrollY > 400) {
            mobileStickyCta.classList.add('visible');
        } else {
            mobileStickyCta.classList.remove('visible');
        }
    });

    // 2. Mobile Hamburger Menu Toggle
    const hamburger = document.getElementById('hamburger');
    const mobileMenu = document.getElementById('mobileMenu');
    const mobileLinks = document.querySelectorAll('.mobile-link');

    function toggleMenu() {
        hamburger.classList.toggle('active');
        mobileMenu.classList.toggle('active');
        
        // Prevent body scrolling when menu is open
        if (mobileMenu.classList.contains('active')) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'auto';
        }
    }

    hamburger.addEventListener('click', toggleMenu);

    // Close menu when a link is clicked
    mobileLinks.forEach(link => {
        link.addEventListener('click', () => {
            if (mobileMenu.classList.contains('active')) {
                toggleMenu();
            }
        });
    });

    // 3. Scroll Reveal Animations (Intersection Observer)
    const observerOptions = {
        root: null,
        rootMargin: '0px',
        threshold: 0.15
    };

    const sectionObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                
                // If it's the trust strip, trigger the counting animation
                if (entry.target.classList.contains('trust-strip')) {
                    startCounting();
                }
                
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    // Observe general sections and timeline steps
    document.querySelectorAll('.section-scroll, .step-reveal').forEach(el => {
        sectionObserver.observe(el);
    });

    // 4. Metrics Counting Animation
    let countingStarted = false;
    
    function startCounting() {
        if (countingStarted) return;
        countingStarted = true;
        
        const counters = document.querySelectorAll('.trust-number');
        const duration = 2000; // 2 seconds
        
        counters.forEach(counter => {
            const start = parseInt(counter.getAttribute('data-start') || '0', 10);
            const target = parseInt(counter.getAttribute('data-target'), 10);
            
            const range = target - start;
            if (range === 0) {
                counter.innerText = target;
                return;
            }
            
            const stepTime = 16; // approx 60fps
            const steps = duration / stepTime;
            const increment = range / steps;
            let current = start;
            
            const updateCounter = () => {
                current += increment;
                
                if ((increment > 0 && current < target) || (increment < 0 && current > target)) {
                    counter.innerText = Math.round(current);
                    requestAnimationFrame(updateCounter);
                } else {
                    counter.innerText = target;
                }
            };
            
            updateCounter();
        });
    }

    // 5. Hidden Commission Calculator
    const calcButtons = document.querySelectorAll('.calc-btn');
    const annualCostEl = document.getElementById('annualCost');
    const tenYearLossEl = document.getElementById('tenYearLoss');
    const twentyYearLossEl = document.getElementById('twentyYearLoss');
    
    // Formatting function for Indian Rupees (Lakhs/Crores)
    const formatRupees = (num) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            maximumFractionDigits: 0
        }).format(num);
    };

    function updateCalculator(portfolioSize) {
        // Commission assumption: 1% annually
        const commissionRate = 0.01;
        const assumedGrowthRate = 0.12; // 12% market growth
        
        const annualCost = portfolioSize * commissionRate;
        
        // Future Value Difference (Approximate opportunity cost)
        // FV = P * (((1 + r)^n - 1) / r) * (1+r)  -- Standard SIP formula, but for lumpsum FV = P(1+r)^n
        // Here we just calculate the difference in corpus size due to expense ratio drag
        // Corpus with Direct Plan (12%) vs Regular Plan (10.75%)
        
        const rDirect = assumedGrowthRate;
        const rRegular = assumedGrowthRate - commissionRate;
        
        const fvDirect10 = portfolioSize * Math.pow(1 + rDirect, 10);
        const fvRegular10 = portfolioSize * Math.pow(1 + rRegular, 10);
        const loss10Year = fvDirect10 - fvRegular10;
        
        const fvDirect20 = portfolioSize * Math.pow(1 + rDirect, 20);
        const fvRegular20 = portfolioSize * Math.pow(1 + rRegular, 20);
        const loss20Year = fvDirect20 - fvRegular20;

        // Update DOM
        annualCostEl.innerText = formatRupees(annualCost);
        tenYearLossEl.innerText = formatRupees(loss10Year);
        twentyYearLossEl.innerText = formatRupees(loss20Year);
    }

    // Add click listeners to calculator buttons
    calcButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            // Remove active class from all
            calcButtons.forEach(b => b.classList.remove('active'));
            // Add to clicked
            btn.classList.add('active');
            
            // Get value and update
            const value = parseInt(btn.getAttribute('data-value'), 10);
            updateCalculator(value);
        });
    });

    // Initialize calculator with default active button (50L)
    updateCalculator(5000000);
});
