import React, { useState, useRef, useEffect, useCallback } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useParams, useNavigate, useLocation } from 'react-router-dom';
import ChatMessage from './components/ChatMessage';
import ChatInput from './components/ChatInput';
import LandingPage from './LandingPage';
import Settings from './Settings';
import Profile from './Profile';
import Projects from './Projects';
import Logo from './Logo';
import ChangelogPage from './pages/ChangelogPage';
import AboutPage from './pages/AboutPage';
import PrivacyPage from './pages/PrivacyPage';
import TermsPage from './pages/TermsPage';
import StatusPage from './pages/StatusPage';
import TeachingPage from './pages/TeachingPage';
import ImageGenPage from './pages/ImageGenPage';
import BlogPage from './pages/BlogPage';
import DocsPage from './pages/DocsPage';
import { t } from './i18n';
import './App.css';

const API = window.location.origin;

/* ─── HeroParticles (global background) ─────────────────── */
function HeroParticles() {
  const canvasRef = useRef(null);
  const particles = useRef([]);
  const mouse = useRef({ x: -1000, y: -1000 });
  const raf = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    let w = (canvas.width = window.innerWidth);
    let h = (canvas.height = window.innerHeight);

    const COUNT = 60;
    const colors = ['#7c3aed', '#a78bfa', '#3b82f6', '#60a5fa'];
    particles.current = Array.from({ length: COUNT }, () => ({
      x: Math.random() * w, y: Math.random() * h,
      vx: (Math.random() - 0.5) * 0.3, vy: (Math.random() - 0.5) * 0.3,
      r: Math.random() * 1.5 + 0.5,
      color: colors[Math.floor(Math.random() * colors.length)],
      alpha: Math.random() * 0.4 + 0.1,
    }));

    const onResize = () => { w = canvas.width = window.innerWidth; h = canvas.height = window.innerHeight; };
    const onMouse = (e) => { mouse.current = { x: e.clientX, y: e.clientY }; };
    window.addEventListener('resize', onResize);
    window.addEventListener('mousemove', onMouse);

    const draw = () => {
      ctx.clearRect(0, 0, w, h);
      const ps = particles.current;
      for (let i = 0; i < ps.length; i++) {
        const p = ps[i];
        p.x += p.vx; p.y += p.vy;
        if (p.x < 0) p.x = w; if (p.x > w) p.x = 0;
        if (p.y < 0) p.y = h; if (p.y > h) p.y = 0;

        const mx = mouse.current.x, my = mouse.current.y;
        if (mx > 0) {
          const dx = p.x - mx, dy = p.y - my;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 150) {
            const force = (150 - dist) / 150 * 0.02;
            p.x += dx * force; p.y += dy * force;
          }
        }

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.alpha;
        ctx.fill();

        for (let j = i + 1; j < ps.length; j++) {
          const q = ps[j];
          const dx = p.x - q.x, dy = p.y - q.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 120) {
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(q.x, q.y);
            ctx.strokeStyle = p.color;
            ctx.globalAlpha = (1 - dist / 120) * 0.15;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        }
      }
      ctx.globalAlpha = 1;
      raf.current = requestAnimationFrame(draw);
    };
    draw();
    return () => {
      cancelAnimationFrame(raf.current);
      window.removeEventListener('resize', onResize);
      window.removeEventListener('mousemove', onMouse);
    };
  }, []);

  return <canvas ref={canvasRef} style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none' }} />;
}

