import { useAuth, API } from "../App";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Diamond, MagnifyingGlass, CurrencyDollar, ShieldCheck } from "@phosphor-icons/react";

export default function Home() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleLogin = () => {
    // REMINDER: DO NOT HARDCODE THE URL, OR ADD ANY FALLBACKS OR REDIRECT URLS, THIS BREAKS THE AUTH
    const redirectUrl = window.location.origin + '/dashboard';
    window.location.href = `https://auth.emergentagent.com/?redirect=${encodeURIComponent(redirectUrl)}`;
  };

  if (user) {
    navigate('/dashboard', { replace: true });
    return null;
  }

  const features = [
    {
      icon: <MagnifyingGlass size={28} weight="duotone" />,
      title: "AI Identification",
      desc: "Upload photos of any artifact and receive expert-level identification powered by advanced vision AI."
    },
    {
      icon: <CurrencyDollar size={28} weight="duotone" />,
      title: "Market Valuation",
      desc: "Get real-time pricing from Christie's, Sotheby's, eBay sold listings, and Heritage Auctions."
    },
    {
      icon: <ShieldCheck size={28} weight="duotone" />,
      title: "Authenticity Analysis",
      desc: "Confidence scoring with detailed markers of authenticity and potential concerns."
    },
    {
      icon: <Diamond size={28} weight="duotone" />,
      title: "Sell Recommendations",
      desc: "AI-curated list of the best platforms to sell your item, with fees and timing estimates."
    }
  ];

  return (
    <div className="min-h-screen" style={{ background: '#0A0A0B' }}>
      {/* Nav */}
      <nav className="sticky top-0 z-50 backdrop-blur-xl border-b" style={{ background: 'rgba(10,10,11,0.7)', borderColor: '#2A2A2E' }}>
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Diamond size={24} weight="fill" className="text-[#C9A84C]" />
            <span className="font-serif text-xl font-bold tracking-tight" style={{ color: '#F5F5F0' }} data-testid="brand-logo">HYDRA-TIQUE</span>
          </div>
          <button
            data-testid="login-button"
            onClick={handleLogin}
            className="px-6 py-2.5 font-semibold text-sm transition-all duration-200 hover:shadow-lg active:translate-y-0.5 active:scale-[0.98]"
            style={{ background: '#C9A84C', color: '#0A0A0B' }}
          >
            Sign In with Google
          </button>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative overflow-hidden" data-testid="hero-section">
        <div className="absolute inset-0">
          <img 
            src="https://images.pexels.com/photos/30123614/pexels-photo-30123614.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940" 
            alt="Ancient artifact" 
            className="w-full h-full object-cover opacity-30"
          />
          <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, #0A0A0B, rgba(10,10,11,0.8), transparent)' }} />
        </div>
        <div className="relative max-w-7xl mx-auto px-6 pt-32 pb-40">
          <motion.div 
            initial={{ opacity: 0, y: 24 }} 
            animate={{ opacity: 1, y: 0 }} 
            transition={{ duration: 0.7, ease: "easeOut" }}
          >
            <p className="font-mono text-sm tracking-[0.2em] uppercase mb-6" style={{ color: '#C9A84C' }}>
              AI-Powered Artifact Intelligence
            </p>
            <h1 className="font-serif text-5xl md:text-6xl lg:text-7xl font-black tracking-tight leading-none mb-6" style={{ color: '#F5F5F0' }}>
              Identify. Value.<br />
              <span style={{ color: '#C9A84C' }}>Authenticate.</span>
            </h1>
            <p className="text-base md:text-lg max-w-xl leading-relaxed mb-10" style={{ color: '#8A8A8A' }}>
              Upload photos of art, antiques, coins, or jewelry. Our AI delivers expert identification, market valuation from leading auction houses, and authenticity analysis in minutes.
            </p>
            <div className="flex flex-wrap gap-4">
              <button 
                data-testid="hero-cta-button"
                onClick={handleLogin}
                className="px-8 py-3.5 font-semibold text-sm transition-all duration-200 hover:shadow-lg active:translate-y-0.5 active:scale-[0.98]"
                style={{ background: '#C9A84C', color: '#0A0A0B' }}
              >
                Start Identifying
              </button>
              <button 
                data-testid="hero-learn-more"
                onClick={() => document.getElementById('features').scrollIntoView({ behavior: 'smooth' })}
                className="px-8 py-3.5 font-semibold text-sm border transition-colors duration-300"
                style={{ borderColor: '#2A2A2E', color: '#F5F5F0' }}
              >
                Learn More
              </button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-24 px-6" data-testid="features-section">
        <div className="max-w-7xl mx-auto">
          <p className="font-mono text-sm tracking-[0.2em] uppercase mb-4" style={{ color: '#C9A84C' }}>Capabilities</p>
          <h2 className="font-serif text-3xl md:text-4xl font-bold tracking-tight mb-16" style={{ color: '#F5F5F0' }}>
            Expert-Level Analysis at Your Fingertips
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((f, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1, duration: 0.5 }}
                className="p-6 border transition-all duration-300 hover:-translate-y-1"
                style={{ 
                  background: '#141416', 
                  borderColor: '#2A2A2E',
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.borderColor = 'rgba(201,168,76,0.4)';
                  e.currentTarget.style.boxShadow = '0 8px 32px rgba(201,168,76,0.1)';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.borderColor = '#2A2A2E';
                  e.currentTarget.style.boxShadow = 'none';
                }}
                data-testid={`feature-card-${i}`}
              >
                <div className="mb-4" style={{ color: '#C9A84C' }}>{f.icon}</div>
                <h3 className="font-serif text-lg font-semibold mb-2" style={{ color: '#F5F5F0' }}>{f.title}</h3>
                <p className="text-sm leading-relaxed" style={{ color: '#8A8A8A' }}>{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-24 px-6 border-t" style={{ borderColor: '#2A2A2E' }} data-testid="how-it-works-section">
        <div className="max-w-7xl mx-auto">
          <p className="font-mono text-sm tracking-[0.2em] uppercase mb-4" style={{ color: '#C9A84C' }}>Process</p>
          <h2 className="font-serif text-3xl md:text-4xl font-bold tracking-tight mb-16" style={{ color: '#F5F5F0' }}>
            Three Simple Steps
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            {[
              { step: "01", title: "Upload", desc: "Take clear photos of your artifact from multiple angles. Up to 6 images per identification." },
              { step: "02", title: "Analyze", desc: "Our AI examines every detail — materials, era, style, condition, and authenticity markers." },
              { step: "03", title: "Results", desc: "Receive a comprehensive report with valuation, comparable sales, and best selling venues." }
            ].map((s, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15, duration: 0.5 }}
              >
                <span className="font-mono text-4xl font-bold" style={{ color: 'rgba(201,168,76,0.2)' }}>{s.step}</span>
                <h3 className="font-serif text-xl font-semibold mt-3 mb-2" style={{ color: '#F5F5F0' }}>{s.title}</h3>
                <p className="text-sm leading-relaxed" style={{ color: '#8A8A8A' }}>{s.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="py-24 px-6 border-t" style={{ borderColor: '#2A2A2E' }} data-testid="pricing-section">
        <div className="max-w-7xl mx-auto text-center">
          <p className="font-mono text-sm tracking-[0.2em] uppercase mb-4" style={{ color: '#C9A84C' }}>Pricing</p>
          <h2 className="font-serif text-3xl md:text-4xl font-bold tracking-tight mb-4" style={{ color: '#F5F5F0' }}>
            Free to Try. Pay Only for the Full Picture.
          </h2>
          <p className="text-base mb-12 max-w-lg mx-auto" style={{ color: '#8A8A8A' }}>
            Every scan is free. Upgrade any report to Deep Dive for the complete analysis.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl mx-auto">
            <div
              className="p-6 border transition-all duration-300 text-left"
              style={{ background: '#141416', borderColor: '#2A2A2E' }}
              data-testid="pricing-card-free"
            >
              <h3 className="font-serif text-xl font-bold mb-1" style={{ color: '#F5F5F0' }}>Free Scan</h3>
              <p className="font-mono text-3xl font-bold my-3" style={{ color: '#C9A84C' }}>$0</p>
              <p className="text-sm mb-4" style={{ color: '#8A8A8A' }}>Per identification</p>
              <ul className="space-y-2 mb-6">
                {["Category identification", "General era & origin", "Condition assessment", "Broad value range"].map((item, i) => (
                  <li key={i} className="text-sm flex items-center gap-2" style={{ color: '#8A8A8A' }}>
                    <span style={{ color: '#4CAF7A' }}>&#10003;</span> {item}
                  </li>
                ))}
              </ul>
              <button
                onClick={handleLogin}
                className="w-full py-2.5 text-sm font-semibold border transition-all duration-200"
                style={{ borderColor: '#2A2A2E', color: '#F5F5F0', background: 'transparent' }}
                data-testid="pricing-buy-free"
              >
                Start Free
              </button>
            </div>
            <div
              className="p-6 border transition-all duration-300 text-left"
              style={{ background: '#141416', borderColor: '#C9A84C', boxShadow: '0 0 20px rgba(201,168,76,0.15)' }}
              data-testid="pricing-card-deepdive"
            >
              <p className="font-mono text-xs tracking-widest uppercase mb-3" style={{ color: '#C9A84C' }}>Full Report</p>
              <h3 className="font-serif text-xl font-bold mb-1" style={{ color: '#F5F5F0' }}>Deep Dive</h3>
              <p className="font-mono text-3xl font-bold my-3" style={{ color: '#C9A84C' }}>$11.99</p>
              <p className="text-sm mb-4" style={{ color: '#8A8A8A' }}>Per report upgrade</p>
              <ul className="space-y-2 mb-6">
                {["Everything in Free Scan, plus:", "Exact identification & attribution", "Precise market valuation", "Recent comparable sales", "Authenticity confidence score", "Best platforms to sell"].map((item, i) => (
                  <li key={i} className="text-sm flex items-center gap-2" style={{ color: i === 0 ? '#F5F5F0' : '#8A8A8A' }}>
                    {i === 0 ? null : <span style={{ color: '#C9A84C' }}>&#10003;</span>} {item}
                  </li>
                ))}
              </ul>
              <button
                onClick={handleLogin}
                className="w-full py-2.5 text-sm font-semibold transition-all duration-200 active:translate-y-0.5"
                style={{ background: '#C9A84C', color: '#0A0A0B' }}
                data-testid="pricing-buy-deepdive"
              >
                Get Started
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 border-t" style={{ borderColor: '#2A2A2E' }}>
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Diamond size={20} weight="fill" className="text-[#C9A84C]" />
            <span className="font-serif font-bold" style={{ color: '#F5F5F0' }}>HYDRA-TIQUE</span>
          </div>
          <p className="text-sm" style={{ color: '#8A8A8A' }}>AI-Powered Artifact Identification & Valuation</p>
        </div>
      </footer>
    </div>
  );
}
