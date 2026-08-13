import { useState, useEffect } from "react";
import { useAuth, API } from "../App";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import axios from "axios";
import Navbar from "../components/Navbar";
import { Coins, CheckCircle, CaretLeft } from "@phosphor-icons/react";

const PACKS = [
  { id: "starter", name: "Starter", credits: 1, price: "$2.99", priceNum: 2.99 },
  { id: "explorer", name: "Explorer", credits: 5, price: "$9.99", priceNum: 9.99, featured: true },
  { id: "collector", name: "Collector", credits: 20, price: "$29.99", priceNum: 29.99 },
];

export default function BuyCredits() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(null);
  const [error, setError] = useState("");

  const handlePurchase = async (packId) => {
    setLoading(packId);
    setError("");
    try {
      const originUrl = window.location.origin;
      const res = await axios.post(`${API}/payments/create-checkout`, {
        pack_id: packId,
        origin_url: originUrl
      }, { withCredentials: true });
      if (res.data.url) {
        window.location.href = res.data.url;
      }
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to create checkout session");
      setLoading(null);
    }
  };

  return (
    <div className="min-h-screen" style={{ background: '#0A0A0B' }}>
      <Navbar />
      <div className="max-w-3xl mx-auto px-6 py-8 page-enter" data-testid="buy-credits-page">
        <button onClick={() => navigate('/dashboard')} className="flex items-center gap-1 text-sm mb-6 transition-colors hover:text-[#C9A84C]" style={{ color: '#8A8A8A' }} data-testid="back-btn">
          <CaretLeft size={16} /> Back to Dashboard
        </button>

        <p className="font-mono text-sm tracking-[0.2em] uppercase mb-2" style={{ color: '#C9A84C' }}>Purchase Credits</p>
        <h1 className="font-serif text-3xl md:text-4xl font-bold tracking-tight mb-2" style={{ color: '#F5F5F0' }}>
          Credit Packs
        </h1>
        <p className="text-base mb-2" style={{ color: '#8A8A8A' }}>
          Each identification uses 1 credit. Buy a pack that suits your needs.
        </p>
        <p className="text-sm mb-8" style={{ color: '#8A8A8A' }}>
          Current balance: <span className="font-mono font-bold" style={{ color: '#C9A84C' }}>{user?.credits_balance || 0} credits</span>
        </p>

        {error && (
          <div className="mb-6 p-4 border" style={{ background: '#141416', borderColor: '#E05555' }} data-testid="checkout-error">
            <p className="text-sm" style={{ color: '#E05555' }}>{error}</p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {PACKS.map((pack, i) => (
            <motion.div
              key={pack.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="p-6 border transition-all duration-300"
              style={{ 
                background: '#141416', 
                borderColor: pack.featured ? '#C9A84C' : '#2A2A2E',
                boxShadow: pack.featured ? '0 0 20px rgba(201,168,76,0.15)' : 'none'
              }}
              data-testid={`pack-${pack.id}`}
            >
              {pack.featured && (
                <p className="font-mono text-xs tracking-widest uppercase mb-3" style={{ color: '#C9A84C' }}>Best Value</p>
              )}
              <div className="flex items-center gap-2 mb-1">
                <Coins size={20} weight="duotone" className="text-[#C9A84C]" />
                <h3 className="font-serif text-xl font-bold" style={{ color: '#F5F5F0' }}>{pack.name}</h3>
              </div>
              <p className="font-mono text-3xl font-bold my-3" style={{ color: '#C9A84C' }}>{pack.price}</p>
              <p className="text-sm mb-1" style={{ color: '#8A8A8A' }}>
                {pack.credits} identification credit{pack.credits > 1 ? 's' : ''}
              </p>
              <p className="font-mono text-xs mb-6" style={{ color: '#8A8A8A' }}>
                ${(pack.priceNum / pack.credits).toFixed(2)} per identification
              </p>
              <button
                onClick={() => handlePurchase(pack.id)}
                disabled={loading === pack.id}
                className="w-full py-2.5 text-sm font-semibold transition-all duration-200 active:translate-y-0.5 disabled:opacity-50"
                style={{ background: pack.featured ? '#C9A84C' : 'transparent', color: pack.featured ? '#0A0A0B' : '#F5F5F0', border: pack.featured ? 'none' : '1px solid #2A2A2E' }}
                data-testid={`buy-${pack.id}-btn`}
              >
                {loading === pack.id ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                    Processing...
                  </span>
                ) : 'Purchase'}
              </button>
            </motion.div>
          ))}
        </div>

        <div className="mt-10 p-6 border" style={{ background: '#141416', borderColor: '#2A2A2E' }}>
          <h3 className="font-serif text-base font-semibold mb-3" style={{ color: '#F5F5F0' }}>How Credits Work</h3>
          <ul className="space-y-2">
            {[
              "Each identification uses exactly 1 credit",
              "If an identification fails, your credit is automatically refunded",
              "Credits never expire",
              "Secure payment powered by Stripe"
            ].map((item, i) => (
              <li key={i} className="flex items-start gap-2 text-sm" style={{ color: '#8A8A8A' }}>
                <CheckCircle size={16} weight="fill" className="text-[#4CAF7A] mt-0.5 flex-shrink-0" />
                {item}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
