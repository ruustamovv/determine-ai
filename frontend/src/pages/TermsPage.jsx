import React from 'react';
import { useNavigate } from 'react-router-dom';
import Logo from '../Logo';

export default function TermsPage() {
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
        <h1 style={{ fontSize: 36, fontWeight: 700, marginBottom: 8, letterSpacing: '-0.03em' }}>Terms of Service</h1>
        <p style={{ color: '#6b6b80', fontSize: 13, marginBottom: 40 }}>Last updated: July 2025</p>

        <div style={{ fontSize: 15, lineHeight: 1.8, color: '#8888a0' }}>
          <section style={{ marginBottom: 32 }}>
            <h2 style={{ fontSize: 20, fontWeight: 600, color: '#e8e8f0', marginBottom: 12 }}>Acceptance</h2>
            <p>By deploying or using Determine-AI, you agree to these terms. Determine-AI is open-source software provided under the MIT license.</p>
          </section>

          <section style={{ marginBottom: 32 }}>
            <h2 style={{ fontSize: 20, fontWeight: 600, color: '#e8e8f0', marginBottom: 12 }}>Usage</h2>
            <p>You are free to use, modify, and distribute Determine-AI for any purpose, including commercial use. You are responsible for ensuring your use complies with applicable laws and regulations.</p>
          </section>

          <section style={{ marginBottom: 32 }}>
            <h2 style={{ fontSize: 20, fontWeight: 600, color: '#e8e8f0', marginBottom: 12 }}>AI Outputs</h2>
            <p>Determine-AI generates responses using a language model. AI-generated content may not always be accurate. You are responsible for verifying the accuracy and appropriateness of AI-generated responses before use.</p>
          </section>

          <section style={{ marginBottom: 32 }}>
            <h2 style={{ fontSize: 20, fontWeight: 600, color: '#e8e8f0', marginBottom: 12 }}>Limitation of Liability</h2>
            <p>Determine-AI is provided "as is" without warranties. The developers are not liable for any damages arising from the use of this software.</p>
          </section>

          <section>
            <h2 style={{ fontSize: 20, fontWeight: 600, color: '#e8e8f0', marginBottom: 12 }}>Changes</h2>
            <p>These terms may be updated from time to time. Continued use of Determine-AI after changes constitutes acceptance of the new terms.</p>
          </section>
        </div>
      </div>
    </div>
  );
}