/* ─── AuthParticles (login page background) ───────────────── */
function AuthParticles() {
  const canvasRef = useRef(null);
  const raf = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    let w = (canvas.width = window.innerWidth);
    let h = (canvas.height = window.innerHeight);

    const colors = ['rgba(124,58,237,', 'rgba(59,130,246,', 'rgba(167,139,250,'];
    const shapes = Array.from({ length: 10 }, () => ({
      x: Math.random() * w, y: Math.random() * h,
      vx: (Math.random() - 0.5) * 0.25, vy: (Math.random() - 0.5) * 0.2,
      size: Math.random() * 10 + 5,
      rotation: Math.random() * Math.PI * 2,
      rotSpeed: (Math.random() - 0.5) * 0.008,
      type: ['triangle', 'circle', 'diamond'][Math.floor(Math.random() * 3)],
      alpha: Math.random() * 0.08 + 0.03,
      color: colors[Math.floor(Math.random() * colors.length)],
    }));

    const onResize = () => { w = canvas.width = window.innerWidth; h = canvas.height = window.innerHeight; };
    window.addEventListener('resize', onResize);

    const draw = () => {
      ctx.clearRect(0, 0, w, h);
      for (const s of shapes) {
        s.x += s.vx; s.y += s.vy;
        s.rotation += s.rotSpeed;
        if (s.x < -30) s.x = w + 30; if (s.x > w + 30) s.x = -30;
        if (s.y < -30) s.y = h + 30; if (s.y > h + 30) s.y = -30;

        ctx.save();
        ctx.translate(s.x, s.y);
        ctx.rotate(s.rotation);
        ctx.globalAlpha = s.alpha;

        if (s.type === 'circle') {
          ctx.beginPath();
          ctx.arc(0, 0, s.size / 2, 0, Math.PI * 2);
          ctx.fillStyle = s.color + '0.6)';
          ctx.fill();
        } else if (s.type === 'triangle') {
          const r = s.size / 2;
          ctx.beginPath();
          ctx.moveTo(0, -r);
          ctx.lineTo(-r * 0.866, r * 0.5);
          ctx.lineTo(r * 0.866, r * 0.5);
          ctx.closePath();
          ctx.strokeStyle = s.color + '0.8)';
          ctx.lineWidth = 1;
          ctx.stroke();
        } else {
          const r = s.size / 2;
          ctx.beginPath();
          ctx.moveTo(0, -r);
          ctx.lineTo(r * 0.6, 0);
          ctx.lineTo(0, r);
          ctx.lineTo(-r * 0.6, 0);
          ctx.closePath();
          ctx.strokeStyle = s.color + '0.8)';
          ctx.lineWidth = 1;
          ctx.stroke();
        }
        ctx.restore();
      }
      raf.current = requestAnimationFrame(draw);
    };
    draw();
    return () => { cancelAnimationFrame(raf.current); window.removeEventListener('resize', onResize); };
  }, []);

  return <canvas ref={canvasRef} style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none', filter: 'blur(1px)' }} />;
}

const TIER_COLORS = {
  free: { bg: '#1a1a2e', border: '#333', accent: '#6b7280', glow: 'rgba(107,114,128,0.2)' },
  basic: { bg: '#1a2332', border: '#1e40af', accent: '#3b82f6', glow: 'rgba(59,130,246,0.3)' },
  pro: { bg: '#2a1a3e', border: '#7c3aed', accent: '#a78bfa', glow: 'rgba(167,139,250,0.3)' },
  enterprise: { bg: '#2a2a1a', border: '#d97706', accent: '#fbbf24', glow: 'rgba(251,191,36,0.3)' },
};

function AuthPage({ onAuth }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [isLogin, setIsLogin] = useState(() => location.pathname === '/login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  useEffect(() => {
    setIsLogin(location.pathname === '/login');
  }, [location.pathname]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const endpoint = isLogin ? '/api/auth/login' : '/api/auth/register';
      const res = await fetch(`${API}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Failed');
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data));
      onAuth(data);
      const redirectTo = location.state?.from || '/chat';
      navigate(redirectTo);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    setGoogleLoading(true);
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';
    if (!clientId || clientId === 'YOUR_GOOGLE_CLIENT_ID_HERE') {
      setError('Google OAuth is not configured. Set VITE_GOOGLE_CLIENT_ID in frontend/.env');
      setGoogleLoading(false);
      return;
    }
    const redirectUri = window.location.origin;
    const scope = 'email profile openid';
    const url = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${encodeURIComponent(clientId)}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=${encodeURIComponent(scope)}&state=google_auth`;
    window.location.href = url;
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');
    const state = params.get('state');
    if (code && state === 'google_auth') {
      setError('');
      setLoading(true);
      fetch(`${API}/api/auth/google`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, redirect_uri: window.location.origin }),
      })
        .then(r => r.json())
        .then(data => {
          if (data.error) throw new Error(data.error);
          localStorage.setItem('token', data.token);
          localStorage.setItem('user', JSON.stringify(data));
          onAuth(data);
          const redirectTo = location.state?.from || '/chat';
          navigate(redirectTo);
          window.history.replaceState({}, '', redirectTo);
        })
        .catch(err => setError(err.message))
        .finally(() => setLoading(false));
    }
  }, []);

  const toggleLoginMode = () => {
    navigate(isLogin ? '/register' : '/login');
    setError('');
  };

  return (
    <div className="auth-page">
      <AuthParticles />
      <div className="auth-bg">
        <div className="glow glow-1"></div>
        <div className="glow glow-2"></div>
        <div className="glow glow-3"></div>
        <div className="grid-bg"></div>
      </div>
      <div className="auth-card">
        <div style={{
          position: 'absolute', inset: -2, borderRadius: 26, zIndex: -1, pointerEvents: 'none',
          background: 'radial-gradient(ellipse at center, rgba(124,58,237,0.12) 0%, transparent 70%)',
          filter: 'blur(30px)',
        }} />
        <div className="auth-logo">
          <Logo size={60} className="pulse" />
        </div>
        <h1>Determine-AI</h1>
        <p className="auth-subtitle">{isLogin ? t('auth.welcome') : t('auth.register')}</p>
        {error && <div className="auth-error">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="input-group">
            <label>{t('auth.username')}</label>
            <input type="text" value={username} onChange={e => setUsername(e.target.value)} placeholder={t('auth.usernamePlaceholder')} required minLength={2} autoFocus />
          </div>
          <div className="input-group">
            <label>{t('auth.password')}</label>
            <div className="password-field">
              <input type={showPassword ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} placeholder={t('auth.passwordPlaceholder')} required minLength={4} />
              <button type="button" className="eye-toggle" onClick={() => setShowPassword(!showPassword)} tabIndex={-1}>
                {showPassword ? (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24"/>
                    <line x1="1" y1="1" x2="23" y2="23"/>
                  </svg>
                ) : (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                    <circle cx="12" cy="12" r="3"/>
                  </svg>
                )}
              </button>
            </div>
          </div>
          <button type="submit" className="auth-btn" disabled={loading}>
            {loading ? <div className="spinner"></div> : isLogin ? t('auth.signIn') : t('auth.signUp')}
          </button>
        </form>
        <div className="auth-divider">
          <span>or</span>
        </div>
        <button className="google-btn" onClick={handleGoogleLogin} disabled={googleLoading || loading}>
          <svg width="18" height="18" viewBox="0 0 24 24">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
          {googleLoading ? 'Connecting...' : 'Continue with Google'}
        </button>
        <p className="auth-toggle">
          {isLogin ? t('auth.noAccount') : t('auth.hasAccount')}
          <button onClick={toggleLoginMode}>
            {isLogin ? t('auth.signUp') : t('auth.signIn')}
          </button>
        </p>
      </div>
    </div>
  );
}

