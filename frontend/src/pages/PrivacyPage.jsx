import React from 'react';
import { useNavigate } from 'react-router-dom';
import Logo from '../Logo';

export default function PrivacyPage() {
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
        <h1 style={{ fontSize: 36, fontWeight: 700, marginBottom: 8, letterSpacing: '-0.03em' }}>Privacy Policy</h1>
        <p style={{ color: '#6b6b80', fontSize: 13, marginBottom: 40 }}>Last updated: July 2025</p>

        <div style={{ fontSize: 15, lineHeight: 1.8, color: '#8888a0' }}>
          <section style={{ marginBottom: 32 }}>
            <h2 style={{ fontSize: 20, fontWeight: 600, color: '#e8e8f0', marginBottom: 12 }}>Data Collection</h2>
            <p>Determine-AI is a self-hosted application. When you deploy it on your own infrastructure, all data remains on your server. We do not collect, store, or transmit any user data from self-hosted instances.</p>
          </section>

          <section style={{ marginBottom: 32 }}>
            <h2 style={{ fontSize: 20, fontWeight: 600, color: '#e8e8f0', marginBottom: 12 }}>Chat Data</h2>
            <p>All chat messages, sessions, and user data are stored in your own MongoDB database. No chat data is sent to external services. The AI model runs entirely on your hardware.</p>
          </section>

          <section style={{ marginBottom: 32 }}>
            <h2 style={{ fontSize: 20, fontWeight: 600, color: '#e8e8f0', marginBottom: 12 }}>Authentication</h2>
            <p>User credentials are stored as hashed passwords in your database. If you enable Google OAuth, the authentication flow is handled directly between your server and Google's OAuth service. No intermediate parties are involved.</p>
          </section>

          <section style={{ marginBottom: 32 }}>
            <h2 style={{ fontSize: 20, fontWeight: 600, color: '#e8e8f0', marginBottom: 12 }}>Analytics & Tracking</h2>
            <p>Determine-AI contains no telemetry, analytics, or tracking code. No cookies are set for tracking purposes. The application does not phone home to any external server.</p>
          </section>

          <section style={{ marginBottom: 32 }}>
            <h2 style={{ fontSize: 20, fontWeight: 600, color: '#e8e8f0', marginBottom: 12 }}>Third-Party Services</h2>
            <p>The only external network calls made by Determine-AI are: (1) optional web search via DuckDuckGo when explicitly triggered by the user, and (2) optional Google OAuth for authentication. No data is sent to any other third-party service.</p>
          </section>

          <section>
            <h2 style={{ fontSize: 20, fontWeight: 600, color: '#e8e8f0', marginBottom: 12 }}>Contact</h2>
            <p>For privacy-related questions, please open an issue on the project's GitHub repository.</p>
          </section>
        </div>
      </div>
    </div>
  );
}
