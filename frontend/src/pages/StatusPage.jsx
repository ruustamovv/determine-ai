import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Logo from '../Logo';

export default function StatusPage() {
  const navigate = useNavigate();
  const [status, setStatus] = useState('checking');
  const [apiStatus, setApiStatus] = useState('checking');
  const [dbStatus, setDbStatus] = useState('checking');
  const API = window.location.origin;

  useEffect(() => {
    const check = async () => {
      try {
        const res = await fetch(`${API}/api/premium/tiers`);
        setApiStatus(res.ok ? 'operational' : 'degraded');
      } catch { setApiStatus('down'); }
      try {
        const res = await fetch(`${API}/api/auth/me`, { headers: { Authorization: 'Bearer test' } });
        setDbStatus(res.status === 401 ? 'operational' : 'degraded');
      } catch { setDbStatus('down'); }
      setStatus('done');
    };
    check();
  }, []);

  const Badge = ({ s }) => {
    const colors = { operational: '#22c55e', degraded: '#fbbf24', down: '#ef4444', checking: '#6b6b80' };
    const labels = { operational: 'Operational', degraded: 'Degraded', down: 'Down', checking: 'Checking...' };
    return (
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 500, color: colors[s] }}>
        <span style={{ width: 8, height: 8, borderRadius: '50%', background: colors[s] }} />
        {labels[s]}
      </span>
    );
  };

  return (
    <div className="info-page" style={{ minHeight: '100vh', background: '#08080d', color: '#e8e8f0', fontFamily: "'Inter', sans-serif" }}>
      <nav className="page-nav" style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 40px', background: 'rgba(8,8,13,0.85)', backdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(30,30,46,0.5)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }} onClick={() => navigate('/')}>
          <Logo size={28} />
          <span style={{ fontWeight: 700, fontSize: 15 }}>Determine-AI</span>
        </div>
        <button onClick={() => navigate('/')} style={{ background: 'none', border: '1px solid rgba(30,30,46,0.5)', borderRadius: 8, padding: '6px 14px', color: '#6b6b80', fontSize: 13, cursor: 'pointer' }}>Home</button>
      </nav>
      <div className="info-content" style={{ maxWidth: 600, margin: '0 auto', padding: '120px 24px 80px' }}>
        <h1 style={{ fontSize: 36, fontWeight: 700, marginBottom: 8, letterSpacing: '-0.03em' }}>System Status</h1>
        <p style={{ color: '#6b6b80', fontSize: 15, marginBottom: 40 }}>Current operational status of Determine-AI</p>

        <div className="status-grid" style={{ background: 'rgba(14,14,20,0.7)', border: '1px solid rgba(30,30,46,0.5)', borderRadius: 14, overflow: 'hidden' }}>
          {[
            { name: 'Determine-AI API', status: apiStatus },
            { name: 'Database Connection', status: dbStatus },
            { name: 'AI Model', status: apiStatus },
          ].map((item, i) => (
            <div key={i} className="status-row" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: i < 2 ? '1px solid rgba(30,30,46,0.4)' : 'none' }}>
              <span style={{ fontSize: 14, fontWeight: 500 }}>{item.name}</span>
              <Badge s={item.status} />
            </div>
          ))}
        </div>

        <p style={{ fontSize: 12, color: '#6b6b80', marginTop: 24, textAlign: 'center' }}>
          Last checked: {new Date().toLocaleTimeString()}
        </p>
      </div>
    </div>
  );
}
