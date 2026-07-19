import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Logo from '../Logo';

const API = window.location.origin;
const getHeaders = () => ({
  'Content-Type': 'application/json',
  Authorization: `Bearer ${localStorage.getItem('token')}`,
});

const CATEGORIES = [
  { id: 'coding', label: 'Coding Standards', icon: '{ }', color: '#a78bfa' },
  { id: 'writing', label: 'Writing Style', icon: 'Aa', color: '#f472b6' },
  { id: 'domain', label: 'Domain Knowledge', icon: 'Br', color: '#22c55e' },
  { id: 'persona', label: 'AI Persona', icon: '::', color: '#60a5fa' },
  { id: 'custom', label: 'Custom', icon: '...', color: '#fbbf24' },
];

const PRESETS = [
  { topic: 'Code Style', content: 'Always use TypeScript. Prefer functional components with hooks. Use Tailwind CSS for styling. Follow the Airbnb style guide.', category: 'coding' },
  { topic: 'Response Length', content: 'Keep responses concise and to the point. Avoid unnecessary explanations unless specifically asked. Use bullet points when listing items.', category: 'writing' },
  { topic: 'Language', content: 'Always respond in English, even if the user writes in another language. Translate technical terms when helpful.', category: 'persona' },
];

export default function TeachingPage() {
  const navigate = useNavigate();
  const [teachings, setTeachings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [topic, setTopic] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState('custom');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchTeachings();
  }, []);

  const fetchTeachings = async () => {
    try {
      const res = await fetch(`${API}/api/teach`, { headers: getHeaders() });
      if (res.ok) {
        const data = await res.json();
        setTeachings(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async () => {
    if (!topic.trim() || !content.trim()) {
      setError('Both topic and content are required');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const res = await fetch(`${API}/api/teach`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ topic: topic.trim(), content: content.trim() }),
      });
      if (res.ok) {
        const data = await res.json();
        setTeachings(prev => [data.teaching, ...prev]);
        setTopic('');
        setContent('');
        setShowForm(false);
      } else {
        const err = await res.json();
        setError(err.detail || 'Failed to save');
      }
    } catch (e) {
      setError('Network error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this teaching?')) return;
    try {
      const res = await fetch(`${API}/api/teach/${id}`, { method: 'DELETE', headers: getHeaders() });
      if (res.ok) setTeachings(prev => prev.filter(t => t.id !== id));
    } catch (e) {
      console.error(e);
    }
  };

  const handleToggle = async (id) => {
    try {
      const res = await fetch(`${API}/api/teach/${id}`, { method: 'PATCH', headers: getHeaders() });
      if (res.ok) {
        const data = await res.json();
        setTeachings(prev => prev.map(t => t.id === id ? { ...t, enabled: data.enabled } : t));
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleApplyPreset = (preset) => {
    setTopic(preset.topic);
    setContent(preset.content);
    setCategory(preset.category);
    setShowForm(true);
  };

  return (
    <div className="teach-page" style={{ minHeight: '100vh', background: '#08080d', color: '#e8e8f0', fontFamily: "'Inter', sans-serif" }}>
      {/* Nav */}
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

      <div className="teach-header" style={{ maxWidth: 800, margin: '0 auto', padding: '100px 24px 80px' }}>
        {/* Header */}
        <div style={{ marginBottom: 40 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(167,139,250,0.1)', border: '1px solid rgba(167,139,250,0.2)', borderRadius: 20, padding: '4px 14px', fontSize: 12, color: '#a78bfa', fontWeight: 500, marginBottom: 16 }}>
            <span style={{ fontSize: 14 }}>+</span> Custom Knowledge
          </div>
          <h1 style={{ fontSize: 32, fontWeight: 700, marginBottom: 8, letterSpacing: '-0.03em' }}>Teach Determine-AI</h1>
          <p style={{ color: '#6b6b80', fontSize: 15, lineHeight: 1.6 }}>
            Add custom knowledge, instructions, and preferences that the AI will use in every conversation.
            These teachings are injected into the system context so the AI remembers what you've taught it.
          </p>
        </div>

        {/* Stats */}
        <div className="teach-stats" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 32 }}>
          {[
            { label: 'Active Teachings', value: teachings.filter(t => t.enabled !== false).length, color: '#22c55e' },
            { label: 'Total Saved', value: teachings.length, color: '#60a5fa' },
            { label: 'Max Capacity', value: 50, color: '#6b6b80' },
          ].map((stat, i) => (
            <div key={i} className="teach-stat" style={{ background: 'rgba(14,14,20,0.7)', border: '1px solid rgba(30,30,46,0.5)', borderRadius: 12, padding: '16px 18px', textAlign: 'center' }}>
              <div className="teach-stat-val" style={{ fontSize: 24, fontWeight: 700, color: stat.color, fontFamily: "'JetBrains Mono', monospace" }}>{stat.value}</div>
              <div className="teach-stat-label" style={{ fontSize: 11, color: '#6b6b80', marginTop: 2, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Presets */}
        {teachings.length === 0 && !showForm && (
          <div style={{ marginBottom: 32 }}>
            <h3 style={{ fontSize: 14, fontWeight: 600, color: '#8888a0', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Quick Start Presets</h3>
            <div className="teach-presets" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 10 }}>
              {PRESETS.map((p, i) => (
                <button key={i} onClick={() => handleApplyPreset(p)} style={{ background: 'rgba(14,14,20,0.7)', border: '1px solid rgba(30,30,46,0.5)', borderRadius: 12, padding: '14px 16px', textAlign: 'left', cursor: 'pointer', transition: 'all 0.2s', color: '#e8e8f0' }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = '#7c3aed40'; e.currentTarget.style.background = 'rgba(124,58,237,0.05)'; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(30,30,46,0.5)'; e.currentTarget.style.background = 'rgba(14,14,20,0.7)'; }}
                >
                  <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 4 }}>{p.topic}</div>
                  <div style={{ fontSize: 11, color: '#6b6b80', lineHeight: 1.4 }}>{p.content.slice(0, 80)}...</div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Add button */}
        <div className="teach-list-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h3 style={{ fontSize: 14, fontWeight: 600, color: '#8888a0', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            Your Teachings ({teachings.length})
          </h3>
          <button className="teach-add-btn" onClick={() => setShowForm(!showForm)} style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#7c3aed', border: 'none', borderRadius: 10, padding: '8px 18px', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
            <span style={{ fontSize: 16, lineHeight: 1 }}>{showForm ? '×' : '+'}</span> {showForm ? 'Cancel' : 'Add Teaching'}
          </button>
        </div>

        {/* Form */}
        {showForm && (
          <div className="teach-form" style={{ background: 'rgba(14,14,20,0.7)', border: '1px solid rgba(124,58,237,0.3)', borderRadius: 14, padding: 24, marginBottom: 24 }}>
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#8888a0', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Topic</label>
              <input value={topic} onChange={e => setTopic(e.target.value)} placeholder="e.g., Code Style, Response Format, Domain Expertise"
                style={{ width: '100%', background: '#0e0e14', border: '1px solid rgba(30,30,46,0.6)', borderRadius: 10, padding: '10px 14px', color: '#e8e8f0', fontSize: 14, outline: 'none', boxSizing: 'border-box' }} />
            </div>
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#8888a0', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Category</label>
              <div className="teach-categories" style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {CATEGORIES.map(cat => (
                  <button key={cat.id} onClick={() => setCategory(cat.id)}
                    style={{ display: 'flex', alignItems: 'center', gap: 6, background: category === cat.id ? `${cat.color}15` : 'rgba(14,14,20,0.7)', border: `1px solid ${category === cat.id ? cat.color + '40' : 'rgba(30,30,46,0.5)'}`, borderRadius: 8, padding: '6px 12px', color: category === cat.id ? cat.color : '#6b6b80', fontSize: 12, fontWeight: 500, cursor: 'pointer', transition: 'all 0.2s' }}>
                    <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11 }}>{cat.icon}</span> {cat.label}
                  </button>
                ))}
              </div>
            </div>
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#8888a0', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Knowledge / Instructions</label>
              <textarea value={content} onChange={e => setContent(e.target.value)} rows={4} placeholder="Tell the AI how to behave, what to know, or how to respond..."
                style={{ width: '100%', background: '#0e0e14', border: '1px solid rgba(30,30,46,0.6)', borderRadius: 10, padding: '10px 14px', color: '#e8e8f0', fontSize: 14, outline: 'none', resize: 'vertical', fontFamily: 'inherit', lineHeight: 1.6, boxSizing: 'border-box' }} />
            </div>
            {error && <div style={{ fontSize: 13, color: '#ef4444', marginBottom: 12 }}>{error}</div>}
            <button className="teach-save-btn" onClick={handleAdd} disabled={saving || !topic.trim() || !content.trim()}
              style={{ background: saving || !topic.trim() || !content.trim() ? '#3a3a4a' : '#7c3aed', border: 'none', borderRadius: 10, padding: '10px 24px', color: '#fff', fontSize: 13, fontWeight: 600, cursor: saving || !topic.trim() || !content.trim() ? 'not-allowed' : 'pointer' }}>
              {saving ? 'Saving...' : 'Save Teaching'}
            </button>
          </div>
        )}

        {/* Teachings list */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: 40, color: '#6b6b80' }}>Loading teachings...</div>
        ) : teachings.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 20px', background: 'rgba(14,14,20,0.5)', borderRadius: 14, border: '1px solid rgba(30,30,46,0.4)' }}>
            <div style={{ fontSize: 40, marginBottom: 12, opacity: 0.3 }}>+</div>
            <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 8, color: '#e8e8f0' }}>No teachings yet</h3>
            <p style={{ fontSize: 14, color: '#6b6b80', maxWidth: 400, margin: '0 auto' }}>
              Add custom knowledge to teach the AI how you want it to behave. Your teachings are used in every conversation.
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {teachings.map(t => (
              <div key={t.id} className="teach-list-item" style={{ background: 'rgba(14,14,20,0.7)', border: `1px solid ${t.enabled !== false ? 'rgba(30,30,46,0.5)' : 'rgba(30,30,46,0.3)'}`, borderRadius: 12, padding: '14px 18px', opacity: t.enabled !== false ? 1 : 0.5, transition: 'all 0.2s' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: t.enabled !== false ? '#22c55e' : '#6b6b80' }} />
                    <span style={{ fontSize: 14, fontWeight: 600 }}>{t.topic}</span>
                  </div>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button onClick={() => handleToggle(t.id)} title={t.enabled !== false ? 'Disable' : 'Enable'}
                      style={{ background: 'none', border: '1px solid rgba(30,30,46,0.5)', borderRadius: 6, padding: '4px 10px', color: '#6b6b80', fontSize: 11, cursor: 'pointer' }}>
                      {t.enabled !== false ? 'On' : 'Off'}
                    </button>
                    <button onClick={() => handleDelete(t.id)} title="Delete"
                      style={{ background: 'none', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 6, padding: '4px 10px', color: '#ef4444', fontSize: 11, cursor: 'pointer' }}>
                      Delete
                    </button>
                  </div>
                </div>
                <p style={{ fontSize: 13, color: '#8888a0', lineHeight: 1.6, margin: 0, paddingLeft: 18 }}>{t.content}</p>
              </div>
            ))}
          </div>
        )}

        {/* Info */}
        <div className="teach-info" style={{ marginTop: 40, background: 'rgba(14,14,20,0.5)', border: '1px solid rgba(30,30,46,0.4)', borderRadius: 12, padding: 20 }}>
          <h4 style={{ fontSize: 13, fontWeight: 600, color: '#a78bfa', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.06em' }}>How It Works</h4>
          <ul style={{ fontSize: 13, color: '#6b6b80', lineHeight: 1.8, margin: 0, paddingLeft: 18 }}>
            <li>Teachings are injected into the AI system prompt for every conversation</li>
            <li>Disable a teaching to temporarily stop using it without deleting</li>
            <li>Use specific, clear instructions for best results</li>
            <li>You can have up to 50 active teachings</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
