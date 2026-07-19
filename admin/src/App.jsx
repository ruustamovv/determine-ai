import React, { useState, useEffect, useCallback, useRef } from 'react';
import { BrowserRouter, Routes, Route, Navigate, NavLink, useLocation, useNavigate } from 'react-router-dom';
import './App.css';

const API = window.location.origin;

const ROLES = ['user', 'moderator', 'admin', 'owner'];
const TIERS = [
  { id: 'free', name: 'Starter', color: '#6b7280' },
  { id: 'basic', name: 'Basic', color: '#3b82f6' },
  { id: 'pro', name: 'Professional', color: '#7c3aed' },
  { id: 'enterprise', name: 'Enterprise', color: '#f59e0b' },
];

function Login({ onLogin, theme }) {
  const [u, setU] = useState('');
  const [p, setP] = useState('');
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(false);

  const go = async (e) => {
    e.preventDefault();
    setErr('');
    setLoading(true);
    try {
      const r = await fetch(`${API}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: u, password: p }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.detail || 'Failed');
      if (!['admin', 'owner'].includes(d.role)) throw new Error('Admin access required');
      localStorage.setItem('admin_token', d.token);
      onLogin(d);
    } catch (e) { setErr(e.message); }
    finally { setLoading(false); }
  };

  return (
    <div className={`login-page ${theme === 'light' ? 'login-light' : ''}`}>
      <div className="glow-bg"><div className="gl g1"></div><div className="gl g2"></div></div>
      <div className="grid-bg"></div>
      <div className="login-card">
        <div className="login-logo">
          <svg width="48" height="48" viewBox="0 0 40 40" fill="none">
            <defs>
              <linearGradient id="lg-login" x1="4" y1="2" x2="37" y2="38" gradientUnits="userSpaceOnUse">
                <stop stopColor="#7c3aed" /><stop offset="1" stopColor="#3b82f6" />
              </linearGradient>
            </defs>
            <path d="M4 8L19 2L37 20L19 38L4 32Z" fill="url(#lg-login)" />
            <path d="M4 8L17 20L19 2Z" fill="white" fillOpacity="0.14" />
            <path d="M19 2L17 20L37 20Z" fill="white" fillOpacity="0.07" />
            <path d="M37 20L17 20L19 38Z" fill="black" fillOpacity="0.07" />
            <path d="M19 38L17 20L4 32Z" fill="black" fillOpacity="0.14" />
            <path d="M4 32L17 20L4 8Z" fill="black" fillOpacity="0.22" />
            <path d="M4 8L19 2L37 20L19 38L4 32Z" stroke="white" strokeOpacity="0.18" strokeWidth="0.6" strokeLinejoin="round" />
          </svg>
        </div>
        <h1>Determine-AI</h1>
        <p>Admin Dashboard</p>
        {err && <div className="alert-err">{err}</div>}
        <form onSubmit={go}>
          <input type="text" placeholder="Username" value={u} onChange={e => setU(e.target.value)} required autoFocus />
          <input type="password" placeholder="Password" value={p} onChange={e => setP(e.target.value)} required />
          <button type="submit" disabled={loading}>{loading ? '...' : 'Sign In'}</button>
        </form>
      </div>
    </div>
  );
}

function LineChart({ data }) {
  if (!data || data.length === 0) return null;
  const max = Math.max(...data.map(d => d.count), 1);
  const w = 600, h = 160, pad = 40;
  const points = data.map((d, i) => ({
    x: pad + (i / (data.length - 1 || 1)) * (w - pad * 2),
    y: h - pad - (d.count / max) * (h - pad * 2),
    label: d.date,
    count: d.count,
  }));
  const pathD = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
  const areaD = pathD + ` L ${points[points.length - 1].x} ${h - pad} L ${points[0].x} ${h - pad} Z`;

  return (
    <div className="chart-line-container">
      <h3>Messages — Last 7 Days</h3>
      <svg viewBox={`0 0 ${w} ${h}`} className="chart-line-svg">
        <defs>
          <linearGradient id="lineGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#7c3aed" stopOpacity="0.3"/>
            <stop offset="100%" stopColor="#7c3aed" stopOpacity="0"/>
          </linearGradient>
        </defs>
        {[0, 0.25, 0.5, 0.75, 1].map((f, i) => {
          const yy = h - pad - f * (h - pad * 2);
          return <g key={i}><line x1={pad} y1={yy} x2={w - pad} y2={yy} stroke="#e5e7eb" strokeWidth="1" strokeDasharray="4,4"/><text x={pad - 8} y={yy + 4} textAnchor="end" fill="#9ca3af" fontSize="10">{Math.round(max * f)}</text></g>;
        })}
        <path d={areaD} fill="url(#lineGrad)" className="area-path" />
        <path d={pathD} fill="none" stroke="#7c3aed" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="chart-path" />
        {points.map((p, i) => (
          <g key={i} className="data-point">
            <title>{p.label}: {p.count} messages</title>
            <circle cx={p.x} cy={p.y} r="4" fill="#7c3aed" stroke="white" strokeWidth="2" />
            <text x={p.x} y={h - pad + 16} textAnchor="middle" fill="#9ca3af" fontSize="10">{p.label}</text>
            {p.count > 0 && <text x={p.x} y={p.y - 10} textAnchor="middle" fill="#7c3aed" fontSize="11" fontWeight="600">{p.count}</text>}
          </g>
        ))}
      </svg>
    </div>
  );
}

function BarChart3D({ data }) {
  if (!data || data.length === 0) return null;
  const maxCount = Math.max(...data.map(d => d.count), 1);
  const colors = ['#7c3aed', '#6d28d9', '#5b21b6', '#4c1d95', '#3b82f6', '#2563eb', '#1d4ed8'];
  return (
    <div className="chart-3d-container">
      <h3>Messages — 3D View</h3>
      <div className="chart-3d">
        {data.map((d, i) => {
          const heightPct = Math.max((d.count / maxCount) * 100, 4);
          return (
            <div key={i} className="bar-3d-wrapper">
              <div className="bar-3d-value">{d.count}</div>
              <div className="bar-3d-track">
                <div className="bar-3d-fill" style={{ height: `${heightPct}%`, background: `linear-gradient(180deg, ${colors[i]}, ${colors[i]}99)`, animationDelay: `${i * 0.1}s` }}>
                  <div className="bar-3d-shine"></div>
                </div>
              </div>
              <div className="bar-3d-label">{d.date}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function AnimatedCounter({ target, duration = 2000 }) {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  const counted = useRef(false);

  useEffect(() => {
    if (!target || target === 0) return;
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !counted.current) {
        counted.current = true;
        const start = performance.now();
        const animate = (now) => {
          const elapsed = now - start;
          const progress = Math.min(elapsed / duration, 1);
          const eased = 1 - Math.pow(1 - progress, 3);
          setCount(Math.round(eased * target));
          if (progress < 1) requestAnimationFrame(animate);
        };
        requestAnimationFrame(animate);
      }
    }, { threshold: 0.3 });
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [target, duration]);

  return <span ref={ref}>{count.toLocaleString()}</span>;
}

function MonthlyVisitorsChart() {
  const data = [
    { month: 'Jan', visitors: 1240 },
    { month: 'Feb', visitors: 1890 },
    { month: 'Mar', visitors: 2340 },
    { month: 'Apr', visitors: 2100 },
    { month: 'May', visitors: 3200 },
    { month: 'Jun', visitors: 2850 },
    { month: 'Jul', visitors: 3100 },
  ];
  const max = Math.max(...data.map(d => d.visitors), 1);
  const w = 600, h = 180, pad = 40;

  return (
    <div className="monthly-chart-container">
      <h3>Monthly Visitors — 2026</h3>
      <svg viewBox={`0 0 ${w} ${h}`} className="chart-line-svg">
        <defs>
          <linearGradient id="monthlyBarGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.9"/>
            <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.4"/>
          </linearGradient>
        </defs>
        {[0, 0.25, 0.5, 0.75, 1].map((f, i) => {
          const yy = h - pad - f * (h - pad * 2);
          return (
            <g key={i}>
              <line x1={pad} y1={yy} x2={w - pad} y2={yy} stroke="#e5e7eb" strokeWidth="1" strokeDasharray="4,4"/>
              <text x={pad - 8} y={yy + 4} textAnchor="end" fill="#9ca3af" fontSize="10">{Math.round(max * f)}</text>
            </g>
          );
        })}
        {data.map((d, i) => {
          const barW = ((w - pad * 2) / data.length) * 0.55;
          const gap = ((w - pad * 2) / data.length) * 0.45;
          const x = pad + (i / data.length) * (w - pad * 2) + gap / 2;
          const barH = (d.visitors / max) * (h - pad * 2);
          const y = h - pad - barH;
          return (
            <g key={i} className="data-point">
              <title>{d.month}: {d.visitors.toLocaleString()} visitors</title>
              <rect x={x} y={y} width={barW} height={barH} rx="4" fill="url(#monthlyBarGrad)" style={{ animationDelay: `${i * 0.1}s` }} />
              <text x={x + barW / 2} y={y - 6} textAnchor="middle" fill="#3b82f6" fontSize="10" fontWeight="600">{d.visitors.toLocaleString()}</text>
              <text x={x + barW / 2} y={h - pad + 16} textAnchor="middle" fill="#9ca3af" fontSize="10">{d.month}</text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

const NAV_ITEMS = [
  { id: 'overview', label: 'Overview', path: '/admin/overview', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
  { id: 'messages', label: 'Messages', path: '/admin/messages', icon: 'M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z' },
  { id: 'sessions', label: 'Sessions', path: '/admin/sessions', icon: 'M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10' },
  { id: 'users', label: 'Users', path: '/admin/users', icon: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z' },
  { id: 'train', label: 'Train', path: '/admin/train', icon: 'M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253' },
  { id: 'blog', label: 'Blog', path: '/admin/blog', icon: 'M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z' },
  { id: 'profile', label: 'Profile', path: '/admin/profile', icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z' },
];

function AdminTrain({ token, h }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [teachings, setTeachings] = useState([]);
  const messagesEndRef = useRef(null);

  const loadTeachings = useCallback(async () => {
    const r = await fetch(`${API}/api/admin/teachings`, { headers: h });
    if (r.ok) setTeachings(await r.json());
  }, [token]);

  useEffect(() => { loadTeachings(); }, [loadTeachings]);
  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const send = async () => {
    if (!input.trim() || sending) return;
    const userMsg = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setSending(true);

    try {
      const r = await fetch(`${API}/api/admin/train-chat`, {
        method: 'POST', headers: h,
        body: JSON.stringify({ message: userMsg }),
      });
      if (!r.ok) throw new Error('Failed');
      const reader = r.body.getReader();
      const decoder = new TextDecoder();
      let added = false;
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const lines = decoder.decode(value).split('\n');
        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          try {
            const data = JSON.parse(line.slice(6));
            if (data.token) {
              if (!added) {
                setMessages(prev => [...prev, { role: 'assistant', content: data.token, streaming: true }]);
                added = true;
              } else {
                setMessages(prev => {
                  const n = [...prev];
                  n[n.length - 1] = { ...n[n.length - 1], content: n[n.length - 1].content + data.token };
                  return n;
                });
              }
            }
            if (data.done) {
              setMessages(prev => {
                const n = [...prev];
                if (n.length > 0) n[n.length - 1] = { ...n[n.length - 1], streaming: false };
                return n;
              });
              if (data.teaching_created) loadTeachings();
            }
          } catch (e) {}
        }
      }
    } catch (e) {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Error: ' + e.message, error: true }]);
    }
    setSending(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); }
  };

  const deleteTeaching = async (id) => {
    await fetch(`${API}/api/admin/teachings/${id}`, { method: 'DELETE', headers: h });
    loadTeachings();
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 20, height: 'calc(100vh - 140px)' }}>
      <div style={{ display: 'flex', flexDirection: 'column', background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 16, overflow: 'hidden' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', fontSize: 14, fontWeight: 600 }}>
          Training Chat — Teach the AI by conversation
        </div>
        <div style={{ flex: 1, overflowY: 'auto', padding: 20, display: 'flex', flexDirection: 'column', gap: 14 }}>
          {messages.length === 0 && (
            <div style={{ textAlign: 'center', color: 'var(--text2)', padding: '60px 20px', fontSize: 14 }}>
              <p style={{ marginBottom: 8, fontSize: 16, fontWeight: 600, color: 'var(--text)' }}>Training Mode</p>
              <p>Write to the AI as if you are teaching it. Corrections and rules you provide here will be saved as teachings and applied to all user chats.</p>
              <p style={{ marginTop: 12, fontSize: 12 }}>Example: "When users ask about pricing, always mention that Determine-AI offers 4 tiers: Starter, Basic, Professional, and Enterprise."</p>
            </div>
          )}
          {messages.map((m, i) => (
            <div key={i} style={{ display: 'flex', gap: 10, maxWidth: '85%', ...(m.role === 'user' ? { marginLeft: 'auto', flexDirection: 'row-reverse' } : {}) }}>
              <div style={{ width: 30, height: 30, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 12, color: 'white', flexShrink: 0, background: m.role === 'user' ? 'linear-gradient(135deg, #3b82f6, #1d4ed8)' : 'linear-gradient(135deg, #7c3aed, #2563eb)' }}>
                {m.role === 'user' ? 'A' : 'AI'}
              </div>
              <div style={{ padding: '12px 16px', borderRadius: 12, fontSize: 14, lineHeight: 1.6, whiteSpace: 'pre-wrap', wordBreak: 'break-word', background: m.role === 'user' ? '#1a2d4a' : 'var(--bg3)', color: m.error ? 'var(--red)' : 'var(--text)', borderBottomRightRadius: m.role === 'user' ? 4 : 12, borderBottomLeftRadius: m.role === 'assistant' ? 4 : 12 }}>
                {m.content}{m.streaming && <span style={{ display: 'inline-block', width: 2, height: 14, background: 'var(--accent)', marginLeft: 4, animation: 'blink 0.7s infinite', verticalAlign: 'text-bottom' }} />}
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
        <div style={{ padding: '12px 16px', borderTop: '1px solid var(--border)', display: 'flex', gap: 8 }}>
          <textarea value={input} onChange={e => setInput(e.target.value)} onKeyDown={handleKeyDown} placeholder="Teach the AI something..." rows={1}
            style={{ flex: 1, padding: '10px 14px', border: '1px solid var(--border)', borderRadius: 12, background: 'var(--bg)', color: 'var(--text)', fontSize: 14, fontFamily: 'inherit', resize: 'none', outline: 'none', minHeight: 42, maxHeight: 120 }} />
          <button onClick={send} disabled={sending || !input.trim()}
            style={{ padding: '10px 18px', border: 'none', borderRadius: 12, background: sending || !input.trim() ? 'var(--bg4)' : 'linear-gradient(135deg, #7c3aed, #2563eb)', color: sending || !input.trim() ? 'var(--text2)' : 'white', fontSize: 13, fontWeight: 600, cursor: sending || !input.trim() ? 'not-allowed' : 'pointer' }}>
            {sending ? '...' : 'Send'}
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 16, padding: 18 }}>
          <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 10 }}>Active Teachings ({teachings.length})</h3>
          <p style={{ fontSize: 12, color: 'var(--text2)', marginBottom: 12 }}>These teachings are injected into the AI system prompt for all users.</p>
          <div style={{ maxHeight: 300, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 8 }}>
            {teachings.map(t => (
              <div key={t.id} style={{ padding: '10px 12px', background: 'var(--bg3)', borderRadius: 10, fontSize: 12 }}>
                <div style={{ fontWeight: 600, marginBottom: 4, color: 'var(--accent2)' }}>{t.topic}</div>
                <div style={{ color: 'var(--text2)', marginBottom: 6 }}>{t.content.length > 120 ? t.content.substring(0, 120) + '...' : t.content}</div>
                <button onClick={() => deleteTeaching(t.id)} style={{ background: 'none', border: 'none', color: 'var(--red)', fontSize: 11, cursor: 'pointer', padding: 0 }}>Delete</button>
              </div>
            ))}
            {teachings.length === 0 && <p style={{ fontSize: 12, color: 'var(--text3)', textAlign: 'center', padding: 16 }}>No teachings yet. Start chatting to teach the AI.</p>}
          </div>
        </div>
        <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 16, padding: 18 }}>
          <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 8 }}>How it works</h3>
          <ul style={{ fontSize: 12, color: 'var(--text2)', lineHeight: 1.7, paddingLeft: 16 }}>
            <li>Chat with the AI in training mode</li>
            <li>When you correct or teach something, it gets saved as a "teaching"</li>
            <li>Teachings are injected into the system prompt for all users</li>
            <li>This is a fast, no-code way to adjust AI behavior</li>
            <li>For deeper changes, use the fine-tuning pipeline</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

function AdminAnnouncements({ token, h }) {
  const [announcements, setAnnouncements] = useState([]);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState(null);

  const load = useCallback(async () => {
    const r = await fetch(`${API}/api/admin/announcements`, { headers: h });
    if (r.ok) setAnnouncements(await r.json());
  }, [token]);

  useEffect(() => { load(); }, [load]);

  const create = async () => {
    if (!title.trim() || !content.trim()) return;
    setLoading(true);
    try {
      const r = await fetch(`${API}/api/admin/announcements`, {
        method: 'POST', headers: h,
        body: JSON.stringify({ title: title.trim(), content: content.trim() }),
      });
      if (!r.ok) throw new Error('Failed');
      setTitle(''); setContent('');
      setMsg({ type: 'ok', text: 'Announcement created.' });
      load();
    } catch (e) { setMsg({ type: 'err', text: e.message }); }
    setLoading(false);
  };

  const del = async (id) => {
    if (!window.confirm('Delete announcement?')) return;
    await fetch(`${API}/api/admin/announcements/${id}`, { method: 'DELETE', headers: h });
    load();
  };

  return (
    <div>
      {msg && (
        <div style={{ padding: '12px 16px', borderRadius: 10, marginBottom: 20, fontSize: 13, fontWeight: 500,
          background: msg.type === 'ok' ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)',
          border: `1px solid ${msg.type === 'ok' ? 'rgba(34,197,94,0.2)' : 'rgba(239,68,68,0.2)'}`,
          color: msg.type === 'ok' ? '#22c55e' : '#ef4444',
        }}>{msg.text}</div>
      )}

      <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 16, padding: 24, marginBottom: 20 }}>
        <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16 }}>New Announcement</h3>
        <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Title"
          style={{ width: '100%', padding: '10px 14px', border: '1px solid var(--border)', borderRadius: 10, background: 'var(--bg)', color: 'var(--text)', fontSize: 14, outline: 'none', marginBottom: 12 }} />
        <textarea value={content} onChange={e => setContent(e.target.value)} placeholder="Announcement content (visible to all users)" rows={4}
          style={{ width: '100%', padding: '10px 14px', border: '1px solid var(--border)', borderRadius: 10, background: 'var(--bg)', color: 'var(--text)', fontSize: 14, outline: 'none', marginBottom: 12, resize: 'vertical', fontFamily: 'inherit' }} />
        <button onClick={create} disabled={loading || !title.trim() || !content.trim()}
          style={{ padding: '10px 20px', border: 'none', borderRadius: 10, background: loading || !title.trim() || !content.trim() ? 'var(--bg4)' : 'linear-gradient(135deg, #7c3aed, #2563eb)', color: loading || !title.trim() || !content.trim() ? 'var(--text2)' : 'white', fontSize: 13, fontWeight: 600, cursor: loading || !title.trim() || !content.trim() ? 'not-allowed' : 'pointer' }}>
          {loading ? '...' : 'Create Announcement'}
        </button>
      </div>

      <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 16, padding: 18 }}>
        <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 12 }}>Active Announcements ({announcements.length})</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {announcements.map(a => (
            <div key={a.id} style={{ padding: '14px 16px', background: 'var(--bg3)', borderRadius: 10, border: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                <div style={{ fontSize: 14, fontWeight: 600 }}>{a.title}</div>
                <button onClick={() => del(a.id)} style={{ background: 'none', border: 'none', color: 'var(--red)', fontSize: 11, cursor: 'pointer', padding: 0, flexShrink: 0 }}>Delete</button>
              </div>
              <div style={{ fontSize: 12, color: 'var(--text2)', lineHeight: 1.6 }}>{a.content}</div>
              <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 8 }}>{new Date(a.created_at).toLocaleString()}</div>
            </div>
          ))}
          {announcements.length === 0 && <p style={{ fontSize: 12, color: 'var(--text3)', textAlign: 'center', padding: 16 }}>No announcements yet.</p>}
        </div>
      </div>
    </div>
  );
}

function AdminAIConfig({ token, h }) {
  const [config, setConfig] = useState(null);
  const [systemPrompt, setSystemPrompt] = useState('');
  const [tierVersions, setTierVersions] = useState({ free: '1.1', basic: '1.2', pro: '1.3', enterprise: '1.4' });
  const [paymentUrls, setPaymentUrls] = useState({ basic: '', pro: '', enterprise: '' });
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState(null);

  useEffect(() => {
    fetch(`${API}/api/admin/ai-config`, { headers: h })
      .then(r => r.ok ? r.json() : null)
      .then(d => {
        if (d) {
          setSystemPrompt(d.system_prompt || '');
          setTierVersions(d.tier_versions || { free: '1.1', basic: '1.2', pro: '1.3', enterprise: '1.4' });
          setPaymentUrls(d.payment_urls || { basic: '', pro: '', enterprise: '' });
          setConfig(d);
        }
      });
  }, [token]);

  const save = async () => {
    setLoading(true);
    setMsg(null);
    try {
      const r = await fetch(`${API}/api/admin/ai-config`, {
        method: 'PUT', headers: h,
        body: JSON.stringify({ system_prompt: systemPrompt, tier_versions: tierVersions, payment_urls: paymentUrls }),
      });
      if (!r.ok) throw new Error('Failed to save');
      setMsg({ type: 'ok', text: 'AI config saved.' });
    } catch (e) { setMsg({ type: 'err', text: e.message }); }
    setLoading(false);
  };

  if (!config) return <p style={{ color: 'var(--text2)', fontSize: 13 }}>Loading config...</p>;

  const inputStyle = { width: '100%', padding: '10px 14px', border: '1px solid var(--border)', borderRadius: 10, background: 'var(--bg)', color: 'var(--text)', fontSize: 14, outline: 'none', marginBottom: 8, fontFamily: 'inherit' };

  return (
    <div>
      {msg && (
        <div style={{ padding: '12px 16px', borderRadius: 10, marginBottom: 20, fontSize: 13, fontWeight: 500,
          background: msg.type === 'ok' ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)',
          border: `1px solid ${msg.type === 'ok' ? 'rgba(34,197,94,0.2)' : 'rgba(239,68,68,0.2)'}`,
          color: msg.type === 'ok' ? '#22c55e' : '#ef4444',
        }}>{msg.text}</div>
      )}

      <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 16, padding: 24, marginBottom: 20 }}>
        <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16 }}>System Prompt</h3>
        <p style={{ fontSize: 12, color: 'var(--text2)', marginBottom: 10 }}>This prompt is prepended to every chat message. Use it to define the AI's personality and rules.</p>
        <textarea value={systemPrompt} onChange={e => setSystemPrompt(e.target.value)} rows={8}
          style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.6, minHeight: 150 }} />
      </div>

      <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 16, padding: 24, marginBottom: 20 }}>
        <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16 }}>Tier Version Mapping</h3>
        <p style={{ fontSize: 12, color: 'var(--text2)', marginBottom: 12 }}>Map subscription tiers to AI version labels. Users see this version in their chat interface.</p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          {Object.entries(tierVersions).map(([tier, ver]) => (
            <div key={tier}>
              <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text2)', display: 'block', marginBottom: 4, textTransform: 'capitalize' }}>{tier}</label>
              <input value={ver} onChange={e => setTierVersions(prev => ({ ...prev, [tier]: e.target.value }))} style={inputStyle} />
            </div>
          ))}
        </div>
      </div>

      <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 16, padding: 24, marginBottom: 20 }}>
        <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16 }}>Payment URLs</h3>
        <p style={{ fontSize: 12, color: 'var(--text2)', marginBottom: 12 }}>Stripe payment link URLs for each paid tier. Used as fallback when Stripe API is not configured.</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {Object.entries(paymentUrls).map(([tier, url]) => (
            <div key={tier}>
              <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text2)', display: 'block', marginBottom: 4, textTransform: 'capitalize' }}>{tier}</label>
              <input value={url} onChange={e => setPaymentUrls(prev => ({ ...prev, [tier]: e.target.value }))} placeholder={`https://buy.stripe.com/${tier}...`} style={inputStyle} />
            </div>
          ))}
        </div>
      </div>

      <button onClick={save} disabled={loading}
        style={{ padding: '10px 24px', border: 'none', borderRadius: 10, background: 'linear-gradient(135deg, #7c3aed, #2563eb)', color: 'white', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
        {loading ? '...' : 'Save Configuration'}
      </button>
    </div>
  );
}

function AdminProfile({ token, h, user }) {
  const [displayName, setDisplayName] = useState(user?.display_name || user?.username || '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [msg, setMsg] = useState(null);
  const [loading, setLoading] = useState(false);

  const saveProfile = async () => {
    setLoading(true);
    setMsg(null);
    try {
      const r = await fetch(`${API}/api/user/profile`, {
        method: 'PUT', headers: h,
        body: JSON.stringify({ display_name: displayName }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.detail || 'Failed');
      setMsg({ type: 'ok', text: 'Display name updated.' });
    } catch (e) { setMsg({ type: 'err', text: e.message }); }
    setLoading(false);
  };

  const changePassword = async () => {
    setMsg(null);
    if (!currentPassword || !newPassword) { setMsg({ type: 'err', text: 'Fill in all fields.' }); return; }
    if (newPassword !== confirmPassword) { setMsg({ type: 'err', text: 'Passwords do not match.' }); return; }
    if (newPassword.length < 4) { setMsg({ type: 'err', text: 'Password must be at least 4 characters.' }); return; }
    setLoading(true);
    try {
      const r = await fetch(`${API}/api/user/profile`, {
        method: 'PUT', headers: h,
        body: JSON.stringify({ current_password: currentPassword, new_password: newPassword }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.detail || 'Failed');
      setMsg({ type: 'ok', text: 'Password changed.' });
      setCurrentPassword(''); setNewPassword(''); setConfirmPassword('');
    } catch (e) { setMsg({ type: 'err', text: e.message }); }
    setLoading(false);
  };

  return (
    <div>
      {msg && (
        <div style={{ padding: '12px 16px', borderRadius: 10, marginBottom: 20, fontSize: 13, fontWeight: 500,
          background: msg.type === 'ok' ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)',
          border: `1px solid ${msg.type === 'ok' ? 'rgba(34,197,94,0.2)' : 'rgba(239,68,68,0.2)'}`,
          color: msg.type === 'ok' ? '#22c55e' : '#ef4444',
        }}>{msg.text}</div>
      )}

      <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 16, padding: 24, marginBottom: 20 }}>
        <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16 }}>Account Info</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
            <span style={{ fontSize: 13, color: 'var(--text2)' }}>Username</span>
            <span style={{ fontSize: 13, fontWeight: 600 }}>{user?.username || '-'}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
            <span style={{ fontSize: 13, color: 'var(--text2)' }}>Role</span>
            <span className={`badge ${user?.role || ''}`} style={{ fontSize: 12 }}>{user?.role || '-'}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0' }}>
            <span style={{ fontSize: 13, color: 'var(--text2)' }}>Display Name</span>
            <span style={{ fontSize: 13, fontWeight: 600 }}>{user?.display_name || user?.username || '-'}</span>
          </div>
        </div>
      </div>

      <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 16, padding: 24, marginBottom: 20 }}>
        <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16 }}>Display Name</h3>
        <input value={displayName} onChange={e => setDisplayName(e.target.value)} placeholder="Display name"
          style={{ width: '100%', padding: '10px 14px', border: '1px solid var(--border)', borderRadius: 10, background: 'var(--bg)', color: 'var(--text)', fontSize: 14, outline: 'none', marginBottom: 12 }} />
        <button onClick={saveProfile} disabled={loading}
          style={{ padding: '10px 20px', border: 'none', borderRadius: 10, background: 'linear-gradient(135deg, #7c3aed, #2563eb)', color: 'white', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
          {loading ? '...' : 'Save'}
        </button>
      </div>

      <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 16, padding: 24 }}>
        <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16 }}>Change Password</h3>
        <input type="password" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} placeholder="Current password"
          style={{ width: '100%', padding: '10px 14px', border: '1px solid var(--border)', borderRadius: 10, background: 'var(--bg)', color: 'var(--text)', fontSize: 14, outline: 'none', marginBottom: 12 }} />
        <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="New password"
          style={{ width: '100%', padding: '10px 14px', border: '1px solid var(--border)', borderRadius: 10, background: 'var(--bg)', color: 'var(--text)', fontSize: 14, outline: 'none', marginBottom: 12 }} />
        <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} placeholder="Confirm new password"
          style={{ width: '100%', padding: '10px 14px', border: '1px solid var(--border)', borderRadius: 10, background: 'var(--bg)', color: 'var(--text)', fontSize: 14, outline: 'none', marginBottom: 12 }} />
        <button onClick={changePassword} disabled={loading}
          style={{ padding: '10px 20px', border: 'none', borderRadius: 10, background: 'linear-gradient(135deg, #7c3aed, #2563eb)', color: 'white', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
          {loading ? '...' : 'Change Password'}
        </button>
      </div>
    </div>
  );
}

