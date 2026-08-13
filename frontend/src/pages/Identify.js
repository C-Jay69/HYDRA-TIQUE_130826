import { useState, useCallback } from "react";
import { useAuth, API } from "../App";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import axios from "axios";
import Navbar from "../components/Navbar";
import { UploadSimple, X, Image, FilePdf, ArrowRight, Warning } from "@phosphor-icons/react";

export default function Identify() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [files, setFiles] = useState([]);
  const [description, setDescription] = useState("");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [jobId, setJobId] = useState(null);
  const [jobStatus, setJobStatus] = useState(null);

  const credits = user?.credits_balance || 0;

  const onDrop = useCallback((e) => {
    e.preventDefault();
    const dropped = Array.from(e.dataTransfer?.files || e.target.files || []);
    const valid = dropped.filter(f => 
      ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'].includes(f.type) && f.size <= 10 * 1024 * 1024
    );
    setFiles(prev => [...prev, ...valid].slice(0, 6));
    setError("");
  }, []);

  const removeFile = (index) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (files.length === 0) {
      setError("Please upload at least one image");
      return;
    }
    setUploading(true);
    setError("");
    try {
      const formData = new FormData();
      files.forEach(f => formData.append('images', f));
      formData.append('description', description);
      const res = await axios.post(`${API}/identify`, formData, {
        withCredentials: true,
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setJobId(res.data.job_id);
      setJobStatus('pending');
      // Poll for status
      pollStatus(res.data.job_id);
    } catch (err) {
      setError(err.response?.data?.detail || "Upload failed. Please try again.");
      setUploading(false);
    }
  };

  const pollStatus = (id) => {
    const interval = setInterval(async () => {
      try {
        const res = await axios.get(`${API}/identify/${id}/status`, { withCredentials: true });
        setJobStatus(res.data.status);
        if (res.data.status === 'completed') {
          clearInterval(interval);
          setTimeout(() => navigate(`/report/${id}`), 1000);
        }
        if (res.data.status === 'failed') {
          clearInterval(interval);
          setError("Identification failed. Your credit has been refunded.");
          setUploading(false);
        }
      } catch {
        clearInterval(interval);
      }
    }, 5000);
  };

  return (
    <div className="min-h-screen" style={{ background: '#0A0A0B' }}>
      <Navbar />
      <div className="max-w-3xl mx-auto px-6 py-8 page-enter" data-testid="identify-page">
        <p className="font-mono text-sm tracking-[0.2em] uppercase mb-2" style={{ color: '#C9A84C' }}>Free Scan</p>
        <h1 className="font-serif text-3xl md:text-4xl font-bold tracking-tight mb-2" style={{ color: '#F5F5F0' }}>
          Identify Your Artifact
        </h1>
        <p className="text-base mb-8" style={{ color: '#8A8A8A' }}>
          Upload clear photos from multiple angles for the best results. Your first scan is completely free.
        </p>

        {/* Job status overlay */}
        {jobId && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 z-50 flex items-center justify-center"
            style={{ background: 'rgba(10,10,11,0.9)' }}
            data-testid="processing-overlay"
          >
            <div className="text-center max-w-md px-6">
              <div className="w-16 h-16 border-2 border-[#C9A84C] border-t-transparent rounded-full animate-spin mx-auto mb-6" />
              <h2 className="font-serif text-2xl font-bold mb-3" style={{ color: '#F5F5F0' }}>
                {jobStatus === 'pending' ? 'Queued for Analysis' : 
                 jobStatus === 'processing' ? 'AI Analyzing Your Artifact' : 
                 jobStatus === 'completed' ? 'Analysis Complete!' : 'Processing...'}
              </h2>
              <p className="text-sm mb-4" style={{ color: '#8A8A8A' }}>
                {jobStatus === 'completed' ? 'Redirecting to your report...' : 'Our AI is examining materials, era, style, and authenticity markers...'}
              </p>
              <p className="font-mono text-xs" style={{ color: '#C9A84C' }}>Job ID: {jobId}</p>
            </div>
          </motion.div>
        )}

        {/* Error */}
        {error && (
          <div className="mb-6 p-4 border flex items-start gap-3" style={{ background: '#141416', borderColor: '#E05555' }} data-testid="error-message">
            <Warning size={20} className="text-[#E05555] flex-shrink-0 mt-0.5" />
            <p className="text-sm" style={{ color: '#E05555' }}>{error}</p>
          </div>
        )}

        {/* Upload zone */}
        <div
          className="upload-scanline relative border-2 border-dashed p-12 text-center transition-all duration-300 cursor-pointer mb-6 overflow-hidden"
          style={{ background: '#141416', borderColor: files.length > 0 ? '#C9A84C' : '#2A2A2E' }}
          onDragOver={e => { e.preventDefault(); e.currentTarget.style.borderColor = '#C9A84C'; }}
          onDragLeave={e => { e.currentTarget.style.borderColor = files.length > 0 ? '#C9A84C' : '#2A2A2E'; }}
          onDrop={onDrop}
          onClick={() => document.getElementById('file-input').click()}
          data-testid="upload-zone"
        >
          <input
            id="file-input"
            type="file"
            multiple
            accept="image/jpeg,image/png,image/webp,application/pdf"
            className="hidden"
            onChange={onDrop}
            data-testid="file-input"
          />
          <UploadSimple size={40} weight="duotone" className="mx-auto mb-4" style={{ color: '#C9A84C' }} />
          <p className="text-base mb-1" style={{ color: '#F5F5F0' }}>Drop files here or click to browse</p>
          <p className="text-sm" style={{ color: '#8A8A8A' }}>JPEG, PNG, WebP, or PDF — max 10MB each — up to 6 files</p>
        </div>

        {/* File list */}
        {files.length > 0 && (
          <div className="space-y-2 mb-6" data-testid="file-list">
            {files.map((f, i) => (
              <div key={i} className="flex items-center gap-3 p-3 border" style={{ background: '#141416', borderColor: '#2A2A2E' }}>
                {f.type === 'application/pdf' ? 
                  <FilePdf size={20} className="text-[#E05555]" /> : 
                  <Image size={20} className="text-[#C9A84C]" />
                }
                <span className="text-sm flex-1 truncate" style={{ color: '#F5F5F0' }}>{f.name}</span>
                <span className="font-mono text-xs" style={{ color: '#8A8A8A' }}>{(f.size / 1024).toFixed(0)} KB</span>
                <button onClick={() => removeFile(i)} className="p-1 transition-colors hover:text-[#E05555]" style={{ color: '#8A8A8A' }} data-testid={`remove-file-${i}`}>
                  <X size={16} />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Description */}
        <div className="mb-8">
          <label className="block font-mono text-xs tracking-[0.2em] uppercase mb-2" style={{ color: '#8A8A8A' }}>
            Additional Context (Optional)
          </label>
          <textarea
            value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder="Any details about the item — provenance, where you found it, estimated age..."
            rows={3}
            className="w-full bg-transparent border-b px-0 py-2 text-base outline-none transition-colors resize-none"
            style={{ borderColor: '#2A2A2E', color: '#F5F5F0' }}
            onFocus={e => e.target.style.borderColor = '#C9A84C'}
            onBlur={e => e.target.style.borderColor = '#2A2A2E'}
            data-testid="description-input"
          />
        </div>

        {/* Submit */}
        <div className="flex items-center justify-between">
          <p className="text-sm" style={{ color: '#8A8A8A' }}>
            Free scan — upgrade to Deep Dive for full details
          </p>
          <button
            onClick={handleSubmit}
            disabled={uploading || files.length === 0}
            className="flex items-center gap-2 px-8 py-3 font-semibold text-sm transition-all duration-200 active:translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ background: '#C9A84C', color: '#0A0A0B' }}
            data-testid="submit-identification-btn"
          >
            {uploading ? (
              <>
                <div className="w-4 h-4 border-2 border-[#0A0A0B] border-t-transparent rounded-full animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                Identify <ArrowRight size={16} weight="bold" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
