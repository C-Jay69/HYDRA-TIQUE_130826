import { useState, useEffect } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import axios from "axios";
import { API } from "../App";
import Navbar from "../components/Navbar";
import { Diamond, ShieldCheck, TrendUp, Storefront, ArrowSquareOut, CaretLeft, Lock, LightningSlash, Eye } from "@phosphor-icons/react";
import { useNavigate } from "react-router-dom";

export default function Report() {
  const { jobId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [upgrading, setUpgrading] = useState(false);
  const [pollingUpgrade, setPollingUpgrade] = useState(false);

  const fetchReport = async () => {
    try {
      const res = await axios.get(`${API}/reports/${jobId}`, { withCredentials: true });
      setReport(res.data);
    } catch (err) {
      setError("Failed to load report");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, [jobId]);

  // Poll upgrade status if returning from Stripe
  useEffect(() => {
    const sessionId = searchParams.get('session_id');
    const upgraded = searchParams.get('upgraded');
    if (sessionId && upgraded) {
      setPollingUpgrade(true);
      let attempts = 0;
      const poll = async () => {
        try {
          const res = await axios.get(`${API}/reports/${jobId}/upgrade/status/${sessionId}`, { withCredentials: true });
          if (res.data.payment_status === 'paid') {
            setPollingUpgrade(false);
            fetchReport();
            navigate(`/report/${jobId}`, { replace: true });
            return;
          }
        } catch {}
        attempts++;
        if (attempts < 10) setTimeout(poll, 2000);
        else setPollingUpgrade(false);
      };
      poll();
    }
  }, [searchParams, jobId]);

  const handleUpgrade = async () => {
    setUpgrading(true);
    try {
      const originUrl = window.location.origin;
      const res = await axios.post(`${API}/reports/${jobId}/upgrade`, {
        origin_url: originUrl
      }, { withCredentials: true });
      if (res.data.url) {
        window.location.href = res.data.url;
      }
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to start upgrade");
      setUpgrading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen" style={{ background: '#0A0A0B' }}>
        <Navbar />
        <div className="flex items-center justify-center py-32">
          <div className="w-8 h-8 border-2 border-[#C9A84C] border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  if (error || !report?.result) {
    return (
      <div className="min-h-screen" style={{ background: '#0A0A0B' }}>
        <Navbar />
        <div className="max-w-3xl mx-auto px-6 py-16 text-center">
          <p style={{ color: '#E05555' }}>{error || "Report not available yet"}</p>
          <button onClick={() => navigate('/dashboard')} className="mt-4 text-sm" style={{ color: '#C9A84C' }}>Back to Dashboard</button>
        </div>
      </div>
    );
  }

  const r = report.result;
  const job = report.job;
  const isBasic = r.tier === 'basic';
  const confidence = isBasic ? null : Math.round((r.authenticity_confidence || 0) * 100);
  const confidenceColor = confidence !== null ? (confidence >= 70 ? '#4CAF7A' : confidence >= 40 ? '#C9A84C' : '#E05555') : '#2A2A2E';

  return (
    <div className="min-h-screen" style={{ background: '#0A0A0B' }}>
      <Navbar />
      <div className="max-w-5xl mx-auto px-6 py-8 page-enter" data-testid="report-page">
        {/* Upgrade polling banner */}
        {pollingUpgrade && (
          <div className="mb-6 p-4 border flex items-center gap-3" style={{ background: '#141416', borderColor: '#C9A84C' }}>
            <div className="w-5 h-5 border-2 border-[#C9A84C] border-t-transparent rounded-full animate-spin" />
            <p className="text-sm" style={{ color: '#F5F5F0' }}>Unlocking your Deep Dive report...</p>
          </div>
        )}

        <button onClick={() => navigate('/dashboard')} className="flex items-center gap-1 text-sm mb-6 transition-colors hover:text-[#C9A84C]" style={{ color: '#8A8A8A' }} data-testid="back-to-dashboard">
          <CaretLeft size={16} /> Back to Dashboard
        </button>

        {/* Tier badge */}
        <div className="flex items-center gap-3 mb-6">
          {isBasic ? (
            <span className="font-mono text-xs tracking-widest uppercase px-3 py-1.5 flex items-center gap-2" style={{ background: 'rgba(42,42,46,0.5)', color: '#8A8A8A', border: '1px solid #2A2A2E' }} data-testid="tier-badge-basic">
              <Eye size={14} /> Free Scan
            </span>
          ) : (
            <span className="font-mono text-xs tracking-widest uppercase px-3 py-1.5 flex items-center gap-2" style={{ background: 'rgba(201,168,76,0.1)', color: '#C9A84C', border: '1px solid #C9A84C' }} data-testid="tier-badge-deep-dive">
              <Diamond size={14} weight="fill" /> Deep Dive
            </span>
          )}
        </div>

        {/* Hero */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8" data-testid="report-hero">
          <div>
            <div className="border mb-3" style={{ background: '#141416', borderColor: '#2A2A2E' }}>
              <div className="aspect-square flex items-center justify-center p-4">
                <Diamond size={80} weight="duotone" className="text-[#2A2A2E]" />
              </div>
            </div>
          </div>
          <div>
            <div className="flex items-center gap-3 mb-4">
              <span className="font-mono text-xs tracking-widest uppercase px-3 py-1 border" style={{ color: '#C9A84C', borderColor: '#C9A84C' }} data-testid="category-badge">
                {r.category}
              </span>
            </div>

            {isBasic ? (
              <>
                {/* BASIC TIER — vague but enticing */}
                <h1 className="font-serif text-3xl md:text-4xl font-bold tracking-tight mb-4" style={{ color: '#F5F5F0' }} data-testid="item-name">
                  {r.category === 'art' ? 'Artwork Identified' : 
                   r.category === 'coin' ? 'Coin Identified' :
                   r.category === 'jewelry' ? 'Jewelry Identified' :
                   r.category === 'antique' ? 'Antique Identified' : 'Item Identified'}
                </h1>
                <p className="text-base leading-relaxed mb-6" style={{ color: '#8A8A8A' }} data-testid="item-description">
                  {r.description}
                </p>
                <div className="grid grid-cols-2 gap-4">
                  <InfoField label="Period / Era" value={r.period_or_era} />
                  <InfoField label="Origin" value={r.origin_or_culture} />
                  {r.materials?.length > 0 && <InfoField label="Primary Material" value={r.materials[0]} />}
                  <InfoField label="Condition" value={r.condition?.replace('_', ' ')} />
                </div>
              </>
            ) : (
              <>
                {/* DEEP DIVE — full details */}
                <h1 className="font-serif text-3xl md:text-4xl font-bold tracking-tight mb-4" style={{ color: '#F5F5F0' }} data-testid="item-name">
                  {r.item_name}
                </h1>
                <p className="text-base leading-relaxed mb-6" style={{ color: '#8A8A8A' }} data-testid="item-description">
                  {r.description}
                </p>
                <div className="grid grid-cols-2 gap-4">
                  <InfoField label="Period / Era" value={r.period_or_era} />
                  <InfoField label="Origin" value={r.origin_or_culture} />
                  <InfoField label="Style" value={r.style_or_movement} />
                  <InfoField label="Materials" value={r.materials?.join(', ')} />
                </div>
              </>
            )}
          </div>
        </div>

        {/* Basic Tier Summary + Upgrade CTA */}
        {isBasic && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-8 border mb-8 relative overflow-hidden"
            style={{ background: '#141416', borderColor: '#C9A84C', boxShadow: '0 0 30px rgba(201,168,76,0.1)' }}
            data-testid="basic-summary-section"
          >
            <div className="absolute top-0 right-0 w-32 h-32 opacity-5" style={{ background: 'radial-gradient(circle, #C9A84C, transparent)' }} />
            <p className="font-mono text-xs tracking-[0.2em] uppercase mb-3" style={{ color: '#C9A84C' }}>Preliminary Assessment</p>
            <p className="text-base leading-relaxed mb-6" style={{ color: '#F5F5F0' }} data-testid="basic-summary-text">
              {r.basic_summary}
            </p>
            <div className="flex items-baseline gap-2 mb-6">
              <span className="font-mono text-3xl font-bold" style={{ color: '#C9A84C' }} data-testid="value-range">
                ${(r.estimated_value_low || 0).toLocaleString()} — ${(r.estimated_value_high || 0).toLocaleString()}
              </span>
              <span className="font-mono text-sm" style={{ color: '#8A8A8A' }}>USD (estimated range)</span>
            </div>
            <div className="border-t pt-6" style={{ borderColor: '#2A2A2E' }}>
              <h3 className="font-serif text-xl font-bold mb-3" style={{ color: '#F5F5F0' }}>
                Want the full picture?
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-6">
                {[
                  "Exact identification & attribution",
                  "Precise market valuation",
                  "Recent comparable sales data",
                  "Detailed authenticity analysis",
                  "Condition assessment notes",
                  "Best platforms to sell"
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm" style={{ color: '#8A8A8A' }}>
                    <Lock size={14} className="text-[#C9A84C]" />
                    {item}
                  </div>
                ))}
              </div>
              <button
                onClick={handleUpgrade}
                disabled={upgrading}
                className="px-8 py-3.5 font-semibold text-sm transition-all duration-200 active:translate-y-0.5 active:scale-[0.98] disabled:opacity-50"
                style={{ background: '#C9A84C', color: '#0A0A0B' }}
                data-testid="upgrade-deep-dive-btn"
              >
                {upgrading ? (
                  <span className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-[#0A0A0B] border-t-transparent rounded-full animate-spin" />
                    Processing...
                  </span>
                ) : (
                  <>Unlock Deep Dive — $11.99</>
                )}
              </button>
            </div>
          </motion.div>
        )}

        {/* Locked sections preview for basic tier */}
        {isBasic && (
          <div className="space-y-6 mb-12">
            {/* Locked: Authenticity */}
            <div className="p-6 border relative overflow-hidden" style={{ background: '#141416', borderColor: '#2A2A2E' }} data-testid="locked-authenticity">
              <div className="absolute inset-0 backdrop-blur-sm flex items-center justify-center z-10" style={{ background: 'rgba(10,10,11,0.6)' }}>
                <div className="text-center">
                  <Lock size={28} weight="duotone" className="text-[#C9A84C] mx-auto mb-2" />
                  <p className="font-mono text-xs tracking-widest uppercase" style={{ color: '#C9A84C' }}>Deep Dive Required</p>
                </div>
              </div>
              <h3 className="font-serif text-lg font-semibold mb-4" style={{ color: '#F5F5F0' }}>
                <ShieldCheck size={20} weight="duotone" className="inline mr-2 text-[#C9A84C]" />
                Authenticity Analysis
              </h3>
              <div className="flex items-center gap-6">
                <div className="relative w-24 h-24">
                  <svg className="w-24 h-24 -rotate-90" viewBox="0 0 100 100">
                    <circle cx="50" cy="50" r="42" fill="none" stroke="#2A2A2E" strokeWidth="6" />
                    <circle cx="50" cy="50" r="42" fill="none" stroke="#2A2A2E" strokeWidth="6" strokeDasharray="132 264" />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="font-mono text-lg font-bold" style={{ color: '#2A2A2E' }}>??%</span>
                  </div>
                </div>
                <div className="flex-1">
                  <div className="h-3 rounded mb-2" style={{ background: '#2A2A2E', width: '80%' }} />
                  <div className="h-3 rounded mb-2" style={{ background: '#2A2A2E', width: '60%' }} />
                  <div className="h-3 rounded" style={{ background: '#2A2A2E', width: '40%' }} />
                </div>
              </div>
            </div>

            {/* Locked: Market Pricing */}
            <div className="p-6 border relative overflow-hidden" style={{ background: '#141416', borderColor: '#2A2A2E' }} data-testid="locked-market-pricing">
              <div className="absolute inset-0 backdrop-blur-sm flex items-center justify-center z-10" style={{ background: 'rgba(10,10,11,0.6)' }}>
                <div className="text-center">
                  <Lock size={28} weight="duotone" className="text-[#C9A84C] mx-auto mb-2" />
                  <p className="font-mono text-xs tracking-widest uppercase" style={{ color: '#C9A84C' }}>Deep Dive Required</p>
                </div>
              </div>
              <h3 className="font-serif text-lg font-semibold mb-4" style={{ color: '#F5F5F0' }}>
                <TrendUp size={20} weight="duotone" className="inline mr-2 text-[#C9A84C]" />
                Comparable Sales & Precise Valuation
              </h3>
              <div className="space-y-3">
                {[1, 2, 3].map(i => (
                  <div key={i} className="flex items-center gap-4 p-3 border" style={{ borderColor: '#2A2A2E' }}>
                    <div className="h-3 rounded flex-1" style={{ background: '#2A2A2E' }} />
                    <div className="h-3 rounded w-20" style={{ background: '#2A2A2E' }} />
                  </div>
                ))}
              </div>
            </div>

            {/* Locked: Sell Recommendations */}
            <div className="p-6 border relative overflow-hidden" style={{ background: '#141416', borderColor: '#2A2A2E' }} data-testid="locked-sell-recs">
              <div className="absolute inset-0 backdrop-blur-sm flex items-center justify-center z-10" style={{ background: 'rgba(10,10,11,0.6)' }}>
                <div className="text-center">
                  <Lock size={28} weight="duotone" className="text-[#C9A84C] mx-auto mb-2" />
                  <p className="font-mono text-xs tracking-widest uppercase" style={{ color: '#C9A84C' }}>Deep Dive Required</p>
                </div>
              </div>
              <h3 className="font-serif text-lg font-semibold mb-4" style={{ color: '#F5F5F0' }}>
                <Storefront size={20} weight="duotone" className="inline mr-2 text-[#C9A84C]" />
                Best Places to Sell
              </h3>
              <div className="grid grid-cols-2 gap-4">
                {[1, 2, 3, 4].map(i => (
                  <div key={i} className="p-4 border" style={{ borderColor: '#2A2A2E' }}>
                    <div className="h-3 rounded mb-3" style={{ background: '#2A2A2E', width: '70%' }} />
                    <div className="h-2 rounded mb-2" style={{ background: '#2A2A2E', width: '90%' }} />
                    <div className="h-2 rounded" style={{ background: '#2A2A2E', width: '50%' }} />
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ====== DEEP DIVE FULL CONTENT ====== */}
        {!isBasic && (
          <>
            {/* Condition & Authenticity */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="p-6 border"
                style={{ background: '#141416', borderColor: '#2A2A2E' }}
                data-testid="condition-section"
              >
                <h3 className="font-serif text-lg font-semibold mb-4" style={{ color: '#F5F5F0' }}>
                  <ShieldCheck size={20} weight="duotone" className="inline mr-2 text-[#C9A84C]" />
                  Condition Assessment
                </h3>
                <div className="flex items-center gap-3 mb-3">
                  <span className="font-mono text-sm font-bold px-3 py-1 uppercase" style={{ background: 'rgba(201,168,76,0.1)', color: '#C9A84C' }} data-testid="condition-badge">
                    {r.condition?.replace('_', ' ')}
                  </span>
                </div>
                <p className="text-sm leading-relaxed" style={{ color: '#8A8A8A' }}>{r.condition_notes}</p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="p-6 border"
                style={{ background: '#141416', borderColor: '#2A2A2E' }}
                data-testid="authenticity-section"
              >
                <h3 className="font-serif text-lg font-semibold mb-4" style={{ color: '#F5F5F0' }}>Authenticity Analysis</h3>
                <div className="flex items-center gap-6 mb-4">
                  <div className="relative w-24 h-24">
                    <svg className="w-24 h-24 -rotate-90" viewBox="0 0 100 100">
                      <circle cx="50" cy="50" r="42" fill="none" stroke="#2A2A2E" strokeWidth="6" />
                      <circle
                        cx="50" cy="50" r="42" fill="none"
                        stroke={confidenceColor}
                        strokeWidth="6"
                        strokeDasharray={`${confidence * 2.64} 264`}
                        strokeLinecap="round"
                        style={{ transition: 'stroke-dasharray 1s ease-out' }}
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="font-mono text-lg font-bold" style={{ color: confidenceColor }} data-testid="confidence-score">{confidence}%</span>
                    </div>
                  </div>
                  <div className="flex-1">
                    <p className="font-mono text-xs tracking-widest uppercase mb-1" style={{ color: '#8A8A8A' }}>Confidence</p>
                    <p className="text-sm leading-relaxed" style={{ color: '#8A8A8A' }}>{r.authenticity_notes}</p>
                  </div>
                </div>
              </motion.div>
            </div>

            {/* Market Valuation */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="p-6 border mb-12"
              style={{ background: '#141416', borderColor: '#2A2A2E' }}
              data-testid="valuation-section"
            >
              <h3 className="font-serif text-lg font-semibold mb-1" style={{ color: '#F5F5F0' }}>
                <TrendUp size={20} weight="duotone" className="inline mr-2 text-[#C9A84C]" />
                Market Valuation
              </h3>
              <p className="text-sm mb-6" style={{ color: '#8A8A8A' }}>{r.value_basis}</p>
              <div className="flex items-baseline gap-2 mb-6">
                <span className="font-mono text-3xl font-bold" style={{ color: '#C9A84C' }} data-testid="value-range">
                  ${(r.estimated_value_low || 0).toLocaleString()} — ${(r.estimated_value_high || 0).toLocaleString()}
                </span>
                <span className="font-mono text-sm" style={{ color: '#8A8A8A' }}>USD</span>
              </div>

              {r.market_pricing?.length > 0 && (
                <div data-testid="comparable-sales">
                  <p className="font-mono text-xs tracking-[0.2em] uppercase mb-3" style={{ color: '#8A8A8A' }}>Comparable Sales</p>
                  <div className="space-y-2">
                    {r.market_pricing.map((s, i) => (
                      <div key={i} className="flex items-center justify-between p-3 border" style={{ borderColor: '#2A2A2E' }}>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm truncate" style={{ color: '#F5F5F0' }}>{s.title}</p>
                          <p className="text-xs" style={{ color: '#8A8A8A' }}>{s.source}</p>
                        </div>
                        {s.url && (
                          <a href={s.url} target="_blank" rel="noopener noreferrer" className="flex-shrink-0 ml-3">
                            <ArrowSquareOut size={16} className="text-[#C9A84C]" />
                          </a>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>

            {/* Sell Recommendations */}
            {r.sell_recommendations?.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="p-6 border mb-12"
                style={{ background: '#141416', borderColor: '#2A2A2E' }}
                data-testid="sell-recommendations-section"
              >
                <h3 className="font-serif text-lg font-semibold mb-6" style={{ color: '#F5F5F0' }}>
                  <Storefront size={20} weight="duotone" className="inline mr-2 text-[#C9A84C]" />
                  Best Places to Sell
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {r.sell_recommendations.map((rec, i) => (
                    <div key={i} className="p-4 border transition-all duration-300 hover:border-[#C9A84C]/40" style={{ borderColor: '#2A2A2E' }} data-testid={`sell-rec-${i}`}>
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-semibold text-sm" style={{ color: '#F5F5F0' }}>{rec.platform}</h4>
                        <span className="font-mono text-xs px-2 py-0.5" style={{ background: 'rgba(201,168,76,0.1)', color: '#C9A84C' }}>
                          {rec.suitability_score}/10
                        </span>
                      </div>
                      <p className="text-xs mb-2 leading-relaxed" style={{ color: '#8A8A8A' }}>{rec.reason}</p>
                      <div className="flex items-center gap-4 text-xs" style={{ color: '#8A8A8A' }}>
                        <span>Fees: {rec.seller_fees}</span>
                        <span>Time: {rec.avg_time_to_sell}</span>
                      </div>
                      {rec.url && (
                        <a href={rec.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 mt-2 text-xs transition-colors" style={{ color: '#C9A84C' }}>
                          Visit <ArrowSquareOut size={12} />
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Notable Features */}
            {r.notable_features?.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className="p-6 border mb-12"
                style={{ background: '#141416', borderColor: '#2A2A2E' }}
                data-testid="notable-features-section"
              >
                <h3 className="font-serif text-lg font-semibold mb-4" style={{ color: '#F5F5F0' }}>Notable Features</h3>
                <ul className="space-y-2">
                  {r.notable_features.map((f, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <Diamond size={14} weight="fill" className="text-[#C9A84C] mt-1 flex-shrink-0" />
                      <span className="text-sm leading-relaxed" style={{ color: '#8A8A8A' }}>{f}</span>
                    </li>
                  ))}
                </ul>
              </motion.div>
            )}
          </>
        )}

        <p className="font-mono text-xs text-center mb-8" style={{ color: '#2A2A2E' }}>
          Job ID: {jobId}
        </p>
      </div>
    </div>
  );
}

function InfoField({ label, value }) {
  if (!value) return null;
  return (
    <div>
      <p className="font-mono text-xs tracking-[0.2em] uppercase mb-1" style={{ color: '#8A8A8A' }}>{label}</p>
      <p className="text-sm" style={{ color: '#F5F5F0' }}>{value}</p>
    </div>
  );
}