function AdminBlog({ token, h }) {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState({ title: '', excerpt: '', content: '', tags: '', published: false });

  const loadPosts = useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch(`${API}/api/admin/blog`, { headers: h });
      if (r.ok) setPosts(await r.json());
    } catch (e) {}
    setLoading(false);
  }, [token]);

  useEffect(() => { loadPosts(); }, [loadPosts]);

  const resetForm = () => { setForm({ title: '', excerpt: '', content: '', tags: '', published: false }); setEditId(null); setShowForm(false); };

  const startEdit = (post) => {
    setForm({
      title: post.title || '',
      excerpt: post.excerpt || '',
      content: post.content || '',
      tags: (post.tags || []).join(', '),
      published: post.published || false,
    });
    setEditId(post.id);
    setShowForm(true);
  };

  const save = async () => {
    if (!form.title.trim() || !form.content.trim()) { setMsg({ type: 'err', text: 'Title and content are required.' }); return; }
    setLoading(true);
    setMsg(null);
    const body = {
      title: form.title.trim(),
      excerpt: form.excerpt.trim(),
      content: form.content,
      tags: form.tags.split(',').map(t => t.trim()).filter(Boolean),
      published: form.published,
    };
    try {
      let r;
      if (editId) {
        r = await fetch(`${API}/api/admin/blog/${editId}`, { method: 'PUT', headers: h, body: JSON.stringify(body) });
      } else {
        r = await fetch(`${API}/api/admin/blog`, { method: 'POST', headers: h, body: JSON.stringify(body) });
      }
      if (!r.ok) { const d = await r.json(); throw new Error(d.detail || 'Failed'); }
      setMsg({ type: 'ok', text: editId ? 'Post updated.' : 'Post created.' });
      resetForm();
      loadPosts();
    } catch (e) { setMsg({ type: 'err', text: e.message }); }
    setLoading(false);
  };

  const del = async (id) => {
    if (!window.confirm('Delete this blog post?')) return;
    await fetch(`${API}/api/admin/blog/${id}`, { method: 'DELETE', headers: h });
    loadPosts();
  };

  const formatDate = (d) => {
    if (!d) return '-';
    try { return new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }); }
    catch { return '-'; }
  };

  return (
    <div>
      {msg && (
        <div style={{ padding: '12px 16px', borderRadius: 10, marginBottom: 20, fontSize: 13, fontWeight: 500,
          background: msg.type === 'ok' ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)',
          border: `1px solid ${msg.type === 'ok' ? 'rgba(34,197,94,0.2)' : 'rgba(239,68,68,0.2)'}`,
          color: msg.type === 'ok' ? '#22c55e' : '#ef4444',
        }}>{msg.text}</div>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h3 style={{ fontSize: 16, fontWeight: 600 }}>Blog Posts ({posts.length})</h3>
        <button onClick={() => { resetForm(); setShowForm(true); }}
          style={{ padding: '8px 18px', border: 'none', borderRadius: 10, background: 'linear-gradient(135deg, #7c3aed, #2563eb)', color: 'white', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
          New Post
        </button>
      </div>

      {showForm && (
        <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 16, padding: 24, marginBottom: 20 }}>
          <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16 }}>{editId ? 'Edit Post' : 'New Post'}</h3>
          <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="Title"
            style={{ width: '100%', padding: '10px 14px', border: '1px solid var(--border)', borderRadius: 10, background: 'var(--bg)', color: 'var(--text)', fontSize: 14, outline: 'none', marginBottom: 12 }} />
          <input value={form.excerpt} onChange={e => setForm(f => ({ ...f, excerpt: e.target.value }))} placeholder="Excerpt (optional)"
            style={{ width: '100%', padding: '10px 14px', border: '1px solid var(--border)', borderRadius: 10, background: 'var(--bg)', color: 'var(--text)', fontSize: 14, outline: 'none', marginBottom: 12 }} />
          <textarea value={form.content} onChange={e => setForm(f => ({ ...f, content: e.target.value }))} placeholder="Content (Markdown)" rows={12}
            style={{ width: '100%', padding: '10px 14px', border: '1px solid var(--border)', borderRadius: 10, background: 'var(--bg)', color: 'var(--text)', fontSize: 14, outline: 'none', marginBottom: 12, resize: 'vertical', fontFamily: "'JetBrains Mono', monospace", lineHeight: 1.6 }} />
          <input value={form.tags} onChange={e => setForm(f => ({ ...f, tags: e.target.value }))} placeholder="Tags (comma-separated)"
            style={{ width: '100%', padding: '10px 14px', border: '1px solid var(--border)', borderRadius: 10, background: 'var(--bg)', color: 'var(--text)', fontSize: 14, outline: 'none', marginBottom: 12 }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, cursor: 'pointer', color: 'var(--text)' }}>
              <input type="checkbox" checked={form.published} onChange={e => setForm(f => ({ ...f, published: e.target.checked }))}
                style={{ accentColor: '#7c3aed' }} />
              Published
            </label>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={save} disabled={loading || !form.title.trim() || !form.content.trim()}
              style={{ padding: '10px 20px', border: 'none', borderRadius: 10, background: loading || !form.title.trim() || !form.content.trim() ? 'var(--bg4)' : 'linear-gradient(135deg, #7c3aed, #2563eb)', color: loading || !form.title.trim() || !form.content.trim() ? 'var(--text2)' : 'white', fontSize: 13, fontWeight: 600, cursor: loading || !form.title.trim() || !form.content.trim() ? 'not-allowed' : 'pointer' }}>
              {loading ? '...' : editId ? 'Update' : 'Create'}
            </button>
            <button onClick={resetForm}
              style={{ padding: '10px 20px', border: '1px solid var(--border)', borderRadius: 10, background: 'transparent', color: 'var(--text2)', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
              Cancel
            </button>
          </div>
        </div>
      )}

      <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 16, padding: 18 }}>
        <div className="table-wrap">
          <table>
            <thead><tr><th>Title</th><th>Author</th><th>Status</th><th>Tags</th><th>Created</th><th>Actions</th></tr></thead>
            <tbody>
              {posts.map(p => (
                <tr key={p.id}>
                  <td style={{ fontWeight: 600 }}>{p.title}</td>
                  <td>{p.author}</td>
                  <td>
                    <span className={`badge ${p.published ? 'admin' : 'user'}`} style={{ fontSize: 11 }}>
                      {p.published ? 'Published' : 'Draft'}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                      {(p.tags || []).slice(0, 3).map(t => (
                        <span key={t} style={{ padding: '2px 8px', borderRadius: 12, fontSize: 10, background: 'rgba(124,58,237,0.15)', color: '#a78bfa' }}>{t}</span>
                      ))}
                    </div>
                  </td>
                  <td className="time-cell">{formatDate(p.created_at)}</td>
                  <td className="actions-cell">
                    <button className="btn-xs" onClick={() => startEdit(p)}>Edit</button>
                    <button className="btn-xs danger" onClick={() => del(p.id)}>Del</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {posts.length === 0 && <p style={{ fontSize: 13, color: 'var(--text3)', textAlign: 'center', padding: 24 }}>No posts yet.</p>}
      </div>
    </div>
  );
}

function Panel({ token, user, theme, toggleTheme }) {
  const location = useLocation();
  const [stats, setStats] = useState(null);
  const [messages, setMessages] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [users, setUsers] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [search, setSearch] = useState('');
  const [editingMsg, setEditingMsg] = useState(null);
  const [editText, setEditText] = useState('');
  const [editingUser, setEditingUser] = useState(null);
  const LIMIT = 50;
  const h = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };

  const tab = (() => {
    const seg = location.pathname.split('/').filter(Boolean);
    return seg[seg.length - 1] || 'overview';
  })();

  const loadStats = useCallback(async () => {
    const r = await fetch(`${API}/api/admin/stats`, { headers: h });
    if (r.ok) setStats(await r.json());
  }, [token]);

  const loadMessages = useCallback(async (skip = 0) => {
    const r = await fetch(`${API}/api/admin/messages?limit=${LIMIT}&skip=${skip}`, { headers: h });
    if (r.ok) { const d = await r.json(); setMessages(d.messages); setTotal(d.total); }
  }, [token]);

  const loadSessions = useCallback(async () => {
    const r = await fetch(`${API}/api/admin/sessions`, { headers: h });
    if (r.ok) setSessions(await r.json());
  }, [token]);

  const loadUsers = useCallback(async () => {
    const r = await fetch(`${API}/api/admin/users`, { headers: h });
    if (r.ok) setUsers(await r.json());
  }, [token]);

  useEffect(() => { loadStats(); }, [loadStats]);
  useEffect(() => {
    setPage(0);
    setSearch('');
    setEditingMsg(null);
    setEditingUser(null);
    if (tab === 'overview') loadStats();
    if (tab === 'messages') loadMessages(0);
    if (tab === 'sessions') loadSessions();
    if (tab === 'users') loadUsers();
  }, [tab]);

  useEffect(() => {
    if (tab === 'messages') loadMessages(page * LIMIT);
  }, [page]);

  const delMsg = async (id) => {
    if (!window.confirm('Delete message?')) return;
    await fetch(`${API}/api/admin/messages/${id}`, { method: 'DELETE', headers: h });
    loadMessages(page * LIMIT);
    loadStats();
  };

  const saveEdit = async (id) => {
    await fetch(`${API}/api/admin/messages/${id}`, { method: 'PUT', headers: h, body: JSON.stringify({ content: editText }) });
    setEditingMsg(null);
    loadMessages(page * LIMIT);
  };

  const delSession = async (sid) => {
    if (!window.confirm('Delete session and all messages?')) return;
    await fetch(`${API}/api/sessions/${sid}`, { method: 'DELETE', headers: h });
    loadSessions();
    loadStats();
  };

  const delUser = async (uid) => {
    if (!window.confirm('Delete user?')) return;
    await fetch(`${API}/api/admin/users/${uid}`, { method: 'DELETE', headers: h });
    loadUsers();
    loadStats();
  };

  const updateRole = async (uid, role) => {
    await fetch(`${API}/api/admin/users/${uid}/role`, { method: 'PUT', headers: h, body: JSON.stringify({ role }) });
    setEditingUser(null);
    loadUsers();
  };

  const assignPlan = async (uid, tierId) => {
    await fetch(`${API}/api/admin/users/${uid}/plan`, { method: 'PUT', headers: h, body: JSON.stringify({ tier_id: tierId }) });
    setEditingUser(null);
    loadUsers();
  };

  const logout = () => { localStorage.removeItem('admin_token'); window.location.reload(); };

  const filtered = search ? messages.filter(m => m.content.toLowerCase().includes(search.toLowerCase()) || m.username?.toLowerCase().includes(search.toLowerCase())) : messages;

  return (
    <div className={`admin-layout ${theme === 'light' ? 'admin-light' : ''}`}>
      <aside className="admin-sidebar">
        <div className="admin-sidebar-header">
          <div className="admin-sidebar-logo">
            <svg width="36" height="36" viewBox="0 0 40 40" fill="none">
              <defs>
                <linearGradient id="lg-sidebar" x1="4" y1="2" x2="37" y2="38" gradientUnits="userSpaceOnUse">
                  <stop stopColor="#7c3aed" /><stop offset="1" stopColor="#3b82f6" />
                </linearGradient>
              </defs>
              <path d="M4 8L19 2L37 20L19 38L4 32Z" fill="url(#lg-sidebar)" />
              <path d="M4 8L17 20L19 2Z" fill="white" fillOpacity="0.14" />
              <path d="M19 2L17 20L37 20Z" fill="white" fillOpacity="0.07" />
              <path d="M37 20L17 20L19 38Z" fill="black" fillOpacity="0.07" />
              <path d="M19 38L17 20L4 32Z" fill="black" fillOpacity="0.14" />
              <path d="M4 32L17 20L4 8Z" fill="black" fillOpacity="0.22" />
              <path d="M4 8L19 2L37 20L19 38L4 32Z" stroke="white" strokeOpacity="0.18" strokeWidth="0.6" strokeLinejoin="round" />
            </svg>
          </div>
          <span className="admin-sidebar-brand">Admin</span>
        </div>

        <nav className="admin-sidebar-nav">
          {NAV_ITEMS.map(item => (
            <NavLink key={item.id} to={item.path} className={({ isActive }) => `admin-nav-item ${isActive ? 'active' : ''}`}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d={item.icon}/></svg>
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="admin-sidebar-footer">
          <div className="admin-user-info">
            <div className="admin-avatar">{user?.username?.[0]?.toUpperCase() || 'A'}</div>
            <span>{user?.username || 'Admin'}</span>
          </div>
          <button className="admin-logout" onClick={logout}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9"/></svg>
          </button>
        </div>
      </aside>

      <main className="admin-main">
        <header className="admin-topbar">
          <h1>{NAV_ITEMS.find(n => n.id === tab)?.label || 'Overview'}</h1>
          <div className="admin-topbar-right">
            <button className="theme-toggle-btn" onClick={toggleTheme}>
              {theme === 'light' ? (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/></svg>
              ) : (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>
              )}
            </button>
            {tab === 'messages' && (
              <input type="text" className="admin-search" placeholder="Search messages..." value={search} onChange={e => setSearch(e.target.value)} />
            )}
          </div>
        </header>

        <div className="admin-content">
          {tab === 'overview' && stats && (
            <div className="overview">
              <div className="stat-grid">
                <div className="stat-card-3d purple">
                  <div className="stat-icon"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg></div>
                  <div className="stat-num"><AnimatedCounter target={stats.total_messages} /></div>
                  <div className="stat-label">Total Messages</div>
                  <div className="stat-trend up">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M7 17l9.2-9.2M17 17V7H7"/></svg>
                    +12.5%
                  </div>
                </div>
                <div className="stat-card-3d blue">
                  <div className="stat-icon"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"/></svg></div>
                  <div className="stat-num"><AnimatedCounter target={stats.total_sessions} /></div>
                  <div className="stat-label">Chat Sessions</div>
                  <div className="stat-trend up">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M7 17l9.2-9.2M17 17V7H7"/></svg>
                    +8.3%
                  </div>
                </div>
                <div className="stat-card-3d green">
                  <div className="stat-icon"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"/></svg></div>
                  <div className="stat-num"><AnimatedCounter target={stats.total_users} /></div>
                  <div className="stat-label">Users</div>
                  <div className="stat-trend up">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M7 17l9.2-9.2M17 17V7H7"/></svg>
                    +24.1%
                  </div>
                </div>
                <div className="stat-card-3d orange">
                  <div className="stat-icon"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"/></svg></div>
                  <div className="stat-num"><AnimatedCounter target={stats.messages_today} /></div>
                  <div className="stat-label">Messages Today</div>
                  <div className="stat-trend down">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M17 7l-9.2 9.2M7 7v10h10"/></svg>
                    -3.2%
                  </div>
                </div>
              </div>

              {stats.message_chart && stats.message_chart.length > 0 && (
                <div className="charts-grid">
                  <LineChart data={stats.message_chart} />
                  <BarChart3D data={stats.message_chart} />
                </div>
              )}

              <div className="info-3d-grid">
                <div className="info-3d-card uptime">
                  <div className="info-3d-icon">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
                  </div>
                  <div className="info-3d-title">System Uptime</div>
                  <div className="info-3d-value">99.9%</div>
                  <div className="info-3d-sub">Last 30 days</div>
                </div>
                <div className="info-3d-card storage">
                  <div className="info-3d-icon">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/></svg>
                  </div>
                  <div className="info-3d-title">Storage Used</div>
                  <div className="info-3d-value">2.4 GB</div>
                  <div className="info-3d-sub">MongoDB Atlas</div>
                </div>
                <div className="info-3d-card model">
                  <div className="info-3d-icon">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="4" y="4" width="16" height="16" rx="2"/><path d="M9 9h6v6H9z"/><path d="M9 1v3M15 1v3M9 20v3M15 20v3M20 9h3M20 14h3M1 9h3M1 14h3"/></svg>
                  </div>
                  <div className="info-3d-title">Model Status</div>
                  <div className="info-3d-value">Loaded</div>
                  <div className="info-3d-sub">Determine-AI v3.0</div>
                </div>
              </div>

              <MonthlyVisitorsChart />

              <div className="overview-info">
                <h3>System Info</h3>
                <div className="info-grid">
                  <div className="info-item"><span>Model</span><strong>Determine-AI v3.0</strong></div>
                  <div className="info-item"><span>Vision</span><strong>BLIP (Local)</strong></div>
                  <div className="info-item"><span>License</span><strong>Apache 2.0</strong></div>
                  <div className="info-item"><span>Database</span><strong>MongoDB Atlas</strong></div>
                  <div className="info-item"><span>Backend</span><strong>FastAPI + Python</strong></div>
                  <div className="info-item"><span>Frontend</span><strong>React</strong></div>
                  <div className="info-item"><span>Privacy</span><strong>100% Local</strong></div>
                  <div className="info-item"><span>Parameters</span><strong>Classified</strong></div>
                  <div className="info-item"><span>Version</span><strong>3.0</strong></div>
                </div>
              </div>
            </div>
          )}

          {tab === 'messages' && (
            <div className="tab-content">
              <div className="table-wrap">
                <table>
                  <thead><tr><th>Role</th><th>User</th><th>Content</th><th>Session</th><th>Time</th><th>Actions</th></tr></thead>
                  <tbody>
                    {filtered.map(m => (
                      <tr key={m.id}>
                        <td><span className={`badge ${m.role}`}>{m.role}</span></td>
                        <td className="user-cell">{m.username || '-'}</td>
                        <td className="content-cell">
                          {editingMsg === m.id ? (
                            <div className="edit-cell">
                              <input value={editText} onChange={e => setEditText(e.target.value)} autoFocus />
                              <button className="btn-xs save" onClick={() => saveEdit(m.id)}>Save</button>
                              <button className="btn-xs" onClick={() => setEditingMsg(null)}>Cancel</button>
                            </div>
                          ) : (
                            <span title={m.content}>{m.content.length > 100 ? m.content.substring(0, 100) + '...' : m.content}</span>
                          )}
                        </td>
                        <td className="mono">{m.session_id?.substring(0, 8)}...</td>
                        <td className="time-cell">{new Date(m.created_at).toLocaleString()}</td>
                        <td className="actions-cell">
                          <button className="btn-xs" onClick={() => { setEditingMsg(m.id); setEditText(m.content); }}>Edit</button>
                          <button className="btn-xs danger" onClick={() => delMsg(m.id)}>Del</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="pagination">
                <button disabled={page === 0} onClick={() => setPage(p => p - 1)}>Prev</button>
                <span>Page {page + 1} / {Math.ceil(total / LIMIT) || 1}</span>
                <button disabled={(page + 1) * LIMIT >= total} onClick={() => setPage(p => p + 1)}>Next</button>
              </div>
            </div>
          )}

          {tab === 'sessions' && (
            <div className="tab-content">
              <div className="table-wrap">
                <table>
                  <thead><tr><th>Title</th><th>User</th><th>Messages</th><th>Created</th><th>Actions</th></tr></thead>
                  <tbody>
                    {sessions.map(s => (
                      <tr key={s.id}>
                        <td>{s.title || 'New Chat'}</td>
                        <td>{s.user_id?.substring(0, 8)}...</td>
                        <td>{s.message_count}</td>
                        <td className="time-cell">{new Date(s.created_at).toLocaleString()}</td>
                        <td className="actions-cell"><button className="btn-xs danger" onClick={() => delSession(s.session_id)}>Delete</button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {tab === 'users' && (
            <div className="tab-content">
              <div className="table-wrap">
                <table>
                  <thead><tr><th>Username</th><th>Role</th><th>Plan</th><th>Joined</th><th>Actions</th></tr></thead>
                  <tbody>
                    {users.map(u => (
                      <tr key={u.id}>
                        <td className="user-cell">{u.username}</td>
                        <td>
                          {editingUser === u.id ? (
                            <div className="role-select">
                              {ROLES.map(r => (
                                <button key={r} className={`role-btn ${u.role === r ? 'active' : ''}`} onClick={() => updateRole(u.id, r)}>{r}</button>
                              ))}
                            </div>
                          ) : (
                            <span className={`badge ${u.role}`} onClick={() => setEditingUser(u.id)} style={{ cursor: 'pointer' }}>{u.role}</span>
                          )}
                        </td>
                        <td>
                          <select className="plan-select" value={u.subscription || 'free'} onChange={e => assignPlan(u.id, e.target.value)}>
                            {TIERS.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                          </select>
                        </td>
                        <td className="time-cell">{new Date(u.created_at).toLocaleString()}</td>
                        <td className="actions-cell">
                          {u.username !== 'admin' && <button className="btn-xs danger" onClick={() => delUser(u.id)}>Delete</button>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {tab === 'train' && (
            <div className="tab-content">
              <AdminTrain token={token} h={h} />
            </div>
          )}

          {tab === 'profile' && (
            <div className="tab-content">
              <AdminProfile token={token} h={h} user={user} />
            </div>
          )}

          {tab === 'blog' && (
            <div className="tab-content">
              <AdminBlog token={token} h={h} />
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

function App() {
  const [user, setUser] = useState(null);
  const [theme, setTheme] = useState(() => localStorage.getItem('admin_theme') || 'dark');

  const toggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    localStorage.setItem('admin_theme', next);
  };

  useEffect(() => {
    const t = localStorage.getItem('admin_token');
    if (t) {
      fetch(`${API}/api/auth/me`, { headers: { Authorization: `Bearer ${t}` } })
        .then(r => r.ok ? r.json() : null)
        .then(d => { if (d && ['admin', 'owner'].includes(d.role)) setUser(d); else localStorage.removeItem('admin_token'); })
        .catch(() => localStorage.removeItem('admin_token'));
    }
  }, []);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/admin" element={user ? <Navigate to="/admin/overview" replace /> : <Login onLogin={setUser} theme={theme} />} />
        <Route path="/admin/overview" element={user ? <Panel token={localStorage.getItem('admin_token')} user={user} theme={theme} toggleTheme={toggleTheme} /> : <Navigate to="/admin" replace />} />
        <Route path="/admin/messages" element={user ? <Panel token={localStorage.getItem('admin_token')} user={user} theme={theme} toggleTheme={toggleTheme} /> : <Navigate to="/admin" replace />} />
        <Route path="/admin/sessions" element={user ? <Panel token={localStorage.getItem('admin_token')} user={user} theme={theme} toggleTheme={toggleTheme} /> : <Navigate to="/admin" replace />} />
        <Route path="/admin/users" element={user ? <Panel token={localStorage.getItem('admin_token')} user={user} theme={theme} toggleTheme={toggleTheme} /> : <Navigate to="/admin" replace />} />
        <Route path="/admin/train" element={user ? <Panel token={localStorage.getItem('admin_token')} user={user} theme={theme} toggleTheme={toggleTheme} /> : <Navigate to="/admin" replace />} />
        <Route path="/admin/blog" element={user ? <Panel token={localStorage.getItem('admin_token')} user={user} theme={theme} toggleTheme={toggleTheme} /> : <Navigate to="/admin" replace />} />
        <Route path="/admin/profile" element={user ? <Panel token={localStorage.getItem('admin_token')} user={user} theme={theme} toggleTheme={toggleTheme} /> : <Navigate to="/admin" replace />} />
        <Route path="*" element={<Navigate to="/admin" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
