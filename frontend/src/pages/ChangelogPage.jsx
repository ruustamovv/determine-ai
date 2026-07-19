import React from 'react';
import { useNavigate } from 'react-router-dom';
import Logo from '../Logo';

const ENTRIES = [
  { version: '3.0', date: 'July 2025', title: 'Complete Rewrite', changes: ['Full REST API with JWT auth', 'Google OAuth integration', 'Admin dashboard with user management', 'Premium subscription tiers', 'Image analysis with BLIP', 'Web search via DuckDuckGo', 'CLI tool for terminal access', 'Multi-language support (EN/RU/UZ)', 'Light/dark theme', 'Customizable settings'] },
  { version: '2.5', date: 'May 2025', title: 'Streaming & Sessions', changes: ['Real-time streaming responses', 'Session management with MongoDB', 'Chat history persistence', 'Improved UI with animations'] },
  { version: '2.0', date: 'March 2025', title: 'Admin & Premium', changes: ['Admin panel for user management', 'Subscription tier system', 'Role-based access control', 'Announcement system'] },
  { version: '1.0', date: 'January 2025', title: 'Initial Release', changes: ['Basic AI chat interface', 'User registration and login', 'Local inference engine', 'React frontend'] },
];

export default function ChangelogPage() {
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
        <h1 style={{ fontSize: 36, fontWeight: 700, marginBottom: 8, letterSpacing: '-0.03em' }}>Changelog</h1>
        <p style={{ color: '#6b6b80', fontSize: 15, marginBottom: 48 }}>What's new in Determine-AI</p>
        <div className="changelog-timeline" style={{ position: 'relative', borderLeft: '2px solid rgba(124,58,237,0.2)', paddingLeft: 28 }}>
          {ENTRIES.map((e, i) => (
            <div key={i} className="changelog-entry" style={{ marginBottom: 48, position: 'relative' }}>
              <div className="changelog-dot" style={{ position: 'absolute', left: -35, top: 4, width: 12, height: 12, borderRadius: '50%', background: '#7c3aed', border: '2px solid #08080d' }} />
              <div className="changelog-version" style={{ fontSize: 12, color: '#a78bfa', fontWeight: 600, marginBottom: 4, fontFamily: "'JetBrains Mono', monospace" }}>v{e.version} · {e.date}</div>
              <h3 className="changelog-title" style={{ fontSize: 20, fontWeight: 600, marginBottom: 12 }}>{e.title}</h3>
              <ul style={{ listStyle: 'none', padding: 0 }}>
                {e.changes.map((c, j) => (
                  <li key={j} className="changelog-change" style={{ fontSize: 14, color: '#8888a0', padding: '4px 0', display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                    <span style={{ color: '#22c55e', marginTop: 2 }}>+</span>{c}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
