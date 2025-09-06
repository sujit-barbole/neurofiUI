import React, { useEffect, useState } from 'react';
import './LandingPage.css';

const LandingPage: React.FC = () => {
  const [isNavMenuActive, setIsNavMenuActive] = useState(false);
  const [chatMessages, setChatMessages] = useState([
    {
      id: 1,
      type: 'bot',
      content: "Hello! I'm your AI financial assistant. How can I help you today?",
      time: 'Just now'
    }
  ]);
  const [activeSection, setActiveSection] = useState('home');
  const [showPredefinedQuestions, setShowPredefinedQuestions] = useState(true);

  // Predefined questions and answers
  const predefinedQuestions = [
    {
      id: 1,
      question: "Give me acomprehensive financial health check, including my financial confidence score and runway calculation",
      answer: "Starting your investment journey is exciting! Here's a step-by-step approach:\n\n1. **Set Clear Goals**: Define what you're investing for (retirement, house, education)\n2. **Build an Emergency Fund**: Save 3-6 months of expenses first\n3. **Start Small**: Begin with low-cost index funds or ETFs\n4. **Diversify**: Don't put all your money in one place\n5. **Stay Consistent**: Regular contributions work better than timing the market\n\nWould you like me to help you create a personalized investment plan?"
    },
    {
      id: 2,
      question: "What's the best retirement strategy?",
      answer: "A solid retirement strategy depends on your age and goals, but here are key principles:\n\n**For Young Investors (20s-30s):**\n• Start early - time is your biggest advantage\n• Aim for 10-15% of income in retirement accounts\n• Consider Roth IRA for tax-free growth\n\n**For Mid-Career (40s-50s):**\n• Maximize employer 401(k) matching\n• Consider catch-up contributions\n• Review and rebalance annually\n\n**General Tips:**\n• Use the 4% withdrawal rule in retirement\n• Consider healthcare costs\n• Plan for multiple income sources\n\nWhat's your current age and retirement timeline?"
    },
    {
      id: 3,
      question: "How much should I save each month?",
      answer: "The amount depends on your goals, but here are some guidelines:\n\n**Emergency Fund:** 3-6 months of expenses\n**Retirement:** 10-15% of gross income\n**General Savings:** 20% of take-home pay (50/30/20 rule)\n\n**50/30/20 Rule:**\n• 50% for needs (housing, food, utilities)\n• 30% for wants (entertainment, dining)\n• 20% for savings and debt repayment\n\n**Quick Calculation:**\nIf you earn $5,000/month:\n• Emergency fund: $15,000-$30,000\n• Retirement: $500-$750/month\n• General savings: $1,000/month\n\nWhat's your monthly income and current expenses?"
    },
    {
      id: 4,
      question: "What's the difference between stocks and bonds?",
      answer: "Great question! Here's a simple breakdown:\n\n**Stocks (Equities):**\n• You own a piece of a company\n• Higher potential returns (8-10% historically)\n• Higher risk and volatility\n• Best for long-term growth (5+ years)\n\n**Bonds (Fixed Income):**\n• You're lending money to a company/government\n• Lower, more predictable returns (2-4% typically)\n• Lower risk and more stable\n• Good for income and stability\n\n**Key Differences:**\n• Risk: Stocks > Bonds\n• Returns: Stocks > Bonds\n• Volatility: Stocks > Bonds\n• Income: Bonds provide regular interest\n\n**Rule of Thumb:**\n• Young investors: 80% stocks, 20% bonds\n• Near retirement: 60% stocks, 40% bonds\n\nWhat's your risk tolerance and investment timeline?"
    },
    {
      id: 5,
      question: "How do I build good credit?",
      answer: "Building good credit takes time and discipline. Here's how:\n\n**Essential Steps:**\n1. **Pay Bills On Time**: This is 35% of your credit score\n2. **Keep Credit Utilization Low**: Use less than 30% of available credit\n3. **Don't Close Old Accounts**: Length of credit history matters\n4. **Mix of Credit Types**: Credit cards, loans, mortgages\n5. **Check Your Credit Report**: Monitor for errors\n\n**Quick Wins:**\n• Set up automatic payments\n• Request credit limit increases\n• Become an authorized user on someone's account\n• Use credit cards for small purchases and pay off monthly\n\n**Timeline:**\n• 6 months: Start seeing improvements\n• 1-2 years: Significant score increase\n• 3+ years: Excellent credit possible\n\nWhat's your current credit situation?"
    },
    {
      id: 6,
      question: "Should I pay off debt or invest?",
      answer: "This depends on your debt's interest rate. Here's the decision framework:\n\n**Pay Off Debt First If:**\n• Interest rate > 6-7%\n• High-interest credit cards (15-25%)\n• Personal loans (8-15%)\n• You're stressed about debt\n\n**Invest First If:**\n• Low-interest debt (< 4-5%)\n• Mortgage rates (3-4%)\n• Student loans (3-6%)\n• You have employer 401(k) matching\n\n**Hybrid Approach:**\n• Pay minimums on low-interest debt\n• Invest in 401(k) up to employer match\n• Aggressively pay high-interest debt\n• Then increase investments\n\n**Example:**\nIf you have $10,000 at 20% interest vs. investing at 8% return, paying debt saves you $1,200 more per year!\n\nWhat types of debt do you have and their interest rates?"
    }
  ];

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalTitle, setModalTitle] = useState('');
  const [modalDescription, setModalDescription] = useState('');

  const toggleNavMenu = () => {
    setIsNavMenuActive(!isNavMenuActive);
  };


  const handlePredefinedQuestion = (question: string, answer: string) => {
    // Add user question to chat
    const userMessage = {
      id: chatMessages.length + 1,
      type: 'user' as const,
      content: question,
      time: 'Just now'
    };
    
    // Add bot answer to chat
    const botMessage = {
      id: chatMessages.length + 2,
      type: 'bot' as const,
      content: answer,
      time: 'Just now'
    };

    setChatMessages(prev => [...prev, userMessage, botMessage]);
    // Keep predefined questions visible after answer
  };

  const resetChat = () => {
    setChatMessages([
      {
        id: 1,
        type: 'bot',
        content: "Hello! I'm your AI financial assistant. How can I help you today?",
        time: 'Just now'
      }
    ]);
    setShowPredefinedQuestions(true);
  };

  useEffect(() => {
    // Smooth scrolling for navigation links
    const navLinks = document.querySelectorAll('.nav-link[href^="#"]');

    navLinks.forEach(link => {
      link.addEventListener('click', function (e) {
        e.preventDefault();
        const targetId = (e.currentTarget as HTMLAnchorElement).getAttribute('href');
        if (targetId) {
          const targetSection = document.querySelector(targetId);
          if (targetSection) {
            targetSection.scrollIntoView({
              behavior: 'smooth',
              block: 'start'
            });
          }
        }
        setIsNavMenuActive(false);
      });
    });

    // Header background change on scroll + section highlight
    const handleScroll = () => {
      const navbar = document.querySelector('.navbar') as HTMLElement;
      if (navbar) {
        if (window.scrollY > 100) {
          navbar.style.background = 'rgba(255, 255, 255, 0.98)';
        } else {
          navbar.style.background = 'rgba(255, 255, 255, 0.95)';
        }
      }

      // Update active section for navigation highlighting
      const sections = document.querySelectorAll('section[id]');
      sections.forEach(section => {
        const rect = section.getBoundingClientRect();
        if (rect.top <= 100 && rect.bottom >= 100) {
          setActiveSection(section.id);
        }
      });
    };

    window.addEventListener('scroll', handleScroll);

    // Cleanup
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  // Handle service item click
  const handleServiceClick = (title: string, description: string) => {
    setModalTitle(title);
    setModalDescription(description);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setModalTitle('');
    setModalDescription('');
  };

  return (
    <div className="landing-page">
      {/* Navigation */}
      <nav className="navbar">
        <div className="nav-container">
          <div className="nav-logo">
            <h2>NeuroFi</h2>
          </div>
          <ul className={`nav-menu ${isNavMenuActive ? 'active' : ''}`}>
            <li><a href="#home" className={`nav-link ${activeSection === 'home' ? 'active' : ''}`}>Home</a></li>
            <li><a href="#features" className={`nav-link ${activeSection === 'features' ? 'active' : ''}`}>Features</a></li>
            <li><a href="#ai-chatbot" className={`nav-link ${activeSection === 'ai-chatbot' ? 'active' : ''}`}>AI Chatbot</a></li>
            <li><a href="#expert-advisory" className={`nav-link ${activeSection === 'expert-advisory' ? 'active' : ''}`}>Expert Advisory</a></li>
            <li><a href="#testimonials" className={`nav-link ${activeSection === 'testimonials' ? 'active' : ''}`}>Testimonials</a></li>
            <li><a href="#pricing" className={`nav-link ${activeSection === 'pricing' ? 'active' : ''}`}>Pricing</a></li>
            <li><a href="#contact" className={`nav-link ${activeSection === 'contact' ? 'active' : ''}`}>Contact</a></li>
          </ul>
          <div className="nav-toggle" onClick={toggleNavMenu}>
            <span className="bar"></span>
            <span className="bar"></span>
            <span className="bar"></span>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section id="home" className="hero">
        <div className="hero-container">
          <div className="hero-text">
            <h1 className="hero-title">
              AI-Powered Wealth Management That <span className="gradient-text">Understands You</span>
            </h1>
            <p className="hero-subtitle">
              Experience the future of financial planning with NeuroFi's intelligent AI chatbot and expert financial advisory services. Get personalized insights, real-time guidance, and expert advice to achieve your wealth goals.
            </p>
            <div className="hero-buttons">
              <a href="#ai-chatbot" className="btn btn-primary">Try AI Chatbot</a>
              <a href="#expert-advisory" className="btn btn-secondary">Expert Advisory</a>
            </div>
          </div>
          <div className="hero-visual">
            <div className="floating-card card-1">
              <span>📊</span> Smart Analytics
            </div>
            <div className="floating-card card-2">
              <span>🤖</span> AI Assistant
            </div>
            <div className="floating-card card-3">
              <span>🔒</span> Secure
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="features">
        <div className="container">
          <div className="section-header">
            <h2>Why Choose NeuroFi?</h2>
            <p>Revolutionary technology meets expert financial guidance</p>
          </div>
          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon">🤖</div>
              <h3>AI-Powered Insights</h3>
              <p>Advanced machine learning algorithms analyze your financial data to provide personalized recommendations and insights.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">🔒</div>
              <h3>Bank-Level Security</h3>
              <p>Your financial data is protected with enterprise-grade encryption and security protocols.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">⏰</div>
              <h3>24/7 Availability</h3>
              <p>Get instant answers to your financial questions anytime, anywhere with our AI chatbot.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">📋</div>
              <h3>Personalized Planning</h3>
              <p>Tailored financial plans based on your unique goals, risk tolerance, and financial situation.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">👨‍💼</div>
              <h3>Expert Guidance</h3>
              <p>Access to certified financial advisors with years of experience in wealth management.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">📱</div>
              <h3>Mobile-First Design</h3>
              <p>Seamless experience across all devices with our responsive, mobile-optimized platform.</p>
            </div>
          </div>
        </div>
      </section>

      {/* AI Chatbot Section */}
      <section id="ai-chatbot" className="ai-chatbot">
        <div className="container">
          <div className="section-header">
            <h2>Meet Your AI Financial Assistant</h2>
            <p>Our intelligent chatbot understands your financial goals and provides personalized guidance in real-time. Ask questions, get insights, and receive actionable advice instantly.</p>
          </div>
          <div className="ai-content">
            <div className="ai-text">
              <div className="ai-features">
                <div className="ai-feature">
                  <span>✓</span> Personalized financial analysis
                </div>
                <div className="ai-feature">
                  <span>✓</span> Investment recommendations
                </div>
                <div className="ai-feature">
                  <span>✓</span> Budget planning assistance
                </div>
                <div className="ai-feature">
                  <span>✓</span> Risk assessment
                </div>
                <div className="ai-feature">
                  <span>✓</span> Market insights
                </div>
              </div>
              <a href="#contact" className="btn btn-primary">Experience the AI in Action</a>
            </div>
            <div className="chat-interface">
              <div className="chat-header">
                <div className="chat-avatar">🤖</div>
                <div className="chat-info">
                  <h4>NeuroFi AI Assistant</h4>
                  <span className="status">Online</span>
                </div>
                <button className="chat-reset" onClick={resetChat} title="Start New Conversation">
                  🔄
                </button>
              </div>
              <div className="chat-messages">
                {chatMessages.map(message => (
                  <div key={message.id} className={`message ${message.type === 'bot' ? 'bot-message' : 'user-message'}`}>
                    <div className="message-content">{message.content}</div>
                    <div className="message-time">{message.time}</div>
                  </div>
                ))}
                
                {/* Predefined Questions */}
                {showPredefinedQuestions && (
                  <div className="predefined-questions">
                    <div className="questions-header">
                      <span>💡 Quick Questions</span>
                    </div>
                    <div className="questions-grid">
                      {predefinedQuestions.map(q => (
                        <button
                          key={q.id}
                          className="question-button"
                          onClick={() => handlePredefinedQuestion(q.question, q.answer)}
                        >
                          {q.question}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              {/* Text input removed - using predefined questions only */}
            </div>
          </div>
        </div>
      </section>

      {/* Expert Advisory Section */}
      <section id="expert-advisory" className="advisory">
        <div className="container">
          <div className="section-header">
            <h2>Expert Financial Advisory</h2>
            <p>Connect with certified financial advisors who understand your unique situation. Get personalized strategies, comprehensive financial planning, and ongoing support to achieve your wealth goals.</p>
          </div>
          <div className="advisory-content">
            <div className="advisory-text">
              <div className="advisory-services">
                <div className="service-item" onClick={() => handleServiceClick("Investment Planning", "Strategic investment advice tailored to your goals and risk tolerance.")}>
                  <div className="service-icon">📈</div>
                  <div className="service-content">
                    <h4>Investment Planning</h4>
                  </div>
                </div>
                <div className="service-item" onClick={() => handleServiceClick("Retirement Planning", "Comprehensive retirement strategies to secure your financial future.")}>
                  <div className="service-icon">🏖️</div>
                  <div className="service-content">
                    <h4>Retirement Planning</h4>
                   </div>
                </div>
                <div className="service-item" onClick={() => handleServiceClick("Risk Management", "Protect your wealth with expert risk assessment and mitigation strategies.")}>
                  <div className="service-icon">🛡️</div>
                  <div className="service-content">
                    <h4>Risk Management</h4>
                   </div>
                </div>
                <div className="service-item" onClick={() => handleServiceClick("Tax Optimization", "Minimize tax liability and maximize your wealth with smart tax strategies.")}>
                  <div className="service-icon">💰</div>
                  <div className="service-content">
                    <h4>Tax Optimization</h4>
                 </div>
                </div>
              </div>
              <a href="#contact" className="btn btn-primary">Schedule Free Consultation</a>
            </div>
          </div>
        </div>
      </section>

      {/* Modal */}
      {isModalOpen && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={closeModal}>×</button>
            <h3>{modalTitle}</h3>
            <p>{modalDescription}</p>
          </div>
        </div>
      )}

      {/* Testimonials Section */}
      {/* <section id="testimonials" className="testimonials">
        <div className="container">
          <div className="section-header">
            <h2>What Our Clients Say</h2>
            <p>Join thousands of satisfied customers who trust NeuroFi with their financial future</p>
          </div>
          <div className="testimonials-grid">
            <div className="testimonial-card">
              <div className="testimonial-content">
                <p>"NeuroFi's AI chatbot helped me understand complex investment strategies in simple terms. My portfolio has grown 25% since I started using their service."</p>
              </div>
              <div className="testimonial-author">
                <div className="author-avatar">👨‍💼</div>
                <div className="author-info">
                  <h4>Michael Chen</h4>
                  <span>Software Engineer, 35</span>
                </div>
                <div className="rating">⭐⭐⭐⭐⭐</div>
              </div>
            </div>
            <div className="testimonial-card">
              <div className="testimonial-content">
                <p>"The expert advisory team at NeuroFi created a comprehensive retirement plan that gives me confidence about my future. Highly recommend!"</p>
              </div>
              <div className="testimonial-author">
                <div className="author-avatar">👩‍💼</div>
                <div className="author-info">
                  <h4>Jennifer Martinez</h4>
                  <span>Marketing Director, 42</span>
                </div>
                <div className="rating">⭐⭐⭐⭐⭐</div>
              </div>
            </div>
            <div className="testimonial-card">
              <div className="testimonial-content">
                <p>"As a small business owner, NeuroFi helped me optimize my tax strategy and plan for business growth. The AI insights are incredibly valuable."</p>
              </div>
              <div className="testimonial-author">
                <div className="author-avatar">👨‍💼</div>
                <div className="author-info">
                  <h4>David Thompson</h4>
                  <span>Business Owner, 38</span>
                </div>
                <div className="rating">⭐⭐⭐⭐⭐</div>
              </div>
            </div>
          </div>
        </div>
      </section> */}

      {/* Pricing Section */}
      {/* <section id="pricing" className="pricing">
        <div className="container">
          <div className="section-header">
            <h2>Choose Your Plan</h2>
            <p>Flexible pricing options to suit your financial needs</p>
          </div>
          <div className="pricing-grid">
            <div className="pricing-card">
              <div className="pricing-header">
                <h3>Starter</h3>
                <div className="price">
                  <span className="currency">$</span>
                  <span className="amount">0</span>
                  <span className="period">/month</span>
                </div>
              </div>
              <ul className="pricing-features">
                <li><span>✓</span> AI Chatbot Access</li>
                <li><span>✓</span> Basic Financial Analysis</li>
                <li><span>✓</span> Budget Tracking</li>
                <li><span>✓</span> Mobile App Access</li>
                <li className="disabled"><span>✗</span> Expert Advisory</li>
                <li className="disabled"><span>✗</span> Personalized Plans</li>
              </ul>
              <a href="#contact" className="btn btn-outline">Get Started Free</a>
            </div>
            <div className="pricing-card featured">
              <div className="pricing-badge">Most Popular</div>
              <div className="pricing-header">
                <h3>Professional</h3>
                <div className="price">
                  <span className="currency">$</span>
                  <span className="amount">29</span>
                  <span className="period">/month</span>
                </div>
              </div>
              <ul className="pricing-features">
                <li><span>✓</span> Everything in Starter</li>
                <li><span>✓</span> Advanced AI Insights</li>
                <li><span>✓</span> Investment Recommendations</li>
                <li><span>✓</span> Quarterly Expert Review</li>
                <li><span>✓</span> Priority Support</li>
                <li><span>✓</span> Custom Financial Goals</li>
              </ul>
              <a href="#contact" className="btn btn-primary">Start Free Trial</a>
            </div>
            <div className="pricing-card">
              <div className="pricing-header">
                <h3>Premium</h3>
                <div className="price">
                  <span className="currency">$</span>
                  <span className="amount">99</span>
                  <span className="period">/month</span>
                </div>
              </div>
              <ul className="pricing-features">
                <li><span>✓</span> Everything in Professional</li>
                <li><span>✓</span> Dedicated Financial Advisor</li>
                <li><span>✓</span> Monthly Strategy Sessions</li>
                <li><span>✓</span> Tax Optimization</li>
                <li><span>✓</span> Estate Planning</li>
                <li><span>✓</span> 24/7 Priority Support</li>
              </ul>
              <a href="#contact" className="btn btn-outline">Contact Sales</a>
            </div>
          </div>
        </div>
      </section> */}

      {/* Contact Section */}
      <section id="contact" className="contact">
        <div className="container">
          <div className="section-header">
            <h2>Get in Touch</h2>
            <p>Ready to transform your financial future? Let's start the conversation.</p>
          </div>
          <div className="contact-content">
            <div className="contact-info">
              <div className="contact-details">
                <div className="contact-item">
                  <span>📧</span>
                  <div>
                    <h4>Email</h4>
                    <p>Info@neurofi.in</p>
                  </div>
                </div>
                <div className="contact-item">
                  <span>📞</span>
                  <div>
                    <h4>Phone</h4>
                    <p>+91-9113662144</p>
                  </div>
                </div>
                <div className="contact-item">
                  <span>🏢</span>
                  <div>
                    <h4>Office</h4>
                    <p>Neurofi HQ, HSR layout, sector 1, Bengalore,560102</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="contact-form">
              <form>
                <div className="form-group">
                  <select>
                    <option>Select Service</option>
                    <option>AI Chatbot</option>
                    <option>Expert Advisory</option>
                    <option>Both Services</option>
                  </select>
                </div>
                <div className="form-group">
                  <textarea placeholder="Send Message"></textarea>
                </div>
                <button type="submit" className="btn btn-primary">Send Message</button>
              </form>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer">
        <div className="container">
          <div className="footer-content">
            <div className="footer-section">
              <h3>NeuroFi</h3>
              <p>AI-powered wealth management and financial advisory services to help you achieve your financial goals.</p>
            </div>
            <div className="footer-section">
              <h4>Products</h4>
              <ul>
                <li><a href="#ai-chatbot">AI Chatbot</a></li>
                <li><a href="#expert-advisory">Expert Advisory</a></li>
              </ul>
            </div>
            {/* <div className="footer-section">
              <h4>Company</h4>
              <ul>
                <li><a href="#about">About Us</a></li>
                <li><a href="#careers">Careers</a></li>
                <li><a href="#blog">Blog</a></li>
                <li><a href="#press">Press</a></li>
              </ul>
            </div>
            <div className="footer-section">
              <h4>Support</h4>
              <ul>
                <li><a href="#help">Help Center</a></li>
                <li><a href="#contact">Contact Us</a></li>
                <li><a href="#privacy">Privacy Policy</a></li>
                <li><a href="#terms">Terms of Service</a></li>
              </ul>
            </div> */}
          </div>
          <div className="footer-bottom">
            <p>© 2024 NeuroFi. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
