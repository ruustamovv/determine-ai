import React from 'react';
import { useNavigate } from 'react-router-dom';
import Logo from '../Logo';

export default function AboutPage() {
  const navigate = useNavigate();
  return (
    <div className="info-page" style={{ minHeight: '100vh', background: '#08080d', color: '#e8e8f0', fontFamily: "'Inter', sans-serif" }}>
      <nav className="page-nav" style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 40px', background: 'rgba(8,8,13,0.85)', backdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(30,30,46,0.5)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }} onClick={() => navigate('/')}>
          <Logo size={28} />
          <span style={{ fontWeight: 700, fontSize: 15 }}>Determine-AI</span>
        </div>
        <button onClick={() => navigate('/')} style={{ background: 'none', border: '1px solid rgba(30,30,46,0.5)', borderRadius: 8, padding: '6px 14px', color: '#6b6b80', fontSize: 13, cursor: 'pointer' }}>Home</button>
      </nav>
      <div className="info-content" style={{ maxWidth: 720, margin: '0 auto', padding: '120px 24px 80px' }}>
        <h1 style={{ fontSize: 36, fontWeight: 700, marginBottom: 8, letterSpacing: '-0.03em' }}>About Determine-AI</h1>
        <p style={{ color: '#6b6b80', fontSize: 15, marginBottom: 40, lineHeight: 1.7 }}>A custom-built AI assistant designed for developers who care about privacy, control, and having full ownership of their AI infrastructure.</p>

        <div style={{ marginBottom: 40 }}>
          <h2 style={{ fontSize: 22, fontWeight: 600, marginBottom: 16 }}>Our Mission</h2>
          <p style={{ fontSize: 15, lineHeight: 1.8, color: '#8888a0' }}>
            Determine-AI was built with a simple goal: give developers a powerful, customizable AI assistant that they can fully control. No data leaves your server. No external APIs. No subscriptions to third-party AI services. You own everything.
          </p>
        </div>

        <div style={{ marginBottom: 40 }}>
          <h2 style={{ fontSize: 22, fontWeight: 600, marginBottom: 16 }}>Technology</h2>
          <p style={{ fontSize: 15, lineHeight: 1.8, color: '#8888a0', marginBottom: 16 }}>
            Built with modern, battle-tested technologies:
          </p>
          <div className="about-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
            {[
              { name: 'FastAPI', desc: 'High-performance Python backend' },
              { name: 'React + Vite', desc: 'Fast, modern frontend' },
              { name: 'MongoDB', desc: 'Flexible document database' },
              { name: 'Fine-Tuned LLM', desc: 'Custom-trained language model' },
              { name: 'Pollinations.ai', desc: 'AI image generation' },
              { name: 'JWT Auth', desc: 'Secure authentication' },
            ].map((t, i) => (
              <div key={i} className="about-card" style={{ background: 'rgba(14,14,20,0.7)', border: '1px solid rgba(30,30,46,0.5)', borderRadius: 12, padding: '18px 16px' }}>
                <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>{t.name}</div>
                <div style={{ fontSize: 12, color: '#6b6b80' }}>{t.desc}</div>
              </div>
            ))}
          </div>
        </div>

        <div>
          <h2 style={{ fontSize: 22, fontWeight: 600, marginBottom: 16 }}>Open Source</h2>
          <p style={{ fontSize: 15, lineHeight: 1.8, color: '#8888a0' }}>
            Determine-AI is built on open-source technology and designed to be extended. Contribute, customize, and make it your own.
          </p>
        </div>
      </div>
    </div>
  );
}