function PremiumPage({ user, onSubscribed }) {
  const navigate = useNavigate();
  const [tiers, setTiers] = useState([]);
  const [currentTier, setCurrentTier] = useState('free');
  const [subscribing, setSubscribing] = useState(null);
  const [message, setMessage] = useState(null);
  const [dailyUsed, setDailyUsed] = useState(0);
  const [dailyLimit, setDailyLimit] = useState(50);
  const token = localStorage.getItem('token');

  const loadSub = useCallback(() => {
    fetch(`${API}/api/user/subscription`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.ok ? r.json() : null)
      .then(d => {
        if (d) { setCurrentTier(d.id); setDailyUsed(d.daily_used || 0); setDailyLimit(d.daily_limit || 50); }
      });
  }, [token]);

  useEffect(() => {
    fetch(`${API}/api/premium/tiers`).then(r => r.json()).then(setTiers);
    loadSub();
  }, [loadSub]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('payment') === 'success') {
      setMessage({ type: 'success', text: t('premium.paymentSuccess') });
      window.history.replaceState({}, '', '/plans');
      loadSub();
      if (onSubscribed) onSubscribed();
    } else if (params.get('payment') === 'cancelled') {
      setMessage({ type: 'error', text: t('premium.paymentCancelled') });
      window.history.replaceState({}, '', '/plans');
    }
  }, []);

  const subscribe = async (tierId) => {
    setSubscribing(tierId);
    setMessage(null);
    try {
      const res = await fetch(`${API}/api/premium/checkout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ tier_id: tierId }),
      });
      const data = await res.json();
      if (!res.ok) { setMessage({ type: 'error', text: data.detail || 'Failed' }); setSubscribing(null); return; }
      if (data.url) { window.location.href = data.url; return; }
      if (data.status === 'subscribed') {
        setCurrentTier(tierId);
        setMessage({ type: 'success', text: data.message || `${data.tier} activated!` });
        if (onSubscribed) onSubscribed(tierId);
        loadSub();
      }
    } catch (e) { setMessage({ type: 'error', text: 'Network error.' }); }
    setSubscribing(null);
  };

  return (
    <div className="premium-page">
      <div className="auth-bg"><div className="glow glow-1"></div><div className="glow glow-2"></div></div>
      <div className="premium-content" style={{ position: 'relative', zIndex: 2 }}>
        <div className="premium-header">
          <button className="back-btn" onClick={() => navigate('/chat')}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
            Back to Chat
          </button>
          <h1>{t('premium.title')}</h1>
          <p>{t('premium.subtitle')}</p>
        </div>
        {message && (
          <div className={`premium-message ${message.type}`}>
            {message.type === 'success' ? (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 6L9 17l-5-5"/></svg>
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M15 9l-6 6M9 9l6 6"/></svg>
            )}
            <span>{message.text}</span>
            <button onClick={() => setMessage(null)}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
            </button>
          </div>
        )}
        <div className="usage-bar">
          <div className="usage-info">
            <span>{t('premium.dailyUsage')}: <strong>{dailyUsed}</strong> / {dailyLimit === -1 ? t('premium.unlimited') : dailyLimit} {t('premium.messages')}</span>
          </div>
          {dailyLimit !== -1 && (
            <div className="usage-track">
              <div className="usage-fill" style={{ width: `${Math.min((dailyUsed / dailyLimit) * 100, 100)}%` }}></div>
            </div>
          )}
        </div>
        <div className="tiers-grid">
          {tiers.map(tier => {
            const tc = TIER_COLORS[tier.id] || TIER_COLORS.free;
            const isCurrent = currentTier === tier.id;
            const isPro = tier.id === 'pro';
            return (
              <div key={tier.id} className={`tier-card ${isCurrent ? 'current' : ''} ${isPro ? 'featured' : ''}`} style={{ '--tier-accent': tc.accent, '--tier-glow': tc.glow, '--tier-border': tc.border }}>
                {isPro && <div className="featured-badge">{t('pricing.popular')}</div>}
                {isCurrent && <div className="current-badge">{t('pricing.current')}</div>}
                <div className="tier-icon" style={{ background: `linear-gradient(135deg, ${tc.accent}, ${tc.border})` }}>
                  {tier.id === 'free' && 'S'}{tier.id === 'basic' && 'B'}{tier.id === 'pro' && 'P'}{tier.id === 'enterprise' && 'E'}
                </div>
                <h3>{tier.name}</h3>
                <div className="tier-price">
                  <span className="price">${tier.price}</span>
                  <span className="period">/{tier.period}</span>
                </div>
                <ul className="tier-features">
                  {tier.features.map((f, i) => (
                    <li key={i}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={tc.accent} strokeWidth="2.5"><path d="M20 6L9 17l-5-5"/></svg>
                      {f}
                    </li>
                  ))}
                </ul>
                <button className={`tier-btn ${isCurrent ? 'current' : ''}`} disabled={isCurrent || subscribing === tier.id}
                  style={isCurrent ? {} : { background: `linear-gradient(135deg, ${tc.accent}, ${tc.border})` }}
                  onClick={() => subscribe(tier.id)}>
                  {isCurrent ? t('pricing.current') : subscribing === tier.id ? '...' : tier.price === 0 ? t('pricing.downgrade') : t('pricing.upgrade')}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function ChatApp({ user, onLogout, onUserUpdate }) {
  const { sessionId: urlSessionId } = useParams();
  const navigate = useNavigate();
  const [messages, setMessages] = useState([]);
  const [sessionId, setSessionId] = useState(urlSessionId || null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [sessions, setSessions] = useState([]);
  const [sidebarOpen, setSidebarOpen] = useState(() => window.innerWidth > 768);
  const [sidebarWidth, setSidebarWidth] = useState(290);
  const [isMobile, setIsMobile] = useState(() => window.innerWidth <= 768);
  const [view, setView] = useState('chat');
  const [showProjects, setShowProjects] = useState(false);
  const [pendingImage, setPendingImage] = useState(null);
  const [subscription, setSubscription] = useState(user.subscription || 'free');
  const [dailyUsed, setDailyUsed] = useState(0);
  const [dailyLimit, setDailyLimit] = useState(50);
  const [chatBg, setChatBg] = useState(() => localStorage.getItem(`chat_bg_${user.username}`) || '');
  const [toast, setToast] = useState(null);
  const [showSettings, setShowSettings] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [selectedVersion, setSelectedVersion] = useState(() => localStorage.getItem(`ai_version_${user.username}`) || 'auto');
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [homeSuggestions, setHomeSuggestions] = useState([]);
  const userMenuRef = useRef(null);
  const [userSettings, setUserSettings] = useState(() => {
    try { return JSON.parse(localStorage.getItem(`settings_${user.username}`)) || { theme: 'dark', aiTextColor: '#a78bfa', fontSize: 14, accentColor: '#7c3aed', language: 'en' }; }
    catch { return { theme: 'dark', aiTextColor: '#a78bfa', fontSize: 14, accentColor: '#7c3aed', language: 'en' }; }
  });
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const bgInputRef = useRef(null);
  const sidebarRef = useRef(null);
  const isDragging = useRef(false);
  const trailCanvasRef = useRef(null);

  const SUGGESTION_POOL = [
    "Explain quantum computing in simple terms",
    "Write a Python script to analyze CSV data",
    "What are the latest breakthroughs in AI?",
    "Help me design a REST API architecture",
    "Compare React vs Vue for a new project",
    "Write a bash script to automate backups",
    "Explain how blockchain technology works",
    "Help me debug this JavaScript error",
    "What's happening in space exploration today?",
    "Create a Docker setup for a Node.js app",
    "Explain machine learning to a beginner",
    "Write a Rust function for fast sorting",
    "What are the best practices for cybersecurity?",
    "Help me plan a microservices architecture",
    "Explain the theory of relativity",
    "Write SQL queries for data analysis",
    "What's new in TypeScript 5?",
    "Help me optimize this code for performance",
    "Explain cloud computing deployment models",
    "Create a React component for a dashboard",
  ];

  useEffect(() => {
    const shuffled = [...SUGGESTION_POOL].sort(() => Math.random() - 0.5);
    setHomeSuggestions(shuffled.slice(0, 4));
  }, [sessionId]);

  useEffect(() => {
    const canvas = trailCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let w = canvas.width = window.innerWidth;
    let h = canvas.height = window.innerHeight;
    const trails = [];
    let raf;

    const onResize = () => { w = canvas.width = window.innerWidth; h = canvas.height = window.innerHeight; };
    const onMouse = (e) => {
      const colors = ['#7c3aed', '#a78bfa', '#3b82f6', '#22c55e', '#eab308', '#ef4444'];
      trails.push({
        x: e.clientX, y: e.clientY,
        r: Math.random() * 4 + 2,
        color: colors[Math.floor(Math.random() * colors.length)],
        alpha: 0.6,
        life: 1,
      });
      if (trails.length > 50) trails.shift();
    };
    window.addEventListener('resize', onResize);
    window.addEventListener('mousemove', onMouse);

    const draw = () => {
      ctx.clearRect(0, 0, w, h);
      for (let i = trails.length - 1; i >= 0; i--) {
        const t = trails[i];
        t.life -= 0.02;
        t.alpha = t.life * 0.5;
        t.r *= 0.98;
        if (t.life <= 0) { trails.splice(i, 1); continue; }
        ctx.beginPath();
        ctx.arc(t.x, t.y, t.r, 0, Math.PI * 2);
        ctx.fillStyle = t.color;
        ctx.globalAlpha = t.alpha;
        ctx.fill();
      }
      ctx.globalAlpha = 1;
      raf = requestAnimationFrame(draw);
    };
    draw();
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', onResize);
      window.removeEventListener('mousemove', onMouse);
    };
  }, []);

  useEffect(() => {
    const handler = (e) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) setShowUserMenu(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const token = localStorage.getItem('token');
  const authHeaders = { Authorization: `Bearer ${token}` };

  useEffect(() => {
    document.documentElement.style.setProperty('--accent', userSettings.accentColor);
    document.documentElement.style.setProperty('--accent2', userSettings.aiTextColor);
    if (userSettings.theme === 'light') {
      document.body.style.background = '#f5f5f5';
    } else {
      document.body.style.background = '';
    }
  }, [userSettings.accentColor, userSettings.aiTextColor, userSettings.theme]);

  const loadSessions = useCallback(async () => {
    try { const res = await fetch(`${API}/api/sessions`, { headers: authHeaders }); if (res.ok) setSessions(await res.json()); } catch (e) {}
  }, [token]);

  const loadSubscription = useCallback(async () => {
    try {
      const res = await fetch(`${API}/api/user/subscription`, { headers: authHeaders });
      if (res.ok) { const d = await res.json(); setSubscription(d.id); setDailyUsed(d.daily_used || 0); setDailyLimit(d.daily_limit || 50); }
    } catch (e) {}
  }, [token]);

  const loadSettings = useCallback(async () => {
    try {
      const res = await fetch(`${API}/api/user/settings`, { headers: authHeaders });
      if (res.ok) { const d = await res.json(); setUserSettings(d); localStorage.setItem(`settings_${user.username}`, JSON.stringify(d)); }
    } catch (e) {}
  }, [token, user.username]);

  useEffect(() => { loadSessions(); loadSubscription(); loadSettings(); }, [loadSessions, loadSubscription, loadSettings]);
  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  useEffect(() => {
    if (urlSessionId && urlSessionId !== sessionId) {
      loadSession(urlSessionId);
    }
  }, [urlSessionId]);

  const showToast = useCallback((text, type = 'success') => {
    setToast({ text, type });
    setTimeout(() => setToast(null), 4000);
  }, []);

  const saveSettings = async (newSettings) => {
    setUserSettings(newSettings);
    localStorage.setItem(`settings_${user.username}`, JSON.stringify(newSettings));
    try {
      await fetch(`${API}/api/user/settings`, {
        method: 'PUT',
        headers: { ...authHeaders, 'Content-Type': 'application/json' },
        body: JSON.stringify(newSettings),
      });
    } catch (e) {}
    showToast(t('settings.saved'));
  };

  const loadSession = async (sid) => {
    setSessionId(sid);
    setMessages([]);
    navigate(`/chat/${sid}`, { replace: true });
    try {
      const res = await fetch(`${API}/api/messages/${sid}`, { headers: authHeaders });
      if (res.ok) { const msgs = await res.json(); setMessages(msgs.map(m => ({ role: m.role, content: m.content, ts: m.created_at }))); }
    } catch (e) {}
  };

  const newChat = () => { setSessionId(null); setMessages([]); navigate('/chat', { replace: true }); };

  const deleteSession = async (sid) => {
    try { await fetch(`${API}/api/sessions/${sid}`, { method: 'DELETE', headers: authHeaders }); loadSessions(); if (sid === sessionId) newChat(); } catch (e) {}
  };

  const handleImageSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const base64 = ev.target.result.split(',')[1];
      setPendingImage({ data: base64, preview: ev.target.result, name: file.name });
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleBgSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { showToast('Image too large. Max 5MB.', 'error'); return; }
    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = ev.target.result;
      setChatBg(dataUrl);
      localStorage.setItem(`chat_bg_${user.username}`, dataUrl);
      showToast('Background updated!');
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const clearBg = () => { setChatBg(''); localStorage.removeItem(`chat_bg_${user.username}`); showToast('Background removed.'); };

  const sendMessage = useCallback(async (text) => {
    if (!text.trim() || isGenerating) return;
    const hasImage = !!pendingImage;
    const imgPreview = pendingImage?.preview;
    const imgData = pendingImage?.data;

    setMessages(prev => [...prev, { role: 'user', content: text, ts: Date.now(), image: imgPreview }]);
    setIsGenerating(true);
    setPendingImage(null);

    try {
      let res;
      if (hasImage && imgData) {
        res = await fetch(`${API}/api/chat/image`, {
          method: 'POST', headers: { ...authHeaders, 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: text, image: imgData, session_id: sessionId }),
        });
      } else {
        res = await fetch(`${API}/api/chat`, {
          method: 'POST', headers: { ...authHeaders, 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: text, session_id: sessionId, version: selectedVersion }),
        });
      }
      if (!res.ok) { const err = await res.json(); throw new Error(err.detail || `Error ${res.status}`); }

      const reader = res.body.getReader();
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
                setMessages(prev => [...prev, { role: 'assistant', content: data.token, ts: Date.now(), streaming: true }]);
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
              if (data.session_id && !sessionId) {
                setSessionId(data.session_id);
                navigate(`/chat/${data.session_id}`, { replace: true });
              }
              setMessages(prev => {
                const n = [...prev];
                if (n.length > 0) {
                  const lastMsg = { ...n[n.length - 1], streaming: false };
                  if (data.image) {
                    lastMsg.generatedImage = data.image;
                    lastMsg.imagePrompt = data.image_prompt;
                  }
                  if (data.full_response !== undefined) {
                    lastMsg.content = data.full_response || lastMsg.content;
                  }
                  n[n.length - 1] = lastMsg;
                }
                return n;
              });
              loadSessions();
              loadSubscription();
            }
          } catch (e) {}
        }
      }
      if (!added) {
        setMessages(prev => [...prev, { role: 'assistant', content: 'No response received.', ts: Date.now(), error: true }]);
      }
    } catch (err) {
      setMessages(prev => [...prev, { role: 'assistant', content: `Error: ${err.message}`, ts: Date.now(), error: true }]);
    } finally {
      setIsGenerating(false);
    }
  }, [sessionId, isGenerating, token, pendingImage]);

  const handleSubscribeFromChat = useCallback((tierId) => {
    setSubscription(tierId);
    loadSubscription();
    showToast(`${tierId} plan activated!`);
  }, [loadSubscription, showToast]);

  const handleSidebarDrag = useCallback((e) => {
    if (!isDragging.current) return;
    setSidebarWidth(Math.max(220, Math.min(500, e.clientX)));
  }, []);

  const stopSidebarDrag = useCallback(() => {
    isDragging.current = false;
    document.body.style.cursor = '';
    document.body.style.userSelect = '';
  }, []);

  useEffect(() => {
    const onResize = () => {
      const mobile = window.innerWidth <= 768;
      setIsMobile(mobile);
      if (mobile) setSidebarOpen(false);
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const toggleSidebar = useCallback(() => {
    setSidebarOpen(prev => !prev);
  }, []);

  const closeSidebar = useCallback(() => {
    setSidebarOpen(false);
  }, []);

  useEffect(() => {
    window.addEventListener('mousemove', handleSidebarDrag);
    window.addEventListener('mouseup', stopSidebarDrag);
    return () => { window.removeEventListener('mousemove', handleSidebarDrag); window.removeEventListener('mouseup', stopSidebarDrag); };
  }, [handleSidebarDrag, stopSidebarDrag]);

  if (view === 'premium') return <PremiumPage user={user} onSubscribed={(tier) => handleSubscribeFromChat(tier)} />;

  const tierLabel = subscription === 'free' ? 'Free' : subscription.charAt(0).toUpperCase() + subscription.slice(1);
  const userBgColor = userSettings.theme === 'light' ? '#f5f5f5' : undefined;
  const userTextColor = userSettings.theme === 'light' ? '#1a1a26' : undefined;

  return (
    <div className={`chat-app ${userSettings.theme === 'light' ? 'light-mode' : ''}`} style={userBgColor ? { background: userBgColor } : {}}>
      <canvas ref={trailCanvasRef} style={{ position: 'fixed', inset: 0, zIndex: 1, pointerEvents: 'none' }} />      {showSettings && <Settings user={user} settings={userSettings} onSave={saveSettings} onClose={() => setShowSettings(false)} />}
      {showProfile && <Profile user={user} subscription={subscription} dailyUsed={dailyUsed} dailyLimit={dailyLimit} theme={userSettings.theme} onClose={() => setShowProfile(false)} onUpdate={async () => {
        try {
          const res = await fetch(`${API}/api/auth/me`, { headers: { Authorization: `Bearer ${token}` } });
          if (res.ok) {
            const updatedUser = await res.json();
            localStorage.setItem('user', JSON.stringify(updatedUser));
            if (onUserUpdate) onUserUpdate(updatedUser);
          }
        } catch (e) {}
      }} />}
      {showProjects && <Projects onClose={() => setShowProjects(false)} />}

      {toast && (
        <div className={`toast ${toast.type}`}>
          {toast.type === 'success' ? (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M20 6L9 17l-5-5"/></svg>
          ) : (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><path d="M15 9l-6 6M9 9l6 6"/></svg>
          )}
          <span>{toast.text}</span>
        </div>
      )}

      <div ref={sidebarRef} className={`sidebar ${sidebarOpen ? 'open' : 'closed'}`}
        style={sidebarOpen ? { width: sidebarWidth, minWidth: sidebarWidth } : { width: 60, minWidth: 60 }}>
        <div className="sidebar-header">
          <div className="sidebar-brand">
            <Logo size={34} />
            <span>Determine-AI</span>
          </div>
          <button className="icon-btn" onClick={toggleSidebar}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 18l-6-6 6-6"/></svg>
          </button>
        </div>

        <button className="new-chat-btn" onClick={newChat}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 5v14M5 12h14"/></svg>
          <span className="new-chat-label">{t('chat.newChat')}</span>
        </button>

        <button className="new-chat-btn" onClick={() => setShowProjects(true)} style={{ marginTop: 4 }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z"/></svg>
          <span className="new-chat-label">Projects</span>
        </button>

        <div className="sessions-list">
          {sessions.map(s => (
            <div key={s.session_id} className={`session-item ${s.session_id === sessionId ? 'active' : ''}`} onClick={() => loadSession(s.session_id)}>
              <div className="session-icon">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>
              </div>
              <span className="session-title">{s.title || 'New Chat'}</span>
              <button className="session-delete" onClick={(e) => { e.stopPropagation(); deleteSession(s.session_id); }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
              </button>
            </div>
          ))}
        </div>

        <div className="sidebar-footer" ref={userMenuRef}>
          <div className="user-info" onClick={() => setShowUserMenu(!showUserMenu)} style={{ cursor: 'pointer', position: 'relative' }}>
            <div className="avatar">{user.username[0].toUpperCase()}</div>
            <span>{user.display_name || user.username}</span>
            {user.role === 'admin' && <a href="/admin" className="admin-badge">Admin</a>}
            {showUserMenu && (
              <div className="user-dropdown">
                <button onClick={(e) => { e.stopPropagation(); setShowUserMenu(false); setShowSettings(true); }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 01-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/></svg>
                  Settings
                </button>
                <button onClick={(e) => { e.stopPropagation(); setShowUserMenu(false); setShowProfile(true); }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                  User Settings
                </button>
                <div className="dropdown-divider"></div>
                <button onClick={(e) => { e.stopPropagation(); setShowUserMenu(false); onLogout(); }} className="logout-item">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9"/></svg>
                  Log out
                </button>
              </div>
            )}
          </div>
        </div>

        {sidebarOpen && (
          <div className="sidebar-resize-handle"
            onMouseDown={(e) => { e.preventDefault(); isDragging.current = true; document.body.style.cursor = 'col-resize'; document.body.style.userSelect = 'none'; }} />
        )}
      </div>

      {isMobile && <div className={`sidebar-overlay ${sidebarOpen ? 'visible' : ''}`} onClick={closeSidebar} />}

      {isMobile && !sidebarOpen && (
        <button className="sidebar-mobile-toggle" onClick={toggleSidebar}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 12h18M3 6h18M3 18h18"/></svg>
        </button>
      )}

      {!sidebarOpen && !isMobile && (
        <button className="sidebar-open-btn" onClick={() => setSidebarOpen(true)}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 18l6-6-6-6"/></svg>
        </button>
      )}

      <div className="main" style={userTextColor ? { color: userTextColor } : {}}>
        <div className="main-header">
          <a href="/" className="home-btn" title="Back to Home">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-4 0a1 1 0 01-1-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 01-1 1h-2"/></svg>
          </a>
          <h2>{messages.length > 0 ? 'Chat' : 'Determine-AI'}</h2>
        </div>

        <div className={`messages ${chatBg ? 'has-bg' : ''}`} style={chatBg ? { backgroundImage: `url(${chatBg})` } : {}}>
          <div className="messages-bg-overlay" style={chatBg ? { opacity: 0.85 } : { opacity: 0 }}></div>
          <div className="messages-inner">
            {messages.length === 0 && (
              <div className="empty-state">
                <div className="empty-logo">
                  <Logo size={80} className="pulse" />
                </div>
                <h2>{t('chat.emptyTitle')}, {user.username}</h2>
                <p>{t('chat.emptyDesc')}</p>
                {dailyLimit !== -1 && <p className="usage-hint">{dailyUsed} / {dailyLimit} {t('chat.emptyUsage')}</p>}
                <div className="quick-actions">
                  {homeSuggestions.map((s, i) => (
                    <button key={i} onClick={() => sendMessage(s)}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3M12 17h.01"/></svg>
                      {s}
                    </button>
                  ))}
                </div>
                <div className="bg-controls">
                  <button className="bg-btn" onClick={() => bgInputRef.current?.click()} title={t('chat.setBackground')}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/></svg>
                    {chatBg ? t('chat.changeBackground') : t('chat.setBackground')}
                  </button>
                  {chatBg && (
                    <button className="bg-btn bg-btn-clear" onClick={clearBg} title={t('chat.removeBg')}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
                      {t('chat.removeBg')}
                    </button>
                  )}
                </div>
              </div>
            )}
            {messages.map((msg, i) => <ChatMessage key={i} message={msg} aiTextColor={userSettings.aiTextColor} fontSize={userSettings.fontSize} />)}
            <div ref={messagesEndRef} />
          </div>
        </div>

        {pendingImage && (
          <div className="image-preview-bar">
            <img src={pendingImage.preview} alt="Upload preview" />
            <span>{pendingImage.name}</span>
            <button onClick={() => setPendingImage(null)} className="remove-img">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
            </button>
          </div>
        )}

        <ChatInput onSend={sendMessage} disabled={isGenerating} onImageUpload={() => fileInputRef.current?.click()} hasImage={!!pendingImage} selectedVersion={selectedVersion} onVersionChange={(v) => { setSelectedVersion(v); localStorage.setItem(`ai_version_${user.username}`, v); }} />
        <input ref={fileInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleImageSelect} />
        <input ref={bgInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleBgSelect} />
      </div>
    </div>
  );
}

function ProtectedRoute({ user, children }) {
  const location = useLocation();
  if (!user) return <Navigate to="/login" state={{ from: location.pathname + location.search }} replace />;
  return children;
}

function App() {
  const [user, setUser] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const stored = localStorage.getItem('user');
    if (token && stored) {
      fetch(`${API}/api/auth/me`, { headers: { Authorization: `Bearer ${token}` } })
        .then(r => r.ok ? r.json() : null)
        .then(data => { if (data) setUser(data); else localStorage.clear(); setAuthChecked(true); })
        .catch(() => { localStorage.clear(); setAuthChecked(true); });
    } else {
      setAuthChecked(true);
    }
  }, []);

  const handleLogout = () => { localStorage.removeItem('token'); localStorage.removeItem('user'); setUser(null); };
  const handleAuth = (data) => { setUser(data); };

  return (
    <BrowserRouter>
      <HeroParticles />
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/features" element={<LandingPage />} />
        <Route path="/pricing" element={<LandingPage />} />
        <Route path="/changelog" element={<ChangelogPage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/privacy" element={<PrivacyPage />} />
        <Route path="/terms" element={<TermsPage />} />
        <Route path="/status" element={<StatusPage />} />
        <Route path="/docs" element={<DocsPage />} />
        <Route path="/blog" element={<BlogPage />} />
        <Route path="/login" element={user ? <Navigate to="/chat" replace /> : <AuthPage onAuth={handleAuth} />} />
        <Route path="/register" element={user ? <Navigate to="/chat" replace /> : <AuthPage onAuth={handleAuth} />} />
        <Route path="/plans" element={
          <ProtectedRoute user={user}>
            <PremiumPage user={user} onSubscribed={() => {}} />
          </ProtectedRoute>
        } />
        <Route path="/teach" element={
          <ProtectedRoute user={user}>
            <TeachingPage />
          </ProtectedRoute>
        } />
        <Route path="/generate" element={
          <ProtectedRoute user={user}>
            <ImageGenPage />
          </ProtectedRoute>
        } />
        <Route path="/chat" element={
          <ProtectedRoute user={user}>
            <ChatApp user={user} onLogout={handleLogout} onUserUpdate={setUser} />
          </ProtectedRoute>
        } />
        <Route path="/chat/:sessionId" element={
          <ProtectedRoute user={user}>
            <ChatApp user={user} onLogout={handleLogout} onUserUpdate={setUser} />
          </ProtectedRoute>
        } />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
