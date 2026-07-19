import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Logo from '../Logo';

const API = window.location.origin;
const authHeaders = () => ({ 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('token')}` });

const PRESETS = [
  { label: 'Landscape', prompt: 'Beautiful mountain landscape at sunset, dramatic clouds, golden light, photorealistic' },
  { label: 'Portrait', prompt: 'Professional portrait of a person, studio lighting, sharp focus, 8k' },
  { label: 'Abstract', prompt: 'Abstract geometric art, vibrant neon colors, dark background, minimal, modern' },
  { label: 'Fantasy', prompt: 'Epic fantasy castle on floating island, magical atmosphere, detailed architecture' },
  { label: 'Space', prompt: 'Deep space nebula, vibrant colors, stars, cosmic dust, 8k resolution' },
  { label: 'Cyberpunk', prompt: 'Cyberpunk city at night, neon lights, rain, futuristic buildings, detailed' },
  { label: 'Pixel Art', prompt: 'Retro pixel art landscape, 16-bit style, vibrant colors, game art' },
  { label: 'Watercolor', prompt: 'Soft watercolor painting of a garden, pastel colors, artistic, delicate' },
];

const SIZES = [
  { w: 1024, h: 1024, label: '1:1' },
  { w: 1280, h: 720, label: '16:9' },
  { w: 720, h: 1280, label: '9:16' },
  { w: 1024, h: 768, label: '4:3' },
  { w: 768, h: 1024, label: '3:4' },
];

export default function ImageGenPage() {
  const navigate = useNavigate();
  const [prompt, setPrompt] = useState('');
  const [model, setModel] = useState('flux');
  const [size, setSize] = useState(0);
  const [enhance, setEnhance] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [result, setResult] = useState(null);
  const [history, setHistory] = useState([]);
  const [error, setError] = useState('');
  const [showHistory, setShowHistory] = useState(false);
  const [timeoutWarning, setTimeoutWarning] = useState(false);
  const timerRef = useRef(null);

  const handleGenerate = async () => {
    if (!prompt.trim() || generating) return;
    setGenerating(true);
    setError('');
    setResult(null);
    setTimeoutWarning(false);

    // Show timeout warning after 15 seconds
    timerRef.current = setTimeout(() => setTimeoutWarning(true), 15000);

    try {
      const res = await fetch(`${API}/api/generate-image`, {
        method: 'POST', headers: authHeaders(),
        body: JSON.stringify({
          prompt: prompt.trim(),
          width: SIZES[size].w,
          height: SIZES[size].h,
          model,
          enhance,
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        setError(err.detail || 'Generation failed');
        return;
      }
      const data = await res.json();
      const entry = { image: data.image, prompt: prompt.trim(), model, size: SIZES[size].label, seed: data.seed, timestamp: Date.now() };
      setResult(entry);
      setHistory(prev => [entry, ...prev].slice(0, 20));
    } catch (e) {
      setError(`Network error: ${e.message}`);
    } finally {
      if (timerRef.current) clearTimeout(timerRef.current);
      setTimeoutWarning(false);
      setGenerating(false);
    }
  };

  const downloadImage = () => {
    if (!result) return;
    const a = document.createElement('a');
    a.href = result.image;
    a.download = `determine-ai-${Date.now()}.png`;
    a.click();
  };

  return (
    <div className="imggen-page" style={{ minHeight: '100vh', background: '#08080d', color: '#e8e8f0', fontFamily: "'Inter', sans-serif" }}>
      <nav className="page-nav" style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 40px', background: 'rgba(8,8,13,0.85)', backdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(30,30,46,0.5)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }} onClick={() => navigate('/')}>
          <Logo size={28} />
          <span style={{ fontWeight: 700, fontSize: 15 }}>Determine-AI</span>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={() => navigate('/')} style={{ background: 'none', border: '1px solid rgba(30,30,46,0.5)', borderRadius: 8, padding: '6px 14px', color: '#6b6b80', fontSize: 13, cursor: 'pointer' }}>Home</button>
          <button onClick={() => navigate('/chat')} style={{ background: '#7c3aed', border: 'none', borderRadius: 8, padding: '6px 14px', color: '#fff', fontSize: 13, cursor: 'pointer' }}>Open Chat</button>
        </div>
      </nav>

      <div className="imggen-header" style={{ maxWidth: 900, margin: '0 auto', padding: '100px 24px 80px' }}>
        <div style={{ marginBottom: 32 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.2)', borderRadius: 20, padding: '4px 14px', fontSize: 12, color: '#22c55e', fontWeight: 500, marginBottom: 16 }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21,15 16,10 5,21"/></svg>
            Image Generation
          </div>
          <h1 className="imggen-title" style={{ fontSize: 32, fontWeight: 700, marginBottom: 8, letterSpacing: '-0.03em' }}>Generate Images</h1>
          <p className="imggen-subtitle" style={{ color: '#6b6b80', fontSize: 15, lineHeight: 1.6 }}>Create images with AI. Powered by Pollinations.ai.</p>
        </div>

        <div className="imggen-layout" style={{ display: 'grid', gridTemplateColumns: result ? '1fr 1fr' : '1fr', gap: 24 }}>
          {/* Controls */}
          <div className="imggen-controls">
            {/* Prompt */}
            <div style={{ marginBottom: 20 }}>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#8888a0', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Prompt</label>
              <textarea value={prompt} onChange={e => setPrompt(e.target.value)} rows={3} placeholder="Describe the image you want to generate..."
                style={{ width: '100%', background: '#0e0e14', border: '1px solid rgba(30,30,46,0.6)', borderRadius: 10, padding: '12px 14px', color: '#e8e8f0', fontSize: 14, outline: 'none', resize: 'vertical', fontFamily: 'inherit', lineHeight: 1.6, boxSizing: 'border-box' }}
                onKeyDown={e => { if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) { e.preventDefault(); handleGenerate(); } }} />
              <div style={{ fontSize: 11, color: '#4a4a5a', marginTop: 4 }}>Ctrl+Enter to generate</div>
            </div>

            {/* Presets */}
            <div style={{ marginBottom: 20 }}>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#8888a0', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Style Presets</label>
              <div className="imggen-presets" style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {PRESETS.map((p, i) => (
                  <button key={i} onClick={() => setPrompt(p.prompt)}
                    style={{ background: 'rgba(14,14,20,0.7)', border: '1px solid rgba(30,30,46,0.5)', borderRadius: 8, padding: '5px 12px', color: '#8888a0', fontSize: 12, cursor: 'pointer', transition: 'all 0.15s' }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = '#7c3aed40'; e.currentTarget.style.color = '#e8e8f0'; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(30,30,46,0.5)'; e.currentTarget.style.color = '#8888a0'; }}>
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Model */}
            <div style={{ marginBottom: 20 }}>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#8888a0', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Model</label>
              <div className="imggen-models" style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {['flux', 'flux-realism', 'flux-anime', 'flux-3d', 'turbo'].map(m => (
                  <button key={m} onClick={() => setModel(m)}
                    style={{ background: model === m ? 'rgba(124,58,237,0.15)' : 'rgba(14,14,20,0.7)', border: `1px solid ${model === m ? 'rgba(124,58,237,0.4)' : 'rgba(30,30,46,0.5)'}`, borderRadius: 8, padding: '6px 14px', color: model === m ? '#a78bfa' : '#6b6b80', fontSize: 12, fontWeight: 500, cursor: 'pointer', transition: 'all 0.15s' }}>
                    {m}
                  </button>
                ))}
              </div>
            </div>

            {/* Size + Enhance */}
            <div className="imggen-size-row" style={{ display: 'flex', gap: 16, marginBottom: 24 }}>
              <div className="imggen-sizes" style={{ flex: 1, display: 'flex', gap: 6 }}>
                  {SIZES.map((s, i) => (
                    <button key={i} onClick={() => setSize(i)}
                      style={{ flex: 1, background: size === i ? 'rgba(124,58,237,0.15)' : 'rgba(14,14,20,0.7)', border: `1px solid ${size === i ? 'rgba(124,58,237,0.4)' : 'rgba(30,30,46,0.5)'}`, borderRadius: 8, padding: '6px 8px', color: size === i ? '#a78bfa' : '#6b6b80', fontSize: 12, cursor: 'pointer', transition: 'all 0.15s' }}>
                      {s.label}
                    </button>
                  ))}
              </div>
              <div style={{ display: 'flex', alignItems: 'flex-end', paddingBottom: 2 }}>
                <button onClick={() => setEnhance(!enhance)}
                  style={{ display: 'flex', alignItems: 'center', gap: 6, background: enhance ? 'rgba(34,197,94,0.1)' : 'rgba(14,14,20,0.7)', border: `1px solid ${enhance ? 'rgba(34,197,94,0.3)' : 'rgba(30,30,46,0.5)'}`, borderRadius: 8, padding: '6px 14px', color: enhance ? '#22c55e' : '#6b6b80', fontSize: 12, cursor: 'pointer', transition: 'all 0.15s', whiteSpace: 'nowrap' }}>
                  <span style={{ fontSize: 14 }}>{enhance ? '✓' : '○'}</span> Enhance
                </button>
              </div>
            </div>

            {/* Generate */}
            <button className="imggen-gen-btn" onClick={handleGenerate} disabled={!prompt.trim() || generating}
              style={{ width: '100%', background: generating || !prompt.trim() ? '#3a3a4a' : 'linear-gradient(135deg, #7c3aed, #22c55e)', border: 'none', borderRadius: 12, padding: '14px 24px', color: '#fff', fontSize: 15, fontWeight: 600, cursor: generating || !prompt.trim() ? 'not-allowed' : 'pointer', transition: 'all 0.2s', marginBottom: 20 }}>
              {generating ? (
                <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                  <span className="img-gen-spinner" /> Generating...
                  {timeoutWarning && <span style={{ fontSize: 11, opacity: 0.7 }}>(this can take up to 60s)</span>}
                </span>
              ) : (
                <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21,15 16,10 5,21"/></svg>
                  Generate Image
                </span>
              )}
            </button>

            {error && (
              <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 10, padding: '10px 14px', fontSize: 13, color: '#ef4444', marginBottom: 20 }}>{error}</div>
            )}
          </div>

          {/* Result */}
          {result && (
            <div className="imggen-result">
              <div style={{ background: 'rgba(14,14,20,0.7)', border: '1px solid rgba(30,30,46,0.5)', borderRadius: 14, overflow: 'hidden' }}>
                <div style={{ position: 'relative' }}>
                  <img src={result.image} alt={result.prompt} style={{ width: '100%', display: 'block' }} />
                  <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'linear-gradient(transparent, rgba(0,0,0,0.8))', padding: '20px 14px 12px' }}>
                    <div style={{ fontSize: 12, color: '#a0a0b4', lineHeight: 1.5 }}>{result.prompt}</div>
                  </div>
                </div>
                <div className="imggen-result-meta" style={{ padding: '10px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ fontSize: 11, color: '#6b6b80' }}>{result.model} · {result.size} · seed:{result.seed}</div>
                  <button onClick={downloadImage} style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'rgba(124,58,237,0.15)', border: '1px solid rgba(124,58,237,0.3)', borderRadius: 6, padding: '5px 12px', color: '#a78bfa', fontSize: 12, cursor: 'pointer' }}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7,10 12,15 17,10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                    Download
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* History */}
        {history.length > 0 && (
          <div style={{ marginTop: 40 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <h3 style={{ fontSize: 14, fontWeight: 600, color: '#8888a0', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Recent Generations</h3>
              <button onClick={() => setShowHistory(!showHistory)} style={{ background: 'none', border: '1px solid rgba(30,30,46,0.5)', borderRadius: 6, padding: '4px 10px', color: '#6b6b80', fontSize: 11, cursor: 'pointer' }}>
                {showHistory ? 'Hide' : 'Show'}
              </button>
            </div>
            {showHistory && (
              <div className="imggen-history" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 10 }}>
                {history.map((h, i) => (
                  <div key={i} onClick={() => setResult(h)} style={{ cursor: 'pointer', background: 'rgba(14,14,20,0.7)', border: '1px solid rgba(30,30,46,0.5)', borderRadius: 10, overflow: 'hidden', transition: 'all 0.15s' }}
                    onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(124,58,237,0.3)'}
                    onMouseLeave={e => e.currentTarget.style.borderColor = 'rgba(30,30,46,0.5)'}>
                    <img src={h.image} alt={h.prompt} style={{ width: '100%', aspectRatio: '1', objectFit: 'cover' }} />
                    <div style={{ padding: '6px 8px' }}>
                      <div style={{ fontSize: 11, color: '#8888a0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{h.prompt}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
