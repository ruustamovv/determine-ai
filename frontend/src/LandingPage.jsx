import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { t, setLanguage } from './i18n';
import Logo from './Logo';

/* ─── RotatingLogo ─────────────────────────────────────────── */
function RotatingLogo({ size = 120 }) {
  const [rot, setRot] = useState({ x: 0, y: 0 });
  useEffect(() => {
    let frame;
    let t = 0;
    const animate = () => {
      t += 0.008;
      setRot({ x: Math.sin(t) * 15, y: t * 40 });
      frame = requestAnimationFrame(animate);
    };
    animate();
    return () => cancelAnimationFrame(frame);
  }, []);

  return (
    <div
      style={{
        width: size, height: size,
        transform: `perspective(600px) rotateX(${rot.x}deg) rotateY(${rot.y}deg)`,
        transition: 'transform 0.05s linear',
        filter: 'drop-shadow(0 0 30px rgba(124,58,237,0.3))',
      }}
    >
      <Logo size={size} />
    </div>
  );
}

/* ─── ScrollReveal ─────────────────────────────────────────── */
function ScrollReveal({ children, delay = 0, style = {} }) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); obs.disconnect(); } },
      { threshold: 0.12 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(40px)',
        transition: `opacity 0.7s cubic-bezier(0.23,1,0.32,1) ${delay}s, transform 0.7s cubic-bezier(0.23,1,0.32,1) ${delay}s`,
        ...style,
      }}
    >
      {children}
    </div>
  );
}

/* ─── TerminalDemo ─────────────────────────────────────────── */
function TerminalDemo() {
  const lines = [
    { type: 'prompt', text: '$ dc ask "Explain how React hooks work"' },
    { type: 'ai', text: 'React hooks let you use state and lifecycle features in functional components.' },
    { type: 'ai', text: 'Key rules:\n  1. Only call hooks at the top level\n  2. Only call hooks from React functions' },
    { type: 'ai', text: 'The most common hooks are useState, useEffect, and useRef.' },
    { type: 'prompt', text: '$ dc generate "fullstack app with auth"' },
    { type: 'ai', text: 'Generating full-stack project...\n  Backend:  FastAPI + MongoDB\n  Frontend: React + Vite\n  Auth:     JWT + Google OAuth' },
    { type: 'success', text: 'Project created in ./myapp/' },
  ];

  const [visibleCount, setVisibleCount] = useState(0);
  const [charIndex, setCharIndex] = useState(0);

  useEffect(() => {
    if (visibleCount >= lines.length) return;
    const line = lines[visibleCount];
    if (charIndex < line.text.length) {
      const timer = setTimeout(() => setCharIndex((c) => c + 1), 12 + Math.random() * 18);
      return () => clearTimeout(timer);
    } else {
      const timer = setTimeout(() => { setVisibleCount((c) => c + 1); setCharIndex(0); }, 400);
      return () => clearTimeout(timer);
    }
  }, [visibleCount, charIndex]);

  useEffect(() => {
    const interval = setInterval(() => { setVisibleCount(0); setCharIndex(0); }, 14000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div style={{
      background: 'rgba(10,10,16,0.95)', border: '1px solid rgba(30,30,46,0.6)',
      borderRadius: 14, overflow: 'hidden', fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
      boxShadow: '0 20px 80px rgba(0,0,0,0.5), 0 0 0 1px rgba(124,58,237,0.08)',
      maxWidth: 640, margin: '0 auto',
    }}>
      <div style={{
        display: 'flex', alignItems: 'center', gap: 7, padding: '12px 16px',
        borderBottom: '1px solid rgba(30,30,46,0.5)',
      }}>
        <span style={{ width: 11, height: 11, borderRadius: '50%', background: '#ff5f57' }} />
        <span style={{ width: 11, height: 11, borderRadius: '50%', background: '#febc2e' }} />
        <span style={{ width: 11, height: 11, borderRadius: '50%', background: '#28c840' }} />
        <span style={{ marginLeft: 10, fontSize: 11, color: '#5a5a6e' }}>determine-coder — terminal</span>
      </div>
      <div style={{ padding: '20px 20px', minHeight: 280, fontSize: 13, lineHeight: 1.8 }}>
        {lines.slice(0, visibleCount).map((line, i) => (
          <div key={i} style={{ marginBottom: 6 }}>
            <span style={{ color: line.type === 'prompt' ? '#a78bfa' : line.type === 'success' ? '#22c55e' : '#8888a0' }}>
              {line.text}
            </span>
          </div>
        ))}
        {visibleCount < lines.length && (
          <div>
            <span style={{ color: lines[visibleCount].type === 'prompt' ? '#a78bfa' : '#8888a0' }}>
              {lines[visibleCount].text.slice(0, charIndex)}
            </span>
            <span style={{
              display: 'inline-block', width: 7, height: 15, marginLeft: 1,
              background: '#a78bfa', verticalAlign: 'middle',
              animation: 'blink 1s step-end infinite',
            }} />
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── CursorGlow ───────────────────────────────────────────── */
function CursorGlow() {
  const glowRef = useRef(null);
  useEffect(() => {
    const onMove = (e) => {
      if (glowRef.current) {
        glowRef.current.style.left = e.clientX + 'px';
        glowRef.current.style.top = e.clientY + 'px';
      }
    };
    window.addEventListener('mousemove', onMove);
    return () => window.removeEventListener('mousemove', onMove);
  }, []);
  return (
    <div ref={glowRef} style={{
      position: 'fixed', width: 500, height: 500, borderRadius: '50%',
      background: 'radial-gradient(circle, rgba(124,58,237,0.06) 0%, transparent 70%)',
      transform: 'translate(-50%, -50%)', pointerEvents: 'none', zIndex: 1,
      transition: 'left 0.15s ease-out, top 0.15s ease-out',
    }} />
  );
}

/* ─── FeatureCard3D ────────────────────────────────────────── */
function FeatureCard3D({ icon, title, desc, detail }) {
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const [hovered, setHovered] = useState(false);
  const cardRef = useRef(null);

  return (
    <div
      ref={cardRef}
      onMouseMove={(e) => {
        const r = cardRef.current.getBoundingClientRect();
        setTilt({
          x: ((e.clientY - r.top) / r.height - 0.5) * -10,
          y: ((e.clientX - r.left) / r.width - 0.5) * 10,
        });
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => { setHovered(false); setTilt({ x: 0, y: 0 }); }}
    >
      <div style={{
        background: hovered ? 'rgba(18,18,26,0.95)' : 'rgba(14,14,20,0.8)',
        border: hovered ? '1px solid rgba(124,58,237,0.3)' : '1px solid rgba(30,30,46,0.6)',
        borderRadius: 16, padding: '32px 28px', transition: 'all 0.4s cubic-bezier(0.23,1,0.32,1)',
        transform: `perspective(1000px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg) ${hovered ? 'translateY(-8px)' : ''}`,
        boxShadow: hovered
          ? '0 20px 60px rgba(124,58,237,0.12), inset 0 1px 0 rgba(255,255,255,0.03)'
          : '0 2px 12px rgba(0,0,0,0.3)',
        backdropFilter: 'blur(20px)',
      }}>
        <div style={{
          width: 44, height: 44, borderRadius: 12,
          background: 'linear-gradient(135deg, rgba(124,58,237,0.12), rgba(59,130,246,0.08))',
          border: '1px solid rgba(124,58,237,0.15)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          marginBottom: 20, fontSize: 20,
        }}>{icon}</div>
        <h3 style={{
          fontSize: 16, fontWeight: 600, marginBottom: 10,
          color: '#e8e8f0', fontFamily: "'Inter', -apple-system, sans-serif",
          letterSpacing: '-0.01em',
        }}>{title}</h3>
        <p style={{
          fontSize: 14, lineHeight: 1.65, color: '#6b6b80',
          fontFamily: "'Inter', -apple-system, sans-serif",
        }}>{desc}</p>
        {detail && (
          <div style={{
            marginTop: 14, padding: '10px 14px', borderRadius: 8,
            background: 'rgba(124,58,237,0.05)', border: '1px solid rgba(124,58,237,0.08)',
            fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: '#a78bfa',
            lineHeight: 1.5,
          }}>{detail}</div>
        )}
      </div>
    </div>
  );
}

/* ─── PricingCard ──────────────────────────────────────────── */
function PricingCard({ tier, featured }) {
  const [hovered, setHovered] = useState(false);
  const navigate = useNavigate();
  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        position: 'relative',
        background: featured
          ? 'linear-gradient(135deg, rgba(124,58,237,0.08), rgba(59,130,246,0.04))'
          : 'rgba(14,14,20,0.7)',
        border: featured ? '1px solid rgba(124,58,237,0.3)' : '1px solid rgba(30,30,46,0.5)',
        borderRadius: 16, padding: '36px 28px', textAlign: 'center',
        transition: 'all 0.4s cubic-bezier(0.23,1,0.32,1)',
        transform: hovered ? 'translateY(-6px)' : 'none',
        boxShadow: hovered ? '0 20px 50px rgba(0,0,0,0.3)' : 'none',
      }}
    >
      {featured && (
        <div style={{
          position: 'absolute', top: -11, left: '50%', transform: 'translateX(-50%)',
          padding: '4px 14px', borderRadius: 20, fontSize: 11, fontWeight: 600,
          background: 'linear-gradient(135deg, #7c3aed, #2563eb)',
          color: 'white', whiteSpace: 'nowrap', letterSpacing: '0.5px',
        }}>{t('pricing.popular')}</div>
      )}
      <div style={{
        width: 44, height: 44, borderRadius: 12,
        background: featured ? 'linear-gradient(135deg, #7c3aed, #2563eb)' : '#1a1a26',
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        fontWeight: 700, fontSize: 18, color: 'white', marginBottom: 16,
      }}>{tier.name[0]}</div>
      <h3 style={{ fontSize: 17, fontWeight: 600, marginBottom: 6, color: '#e8e8f0' }}>{tier.name}</h3>
      <div style={{ marginBottom: 24 }}>
        <span style={{ fontSize: 34, fontWeight: 700, color: '#f0f0f5', letterSpacing: '-0.02em' }}>${tier.price}</span>
        <span style={{ fontSize: 13, color: '#6b6b80', marginLeft: 4 }}>{tier.period}</span>
      </div>
      <ul style={{ listStyle: 'none', textAlign: 'left', marginBottom: 28 }}>
        {tier.features.map((f, i) => (
          <li key={i} style={{
            display: 'flex', alignItems: 'center', gap: 10,
            padding: '9px 0', fontSize: 13, color: '#8888a0',
            borderBottom: i < tier.features.length - 1 ? '1px solid rgba(30,30,46,0.5)' : 'none',
          }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2.5">
              <path d="M20 6L9 17l-5-5" />
            </svg>
            {f}
          </li>
        ))}
      </ul>
      <button
        onClick={() => navigate('/plans')}
        style={{
          width: '100%', padding: '11px', border: featured ? 'none' : '1px solid rgba(30,30,46,0.5)',
          borderRadius: 10, background: featured ? 'linear-gradient(135deg, #7c3aed, #2563eb)' : 'rgba(18,18,26,0.6)',
          color: 'white', fontSize: 13, fontWeight: 600, cursor: 'pointer',
          transition: 'all 0.2s',
        }}
      >{t('pricing.upgrade')}</button>
    </div>
  );
}

/* ─── FAQAccordion ─────────────────────────────────────────── */
function FAQAccordion({ items }) {
  const [openIndex, setOpenIndex] = useState(null);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      {items.map((item, i) => (
        <div key={i} style={{
          border: openIndex === i ? '1px solid rgba(124,58,237,0.2)' : '1px solid rgba(30,30,46,0.4)',
          borderRadius: 12, overflow: 'hidden', transition: 'all 0.3s',
        }}>
          <button
            onClick={() => setOpenIndex(openIndex === i ? null : i)}
            style={{
              width: '100%', padding: '18px 20px', border: 'none',
              background: openIndex === i ? 'rgba(124,58,237,0.04)' : 'transparent',
              color: '#e8e8f0', fontSize: 14, fontWeight: 600, cursor: 'pointer',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              textAlign: 'left', transition: 'background 0.2s',
            }}
          >
            <span>{item.q}</span>
            <svg
              width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#6b6b80" strokeWidth="2"
              style={{ transform: openIndex === i ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.3s', flexShrink: 0, marginLeft: 12 }}
            >
              <path d="M6 9l6 6 6-6" />
            </svg>
          </button>
          <div style={{
            maxHeight: openIndex === i ? 200 : 0, overflow: 'hidden',
            transition: 'max-height 0.3s ease, padding 0.3s ease',
            padding: openIndex === i ? '0 20px 18px' : '0 20px',
          }}>
            <p style={{ fontSize: 14, lineHeight: 1.7, color: '#6b6b80', margin: 0 }}>{item.a}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

/* ─── DocSection ───────────────────────────────────────────── */
function DocSection() {
  const docs = [
    { title: 'System Requirements', content: 'Python 3.8+, 4GB+ RAM, modern CPU. GPU recommended for faster inference but not required.' },
    { title: 'Installation', content: 'Clone the repo, install requirements.txt, configure .env with your MongoDB URI, then run: python run.py' },
    { title: 'CLI Setup', content: 'Install the coding CLI: npm install -g determine-coder. Login: dc login --server http://your-server:8000. Start coding: dc chat' },
    { title: 'Configuration', content: 'Edit .env for database, JWT secret, model settings. Admin panel at /admin for AI system prompt, version management, and user roles.' },
    { title: 'API Endpoints', content: 'POST /api/auth/login, POST /api/chat, POST /api/coder/chat, POST /api/generate-image, GET /api/sessions, GET /api/messages/:id' },
    { title: 'Roles & Permissions', content: 'Owner: full control. Admin: user management, AI config. Moderator: content review. User: chat only.' },
    { title: 'Deployment', content: 'Works behind Nginx/Caddy. Set CORS origins in .env. Use systemd or Docker for production.' },
  ];

  const [activeDoc, setActiveDoc] = useState(0);

  return (
    <div style={{
      display: 'grid', gridTemplateColumns: '220px 1fr', gap: 0,
      border: '1px solid rgba(30,30,46,0.4)', borderRadius: 12, overflow: 'hidden',
      minHeight: 200,
    }}>
      <div style={{
        background: 'rgba(10,10,15,0.6)', borderRight: '1px solid rgba(30,30,46,0.4)',
        padding: '8px 0',
      }}>
        {docs.map((doc, i) => (
          <button
            key={i}
            onClick={() => setActiveDoc(i)}
            style={{
              width: '100%', padding: '10px 16px', border: 'none', textAlign: 'left',
              background: activeDoc === i ? 'rgba(124,58,237,0.08)' : 'transparent',
              color: activeDoc === i ? '#a78bfa' : '#6b6b80',
              fontSize: 13, fontWeight: activeDoc === i ? 600 : 400,
              cursor: 'pointer', transition: 'all 0.2s',
              borderLeft: activeDoc === i ? '2px solid #7c3aed' : '2px solid transparent',
            }}
          >{doc.title}</button>
        ))}
      </div>
      <div style={{ padding: '24px 28px', background: 'rgba(14,14,20,0.5)' }}>
        <h4 style={{ fontSize: 16, fontWeight: 600, color: '#e8e8f0', marginBottom: 12, marginTop: 0 }}>
          {docs[activeDoc].title}
        </h4>
        <p style={{ fontSize: 14, lineHeight: 1.7, color: '#8888a0', margin: 0 }}>
          {docs[activeDoc].content}
        </p>
        <div style={{
          marginTop: 16, padding: '12px 16px', borderRadius: 8,
          background: 'rgba(124,58,237,0.05)', border: '1px solid rgba(124,58,237,0.1)',
          fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
          fontSize: 13, color: '#a78bfa',
        }}>
          {activeDoc === 2 && '$ python run.py'}
          {activeDoc === 1 && '$ git clone https://github.com/user/determine-ai && pip install -r requirements.txt'}
          {activeDoc === 3 && 'POST /api/auth/login\nPOST /api/chat\nGET  /api/sessions\nGET  /api/messages/:id'}
          {activeDoc === 4 && 'roles = ["owner", "admin", "moderator", "user"]\nplans = ["free", "basic", "pro", "enterprise"]'}
          {activeDoc === 5 && '# docker-compose.yml or systemd unit\nPORT=8000\nMONGO_URL=mongodb+srv://...'}
          {activeDoc === 0 && 'python >= 3.8\nram >= 4GB\ncpu >= 4 cores\ngpu = optional (CUDA recommended)'}
        </div>
      </div>
    </div>
  );
}

/* ─── ParallaxSection ───────────────────────────────────────── */
function ParallaxSection({ children, speed = 0.3, style = {} }) {
  const ref = useRef(null);
  const [offset, setOffset] = useState(0);
  useEffect(() => {
    const onScroll = () => {
      if (!ref.current) return;
      const rect = ref.current.getBoundingClientRect();
      const center = rect.top + rect.height / 2;
      const viewCenter = window.innerHeight / 2;
      setOffset((center - viewCenter) * speed);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, [speed]);
  return (
    <div ref={ref} style={{ transform: `translateY(${offset}px)`, transition: 'transform 0.1s linear', ...style }}>
      {children}
    </div>
  );
}

/* ─── CounterStat ──────────────────────────────────────────── */
function CounterStat({ value, label, delay = 0 }) {
  const [count, setCount] = useState(0);
  const [started, setStarted] = useState(false);
  const ref = useRef(null);
  const numericVal = parseInt(value.replace(/[^0-9]/g, ''), 10);
  const suffix = value.replace(/[0-9]/g, '');

  useEffect(() => {
    if (!started) return;
    let frame;
    let start = 0;
    const duration = 1500;
    const startTime = performance.now();
    const animate = (now) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.floor(eased * numericVal));
      if (progress < 1) frame = requestAnimationFrame(animate);
    };
    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  }, [started, numericVal]);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setTimeout(() => setStarted(true), delay * 1000); obs.disconnect(); } },
      { threshold: 0.3 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [delay]);

  return (
    <div ref={ref} style={{ textAlign: 'center' }}>
      <div style={{
        fontSize: 28, fontWeight: 700, color: '#a78bfa',
        letterSpacing: '-0.02em', fontFamily: "'JetBrains Mono', monospace",
      }}>{started ? count : 0}{suffix}</div>
      <div style={{ fontSize: 12, color: 'inherit', marginTop: 4, textTransform: 'uppercase', letterSpacing: '0.08em', opacity: 0.6 }}>{label}</div>
    </div>
  );
}

/* ─── AnimatedParticles ────────────────────────────────────── */
function AnimatedParticles() {
  const canvasRef = useRef(null);
  const raf = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    let w = (canvas.width = window.innerWidth);
    let h = (canvas.height = window.innerHeight);

    const shapes = Array.from({ length: 18 }, () => ({
      x: Math.random() * w,
      y: Math.random() * h,
      vx: (Math.random() - 0.5) * 0.3,
      vy: (Math.random() - 0.5) * 0.2 - 0.1,
      size: Math.random() * 8 + 4,
      rotation: Math.random() * Math.PI * 2,
      rotSpeed: (Math.random() - 0.5) * 0.01,
      type: ['triangle', 'circle', 'diamond'][Math.floor(Math.random() * 3)],
      alpha: Math.random() * 0.12 + 0.04,
      color: Math.random() > 0.5 ? 'rgba(124,58,237,' : 'rgba(59,130,246,',
    }));

    const onResize = () => { w = canvas.width = window.innerWidth; h = canvas.height = window.innerHeight; };
    window.addEventListener('resize', onResize);

    const draw = () => {
      ctx.clearRect(0, 0, w, h);
      for (const s of shapes) {
        s.x += s.vx; s.y += s.vy;
        s.rotation += s.rotSpeed;
        if (s.x < -20) s.x = w + 20;
        if (s.x > w + 20) s.x = -20;
        if (s.y < -20) s.y = h + 20;
        if (s.y > h + 20) s.y = -20;

        ctx.save();
        ctx.translate(s.x, s.y);
        ctx.rotate(s.rotation);
        ctx.globalAlpha = s.alpha;

        if (s.type === 'circle') {
          ctx.beginPath();
          ctx.arc(0, 0, s.size / 2, 0, Math.PI * 2);
          ctx.fillStyle = s.color + s.alpha + ')';
          ctx.fill();
        } else if (s.type === 'triangle') {
          const r = s.size / 2;
          ctx.beginPath();
          ctx.moveTo(0, -r);
          ctx.lineTo(-r * 0.866, r * 0.5);
          ctx.lineTo(r * 0.866, r * 0.5);
          ctx.closePath();
          ctx.strokeStyle = s.color + (s.alpha * 1.5) + ')';
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
          ctx.strokeStyle = s.color + (s.alpha * 1.5) + ')';
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

  return <canvas ref={canvasRef} style={{ position: 'absolute', inset: 0, zIndex: 2, pointerEvents: 'none' }} />;
}

/* ─── GridBackground ───────────────────────────────────────── */
function GridBackground() {
  const [pulse, setPulse] = useState(0);
  useEffect(() => {
    let frame;
    let t = 0;
    const animate = () => {
      t += 0.003;
      setPulse(Math.sin(t) * 0.015 + 0.04);
      frame = requestAnimationFrame(animate);
    };
    animate();
    return () => cancelAnimationFrame(frame);
  }, []);

  return (
    <div style={{
      position: 'absolute', inset: 0, zIndex: 1, pointerEvents: 'none',
      opacity: pulse,
      backgroundImage:
        'linear-gradient(rgba(124,58,237,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(124,58,237,0.5) 1px, transparent 1px)',
      backgroundSize: '60px 60px',
      transition: 'opacity 0.3s linear',
    }} />
  );
}

/* ─── FloatingOrb (decorative) ─────────────────────────────── */
function FloatingOrb({ size, color, top, left, delay }) {
  const [pos, setPos] = useState({ x: 0, y: 0 });
  useEffect(() => {
    let frame;
    let t = delay || 0;
    const animate = () => {
      t += 0.005;
      setPos({ x: Math.sin(t) * 20, y: Math.cos(t * 0.7) * 15 });
      frame = requestAnimationFrame(animate);
    };
    animate();
    return () => cancelAnimationFrame(frame);
  }, [delay]);

  return (
    <div style={{
      position: 'absolute', width: size, height: size, borderRadius: '50%',
      background: `radial-gradient(circle, ${color} 0%, transparent 70%)`,
      top, left, transform: `translate(${pos.x}px, ${pos.y}px)`,
      filter: 'blur(40px)', pointerEvents: 'none', opacity: 0.4,
    }} />
  );
}

/* ─── InteractiveCard3D ────────────────────────────────────── */
function InteractiveCard3D({ label, tagColor = '#a78bfa', children }) {
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const [hovered, setHovered] = useState(false);
  const cardRef = useRef(null);

  return (
    <div
      ref={cardRef}
      onMouseMove={(e) => {
        const r = cardRef.current.getBoundingClientRect();
        setTilt({
          x: ((e.clientY - r.top) / r.height - 0.5) * -12,
          y: ((e.clientX - r.left) / r.width - 0.5) * 12,
        });
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => { setHovered(false); setTilt({ x: 0, y: 0 }); }}
      style={{
        position: 'relative',
        background: hovered ? 'rgba(18,18,26,0.95)' : 'rgba(14,14,20,0.8)',
        border: hovered ? `1px solid ${tagColor}40` : '1px solid rgba(30,30,46,0.6)',
        borderRadius: 16, overflow: 'visible',
        transition: 'all 0.4s cubic-bezier(0.23,1,0.32,1)',
        transform: `perspective(1000px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg) ${hovered ? 'translateY(-10px) scale(1.02)' : ''}`,
        boxShadow: hovered
          ? `0 24px 80px rgba(124,58,237,0.15), 0 0 30px ${tagColor}15, inset 0 1px 0 rgba(255,255,255,0.04)`
          : '0 4px 20px rgba(0,0,0,0.3)',
        backdropFilter: 'blur(20px)',
      }}
    >
      <div style={{
        position: 'absolute', top: -10, left: 20, zIndex: 2,
        padding: '4px 12px', borderRadius: 8, fontSize: 11, fontWeight: 600,
        background: `linear-gradient(135deg, ${tagColor}, ${tagColor}cc)`,
        color: 'white', letterSpacing: '0.03em',
        boxShadow: `0 4px 16px ${tagColor}40`,
      }}>{label}</div>
      <div style={{ padding: '36px 24px 24px' }}>
        {children}
      </div>
    </div>
  );
}

/* ─── InteractiveExamplesSection ──────────────────────────── */
function InteractiveExamplesSection() {
  const chatMessages = [
    { role: 'user', text: 'What is a closure in JavaScript?' },
    { role: 'ai', text: 'A closure is a function that retains access to its lexical scope even when executed outside that scope.' },
    { role: 'ai', text: 'For example, an inner function "remembers" variables from its parent function after the parent has returned.' },
    { role: 'user', text: 'Show me a practical use case' },
    { role: 'ai', text: 'Common uses: data privacy (module pattern), event handlers with state, and memoization / caching.' },
  ];
  const [chatIdx, setChatIdx] = useState(0);
  const [chatChar, setChatChar] = useState(0);

  useEffect(() => {
    if (chatIdx >= chatMessages.length) {
      const t = setTimeout(() => { setChatIdx(0); setChatChar(0); }, 3000);
      return () => clearTimeout(t);
    }
    const msg = chatMessages[chatIdx];
    if (chatChar < msg.text.length) {
      const t = setTimeout(() => setChatChar(c => c + 1), 14 + Math.random() * 20);
      return () => clearTimeout(t);
    }
    const t = setTimeout(() => { setChatIdx(c => c + 1); setChatChar(0); }, 500);
    return () => clearTimeout(t);
  }, [chatIdx, chatChar]);

  const imageBlur = (() => {
    const [blur, setBlur] = useState(20);
    const [opacity, setOpacity] = useState(0.3);
    useEffect(() => {
      let step = 0;
      const iv = setInterval(() => {
        step++;
        setBlur(Math.max(0, 20 - step * 2));
        setOpacity(Math.min(1, 0.3 + step * 0.07));
        if (step >= 14) { setTimeout(() => { setBlur(20); setOpacity(0.3); step = 0; }, 2500); }
      }, 300);
      return () => clearInterval(iv);
    }, []);
    return { blur, opacity };
  })();

  const cliCommands = [
    { cmd: 'dc explain server.py', desc: 'Understand any file' },
    { cmd: 'dc fix src/utils.js -d "TypeError"', desc: 'Fix bugs instantly' },
    { cmd: 'dc refactor --improve', desc: 'Refactor with AI' },
  ];
  const [cliIdx, setCliIdx] = useState(0);
  const [cliChar, setCliChar] = useState(0);

  useEffect(() => {
    if (cliIdx >= cliCommands.length) {
      const t = setTimeout(() => { setCliIdx(0); setCliChar(0); }, 2500);
      return () => clearTimeout(t);
    }
    const cmd = cliCommands[cliIdx].cmd;
    if (cliChar < cmd.length) {
      const t = setTimeout(() => setCliChar(c => c + 1), 35 + Math.random() * 40);
      return () => clearTimeout(t);
    }
    const t = setTimeout(() => { setCliIdx(c => c + 1); setCliChar(0); }, 1200);
    return () => clearTimeout(t);
  }, [cliIdx, cliChar]);

  return (
    <section style={{ position: 'relative', zIndex: 5, padding: '60px 40px 80px', maxWidth: 1100, margin: '0 auto' }}>
      <ScrollReveal>
        <div style={{ textAlign: 'center', marginBottom: 48 }}>
          <div style={{
            padding: '4px 12px', borderRadius: 16, border: '1px solid rgba(124,58,237,0.2)',
            background: 'rgba(124,58,237,0.05)', color: '#a78bfa',
            fontSize: 11, fontWeight: 600, marginBottom: 16,
            display: 'inline-block', textTransform: 'uppercase', letterSpacing: '0.08em',
          }}>Interactive Demos</div>
          <h2 style={{ fontSize: 'clamp(26px, 3.5vw, 36px)', fontWeight: 700, marginBottom: 10, letterSpacing: '-0.03em' }}>
            See Determine-AI in Action
          </h2>
          <p style={{ fontSize: 16, color: '#6b6b80', maxWidth: 520, margin: '0 auto', lineHeight: 1.7 }}>
            Explore interactive demos of our core features. Hover to interact.
          </p>
        </div>
      </ScrollReveal>

      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 20,
        alignItems: 'stretch',
      }}>
        {/* Card 1: AI Chat Demo */}
        <ScrollReveal delay={0}>
          <InteractiveCard3D label="AI Chat" tagColor="#7c3aed">
            <div style={{
              background: 'rgba(10,10,16,0.6)', borderRadius: 12, padding: '16px',
              border: '1px solid rgba(30,30,46,0.4)', minHeight: 220,
              fontFamily: "'Inter', -apple-system, sans-serif",
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 14, paddingBottom: 10, borderBottom: '1px solid rgba(30,30,46,0.4)' }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#22c55e' }} />
                <span style={{ fontSize: 11, color: '#6b6b80', fontWeight: 500 }}>Determine-AI Chat</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {chatMessages.slice(0, chatIdx).map((m, i) => (
                  <div key={i} style={{
                    alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start',
                    maxWidth: '85%', padding: '8px 12px', borderRadius: 10,
                    fontSize: 12, lineHeight: 1.5,
                    background: m.role === 'user' ? 'rgba(124,58,237,0.15)' : 'rgba(30,30,46,0.5)',
                    color: m.role === 'user' ? '#c4b5fd' : '#8888a0',
                    borderBottomRightRadius: m.role === 'user' ? 2 : 10,
                    borderBottomLeftRadius: m.role === 'user' ? 10 : 2,
                  }}>{m.text}</div>
                ))}
                {chatIdx < chatMessages.length && (
                  <div style={{
                    alignSelf: chatMessages[chatIdx].role === 'user' ? 'flex-end' : 'flex-start',
                    maxWidth: '85%', padding: '8px 12px', borderRadius: 10,
                    fontSize: 12, lineHeight: 1.5,
                    background: chatMessages[chatIdx].role === 'user' ? 'rgba(124,58,237,0.15)' : 'rgba(30,30,46,0.5)',
                    color: chatMessages[chatIdx].role === 'user' ? '#c4b5fd' : '#8888a0',
                    borderBottomRightRadius: chatMessages[chatIdx].role === 'user' ? 2 : 10,
                    borderBottomLeftRadius: chatMessages[chatIdx].role === 'user' ? 10 : 2,
                  }}>
                    {chatMessages[chatIdx].text.slice(0, chatChar)}
                    <span style={{
                      display: 'inline-block', width: 6, height: 13, marginLeft: 1,
                      background: '#a78bfa', verticalAlign: 'middle',
                      animation: 'blink 1s step-end infinite',
                    }} />
                  </div>
                )}
              </div>
            </div>
          </InteractiveCard3D>
        </ScrollReveal>

        {/* Card 2: Image Generation Demo */}
        <ScrollReveal delay={0.1}>
          <InteractiveCard3D label="Image Generation" tagColor="#3b82f6">
            <div style={{
              background: 'rgba(10,10,16,0.6)', borderRadius: 12, padding: '16px',
              border: '1px solid rgba(30,30,46,0.4)', minHeight: 220,
              fontFamily: "'Inter', -apple-system, sans-serif",
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 14, paddingBottom: 10, borderBottom: '1px solid rgba(30,30,46,0.4)' }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#3b82f6' }} />
                <span style={{ fontSize: 11, color: '#6b6b80', fontWeight: 500 }}>Pollinations.ai</span>
              </div>
              <div style={{
                padding: '8px 12px', borderRadius: 8, marginBottom: 14,
                background: 'rgba(30,30,46,0.4)', border: '1px solid rgba(30,30,46,0.3)',
                display: 'flex', alignItems: 'center', gap: 8,
              }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#6b6b80" strokeWidth="1.5">
                  <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
                </svg>
                <span style={{ fontSize: 12, color: '#8888a0' }}>A sunset over a cyberpunk city...</span>
              </div>
              <div style={{
                width: '100%', height: 120, borderRadius: 10, overflow: 'hidden',
                position: 'relative',
                background: 'linear-gradient(135deg, #1a0533 0%, #0c1445 25%, #1e3a5f 50%, #4a1942 75%, #2d1b69 100%)',
                filter: `blur(${imageBlur.blur}px)`,
                opacity: imageBlur.opacity,
                transition: 'filter 0.3s, opacity 0.3s',
              }}>
                <div style={{
                  position: 'absolute', inset: 0,
                  background: 'radial-gradient(circle at 70% 30%, rgba(255,165,0,0.4), transparent 60%), radial-gradient(circle at 30% 70%, rgba(0,150,255,0.3), transparent 60%)',
                }} />
                <div style={{
                  position: 'absolute', bottom: 8, right: 8,
                  padding: '2px 8px', borderRadius: 4, fontSize: 9, fontWeight: 600,
                  background: 'rgba(0,0,0,0.5)', color: '#8888a0',
                }}>Flux Model</div>
              </div>
            </div>
          </InteractiveCard3D>
        </ScrollReveal>

        {/* Card 3: CLI Demo */}
        <ScrollReveal delay={0.2}>
          <InteractiveCard3D label="CLI Workflow" tagColor="#22c55e">
            <div style={{
              background: 'rgba(10,10,16,0.6)', borderRadius: 12, padding: '16px',
              border: '1px solid rgba(30,30,46,0.4)', minHeight: 220,
              fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 14, paddingBottom: 10, borderBottom: '1px solid rgba(30,30,46,0.4)' }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#ff5f57' }} />
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#febc2e' }} />
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#28c840' }} />
                <span style={{ marginLeft: 6, fontSize: 10, color: '#5a5a6e' }}>terminal</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: 12, lineHeight: 1.6 }}>
                {cliCommands.slice(0, cliIdx).map((c, i) => (
                  <div key={i}>
                    <div style={{ color: '#22c55e' }}>$ {c.cmd}</div>
                    <div style={{ color: '#6b6b80', fontSize: 11, paddingLeft: 8 }}>{c.desc}</div>
                  </div>
                ))}
                {cliIdx < cliCommands.length && (
                  <div>
                    <div style={{ color: '#22c55e' }}>
                      $ {cliCommands[cliIdx].cmd.slice(0, cliChar)}
                      <span style={{
                        display: 'inline-block', width: 7, height: 14, marginLeft: 1,
                        background: '#22c55e', verticalAlign: 'middle',
                        animation: 'blink 1s step-end infinite',
                      }} />
                    </div>
                    <div style={{ color: '#6b6b80', fontSize: 11, paddingLeft: 8 }}>{cliCommands[cliIdx].desc}</div>
                  </div>
                )}
              </div>
            </div>
          </InteractiveCard3D>
        </ScrollReveal>
      </div>
    </section>
  );
}

/* ─── CLIShowcaseSection ─────────────────────────────────── */
function CLIShowcaseSection() {
  const [hoveredCmd, setHoveredCmd] = useState(null);
  const navigate = useNavigate();

  const commands = [
    { cmd: 'dc chat', desc: 'Interactive coding assistant', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" strokeWidth="1.5"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg> },
    { cmd: 'dc explain src/server.py', desc: 'Explain any file in your codebase', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="1.5"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg> },
    { cmd: 'dc fix src/utils.js -d "TypeError"', desc: 'Diagnose and fix bugs automatically', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="1.5"><path d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z"/></svg> },
    { cmd: 'dc generate "REST API with auth"', desc: 'Scaffold projects from natural language', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="1.5"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg> },
  ];

  return (
    <section style={{ position: 'relative', zIndex: 5, padding: '60px 40px 80px', maxWidth: 900, margin: '0 auto' }}>
      <ScrollReveal>
        <div style={{ textAlign: 'center', marginBottom: 44 }}>
          <div style={{
            padding: '4px 12px', borderRadius: 16, border: '1px solid rgba(34,197,94,0.2)',
            background: 'rgba(34,197,94,0.05)', color: '#22c55e',
            fontSize: 11, fontWeight: 600, marginBottom: 16,
            display: 'inline-block', textTransform: 'uppercase', letterSpacing: '0.08em',
          }}>CLI Tool</div>
          <h2 style={{ fontSize: 'clamp(26px, 3.5vw, 36px)', fontWeight: 700, marginBottom: 10, letterSpacing: '-0.03em' }}>
            Determine-Coder — Your AI Coding Partner
          </h2>
          <p style={{ fontSize: 16, color: '#6b6b80', maxWidth: 480, margin: '0 auto', lineHeight: 1.7 }}>
            Write, debug, explain, and refactor code directly from your terminal.
          </p>
        </div>
      </ScrollReveal>

      {/* Install command */}
      <ScrollReveal delay={0.05}>
        <div style={{
          maxWidth: 480, margin: '0 auto 40px',
          background: 'rgba(10,10,16,0.9)', border: '1px solid rgba(30,30,46,0.5)',
          borderRadius: 12, padding: '14px 20px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
          boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ color: '#6b6b80', fontSize: 13 }}>$</span>
            <code style={{
              fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
              fontSize: 14, color: '#a78bfa', letterSpacing: '-0.01em',
            }}>npm install -g determine-coder</code>
          </div>
          <button
            onClick={() => navigator.clipboard?.writeText('npm install -g determine-coder')}
            style={{
              background: 'rgba(124,58,237,0.1)', border: '1px solid rgba(124,58,237,0.2)',
              borderRadius: 6, padding: '5px 10px', cursor: 'pointer',
              color: '#a78bfa', fontSize: 11, fontWeight: 500, transition: 'all 0.2s',
            }}
          >Copy</button>
        </div>
      </ScrollReveal>

      {/* Commands grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14, marginBottom: 40 }}>
        {commands.map((c, i) => (
          <ScrollReveal key={i} delay={0.1 + i * 0.06}>
            <div
              onMouseEnter={() => setHoveredCmd(i)}
              onMouseLeave={() => setHoveredCmd(null)}
              style={{
                background: hoveredCmd === i ? 'rgba(18,18,26,0.95)' : 'rgba(14,14,20,0.7)',
                border: hoveredCmd === i ? '1px solid rgba(124,58,237,0.25)' : '1px solid rgba(30,30,46,0.4)',
                borderRadius: 12, padding: '20px 18px',
                transition: 'all 0.3s cubic-bezier(0.23,1,0.32,1)',
                transform: hoveredCmd === i ? 'translateY(-4px)' : 'none',
                boxShadow: hoveredCmd === i ? '0 12px 40px rgba(124,58,237,0.1)' : 'none',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                {c.icon}
                <code style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: 13, color: '#e8e8f0', fontWeight: 600,
                }}>{c.cmd}</code>
              </div>
              <p style={{ fontSize: 13, color: '#6b6b80', lineHeight: 1.5, margin: 0 }}>{c.desc}</p>
            </div>
          </ScrollReveal>
        ))}
      </div>

      {/* CTA */}
      <ScrollReveal delay={0.3}>
        <div style={{ textAlign: 'center' }}>
          <Link to="/docs" style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            padding: '13px 30px', border: 'none', borderRadius: 12,
            background: 'linear-gradient(135deg, #7c3aed, #2563eb)',
            color: 'white', fontSize: 14, fontWeight: 600, cursor: 'pointer',
            textDecoration: 'none',
            boxShadow: '0 4px 24px rgba(124,58,237,0.3)', transition: 'all 0.3s',
          }}>
            Get Started
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
              <path d="M5 12h14M12 5l7 7-7 7"/>
            </svg>
          </Link>
        </div>
      </ScrollReveal>
    </section>
  );
}

/* ═══════════════════════════════════════════════════════════════
   MAIN LANDING PAGE
   ═══════════════════════════════════════════════════════════════ */
export default function LandingPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const [lang, setLangState] = useState(() => localStorage.getItem('da_lang') || 'en');
  const [theme, setTheme] = useState(() => localStorage.getItem('da_landing_theme') || 'dark');

  const page = (() => {
    if (location.pathname === '/features') return 'features';
    if (location.pathname === '/pricing') return 'pricing';
    return 'home';
  })();

  const handleLang = (l) => { setLanguage(l); setLangState(l); window.location.reload(); };
  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    localStorage.setItem('da_landing_theme', newTheme);
  };
  const LANGS = [{ code: 'en', label: 'EN' }, { code: 'ru', label: 'RU' }, { code: 'uz', label: 'UZ' }];

  const isLight = theme === 'light';
  const bgColor = isLight ? '#f5f5f7' : '#08080d';
  const textColor = isLight ? '#1a1a26' : '#e8e8f0';
  const textSecondary = isLight ? '#6e6e82' : '#6b6b80';
  const cardBorder = isLight ? 'rgba(0,0,0,0.08)' : 'rgba(30,30,46,0.5)';
  const navBg = isLight ? 'rgba(245,245,247,0.8)' : 'rgba(8,8,13,0.85)';

  const FAQ_ITEMS = [
    { q: 'Is my data really private?', a: 'Yes. Everything runs on your own hardware. No data ever leaves your server. The AI runs entirely on your infrastructure — no external API calls are made.' },
    { q: 'What are the system requirements?', a: 'Python 3.8+, 4GB+ RAM, and a modern multi-core CPU. A GPU with CUDA support is recommended for faster inference but not required. The system works on CPU-only setups.' },
    { q: 'How does image generation work?', a: 'We use Pollinations.ai for image generation, which provides access to multiple AI models including Flux. Images are generated from text prompts and can be downloaded directly. No API key required.' },
    { q: 'What is Determine-Coder?', a: 'Determine-Coder is our CLI coding assistant. It helps you write, debug, refactor, and review code directly from your terminal. Install it with: npm install -g determine-coder' },
    { q: 'Can I customize the AI behavior?', a: 'Yes. Through the admin panel you can modify the system prompt, AI version labels, response parameters, and more. Each subscription tier has different capabilities.' },
    { q: 'What payment methods do you accept?', a: 'We support Stripe for credit/debit cards, and can arrange direct invoicing for Enterprise plans. All payments are processed securely through our payment providers.' },
    { q: 'How do I deploy this in production?', a: 'Use a reverse proxy like Nginx or Caddy. Configure CORS origins in your .env file. Use systemd or Docker for process management. The app runs on port 8000 by default.' },
    { q: 'Is there an API?', a: 'Yes. Determine-AI exposes a REST API for authentication, chat, image generation, and session management. See the documentation section above for endpoint details.' },
  ];

  const INTEGRATIONS = [
    { icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" strokeWidth="1.5"><polyline points="4 17 10 11 4 5"/><line x1="12" y1="19" x2="20" y2="19"/></svg>, name: 'Determine-Coder CLI', desc: 'AI coding assistant for your terminal. Write, debug, refactor, and review code with natural language commands.', tag: 'dc' },
    { icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" strokeWidth="1.5"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z"/></svg>, name: 'Web Dashboard', desc: 'Full web interface with real-time chat, image generation, session history, and admin controls.', tag: 'Browser' },
    { icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" strokeWidth="1.5"><path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>, name: 'REST API', desc: 'Full REST API for authentication, chat, image generation, and session management. Build anything.', tag: 'API' },
    { icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" strokeWidth="1.5"><rect x="5" y="2" width="14" height="20" rx="2" ry="2"/><line x1="12" y1="18" x2="12.01" y2="18"/></svg>, name: 'Mobile', desc: 'Responsive web app that works perfectly on phones and tablets. Chat and generate images on the go.', tag: 'PWA' },
  ];

  const FEATURES = [
    { icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" strokeWidth="1.5"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>, title: 'AI Chat', desc: 'Have natural conversations with an AI that understands context, answers questions, and helps with any task.', detail: 'Streaming responses, conversation history, multi-language support.' },
    { icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" strokeWidth="1.5"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>, title: 'Image Generation', desc: 'Generate images from text descriptions using AI. Create art, illustrations, and visual content from prompts.', detail: 'Powered by Pollinations.ai. Multiple models: Flux, Realism, Anime, 3D.' },
    { icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" strokeWidth="1.5"><polyline points="4 17 10 11 4 5"/><line x1="12" y1="19" x2="20" y2="19"/></svg>, title: 'Coding Assistant', desc: 'Write, debug, refactor, and review code with Determine-Coder CLI. Supports all major programming languages.', detail: 'dc explain, dc fix, dc refactor, dc review, dc generate' },
    { icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" strokeWidth="1.5"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z"/></svg>, title: 'Web Search', desc: 'Enhanced responses with web context integration. Get up-to-date information alongside AI reasoning.', detail: 'Optional feature. Configure search providers in admin panel.' },
    { icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" strokeWidth="1.5"><circle cx="12" cy="12" r="10"/><path d="M14.31 8l5.74 9.94M9.69 8h11.48M7.38 12l5.74-9.94M9.69 16l-5.74-9.94M14.31 16H2.83M16.62 12l-5.74 9.94"/></svg>, title: 'Multi-Language', desc: 'Interface available in English, Russian, and Uzbek. The AI understands and responds in multiple languages.', detail: 'i18n-ready architecture. Easy to add new languages.' },
    { icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" strokeWidth="1.5"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>, title: 'Privacy-First', desc: 'Every byte of data stays on your server. No external API calls, no telemetry, no tracking. Zero compromise.', detail: 'Self-hosted architecture. Your data never leaves your machine.' },
    { icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" strokeWidth="1.5"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>, title: 'Streaming Responses', desc: 'Watch responses appear in real-time with smooth token-by-token streaming. No waiting for full generation.', detail: 'SSE-based streaming. Works across all interfaces.' },
    { icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" strokeWidth="1.5"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>, title: 'Admin Dashboard', desc: 'Complete admin panel for user management, AI configuration, subscription control, and system monitoring.', detail: '/admin — Owner, Admin, Moderator, User roles' },
    { icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" strokeWidth="1.5"><path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>, title: 'REST API', desc: 'Full REST API for authentication, chat, image generation, and session management. Build custom integrations effortlessly.', detail: 'JWT auth · JSON responses · CORS configurable' },
  ];

  const TIERS = [
    { id: 'free', name: t('pricing.starter'), price: 0, period: t('pricing.forever'), features: [t('pricing.features.basicChat'), t('pricing.features.msg50'), t('pricing.features.chatHistory'), t('pricing.features.community')] },
    { id: 'basic', name: t('pricing.basic'), price: 9.99, period: '/mo', features: [t('pricing.features.msg500'), t('pricing.features.longer'), t('pricing.features.imageAnalysis'), t('pricing.features.priority')] },
    { id: 'pro', name: t('pricing.pro'), price: 29.99, period: '/mo', featured: true, features: [t('pricing.features.unlimited'), t('pricing.features.fullLength'), t('pricing.features.imageAnalysis'), t('pricing.features.finetuned'), t('pricing.features.priority'), t('pricing.features.api')] },
    { id: 'enterprise', name: t('pricing.enterprise'), price: 99.99, period: '/mo', features: [t('pricing.features.unlimited'), t('pricing.features.customModel'), t('pricing.features.team'), t('pricing.features.analytics'), t('pricing.features.branding'), t('pricing.features.dedicated'), t('pricing.features.sla')] },
  ];

  const HOME_STATS = [
    { value: '100%', label: 'Private' },
    { value: '0', label: 'External Calls' },
    { value: '50', label: 'Languages' },
    { value: '24/7', label: 'Available' },
  ];

  const TESTIMONIALS = [
    { name: 'Alex K.', role: 'Senior Engineer', text: 'Determine-Coder replaced my paid AI coding subscription. Self-hosted, unlimited usage, and it actually understands my codebase. The /explain and /review commands are incredible.', avatar: 'A' },
    { name: 'Maria S.', role: 'DevOps Lead', text: 'We deployed Determine-AI for our team of 15. The admin dashboard makes user management trivial. The image generation feature is a surprisingly useful bonus.', avatar: 'M' },
    { name: 'James L.', role: 'Full-Stack Developer', text: 'I use dc generate to scaffold new projects and dc refactor to clean up legacy code. It saves me hours every week. The streaming responses feel instant.', avatar: 'J' },
    { name: 'Olga P.', role: 'CTO', text: 'We needed an AI solution that complies with GDPR. Determine-AI runs entirely on-premises. No data leaves our servers. Exactly what we needed.', avatar: 'O' },
    { name: 'David R.', role: 'Indie Hacker', text: 'I replaced three SaaS AI subscriptions with this. One self-hosted instance, unlimited usage, zero monthly fees. The image generation with Pollinations is a game changer.', avatar: 'D' },
    { name: 'Suki T.', role: 'Security Researcher', text: 'I audited the codebase — zero telemetry, zero external calls (except optional image gen). This is the real deal for privacy-conscious teams. The API is clean and well-documented.', avatar: 'S' },
  ];

  return (
    <div style={{
      minHeight: '100vh', background: bgColor, color: textColor,
      overflowX: 'hidden', position: 'relative', transition: 'background 0.4s, color 0.4s',
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
    }}>
      <CursorGlow />

      {/* NAV */}
      <nav style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '14px 40px', background: navBg, backdropFilter: 'blur(20px) saturate(1.5)',
        borderBottom: `1px solid ${cardBorder}`, transition: 'background 0.4s, border-color 0.4s',
      }}>
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 10, zIndex: 10, textDecoration: 'none', color: 'inherit' }}>
          <Logo size={30} />
          <span style={{ fontWeight: 700, fontSize: 15, letterSpacing: '-0.01em' }}>Determine-AI</span>
        </Link>
        <div style={{ display: 'flex', alignItems: 'center', gap: 24, zIndex: 10 }}>
          {[
            { to: '/', label: 'Home', active: page === 'home' },
            { to: '/features', label: t('nav.features'), active: page === 'features' },
            { to: '/pricing', label: t('nav.pricing'), active: page === 'pricing' },
            { to: '/docs', label: 'Docs', active: false },
          ].map(link => (
            <Link key={link.label} to={link.to} style={{
              background: 'none', border: 'none',
              color: link.active ? '#a78bfa' : textSecondary,
              textDecoration: 'none', fontSize: 13, fontWeight: 500,
              cursor: 'pointer', transition: 'color 0.2s', padding: 0,
              letterSpacing: '0.01em',
            }}>{link.label}</Link>
          ))}
          <div style={{
            display: 'flex', gap: 2, padding: 2, borderRadius: 8,
            background: isLight ? 'rgba(0,0,0,0.04)' : 'rgba(30,30,46,0.5)',
          }}>
            {LANGS.map(l => (
              <button key={l.code} onClick={() => handleLang(l.code)} style={{
                padding: '4px 8px', border: 'none', borderRadius: 6,
                background: lang === l.code ? 'rgba(124,58,237,0.15)' : 'transparent',
                color: lang === l.code ? '#a78bfa' : textSecondary,
                fontSize: 11, fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s',
              }}>{l.label}</button>
            ))}
          </div>
          <button onClick={toggleTheme} style={{
            background: 'none', border: `1px solid ${cardBorder}`, borderRadius: 8,
            padding: '5px 8px', cursor: 'pointer', display: 'flex', alignItems: 'center',
            color: textSecondary, transition: 'all 0.2s',
          }}>
            {isLight ? (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/></svg>
            ) : (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>
            )}
          </button>
          <button onClick={() => navigate('/login')} style={{
            padding: '9px 22px', border: 'none', borderRadius: 10,
            background: 'linear-gradient(135deg, #7c3aed, #2563eb)',
            color: 'white', fontSize: 13, fontWeight: 600, cursor: 'pointer',
            boxShadow: '0 2px 12px rgba(124,58,237,0.25)', transition: 'all 0.2s',
            letterSpacing: '0.01em',
          }}>{t('nav.getStarted')}</button>
        </div>
      </nav>

      {/* ============ HOME ============ */}
      {page === 'home' && (
        <>
          {/* ─── HERO ────────────────────────────────────── */}
          <section style={{
            position: 'relative', zIndex: 5, minHeight: '100vh',
            display: 'flex', flexDirection: 'column', alignItems: 'center',
            justifyContent: 'center', textAlign: 'center', padding: '120px 24px 60px',
            overflow: 'hidden',
          }}>
            <GridBackground />
            <AnimatedParticles />
            <FloatingOrb size={400} color="rgba(124,58,237,0.15)" top="10%" left="15%" delay={0} />
            <FloatingOrb size={300} color="rgba(59,130,246,0.12)" top="30%" left="75%" delay={2} />
            <FloatingOrb size={250} color="rgba(124,58,237,0.08)" top="60%" left="10%" delay={4} />

            <ScrollReveal>
              <div style={{ marginBottom: 36, display: 'flex', justifyContent: 'center' }}>
                <RotatingLogo size={100} />
              </div>
            </ScrollReveal>

            <ScrollReveal delay={0.1}>
              <div style={{
                padding: '5px 14px', borderRadius: 20, border: '1px solid rgba(124,58,237,0.2)',
                background: 'rgba(124,58,237,0.05)', color: '#a78bfa',
                fontSize: 12, fontWeight: 500, marginBottom: 32,
                display: 'inline-flex', alignItems: 'center', gap: 8,
                fontFamily: "'JetBrains Mono', monospace",
              }}>
                <span style={{
                  width: 7, height: 7, borderRadius: '50%', background: '#22c55e',
                  display: 'inline-block', animation: 'pulse 2s infinite',
                }} />
                Determine-AI &middot; Self-hosted &middot; Open-source
              </div>
            </ScrollReveal>

            <ScrollReveal delay={0.2}>
              <h1 style={{
                fontSize: 'clamp(40px, 6vw, 72px)', fontWeight: 700, lineHeight: 1.05,
                letterSpacing: '-0.04em', marginBottom: 20, maxWidth: 780,
              }}>
                <span style={{
                  background: isLight
                    ? 'linear-gradient(135deg, #1a1a26 0%, #7c3aed 50%, #2563eb 100%)'
                    : 'linear-gradient(135deg, #e8e8f0 0%, #a78bfa 50%, #3b82f6 100%)',
                  WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
                }}>{t('hero.title')}</span>
              </h1>
            </ScrollReveal>

            <ScrollReveal delay={0.3}>
              <p style={{
                fontSize: 17, color: textSecondary, maxWidth: 580, lineHeight: 1.7,
                marginBottom: 44,
              }}>{t('hero.subtitle')}</p>
            </ScrollReveal>

            <ScrollReveal delay={0.4}>
              <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', justifyContent: 'center' }}>
                <button onClick={() => navigate('/login')} style={{
                  padding: '14px 32px', border: 'none', borderRadius: 12,
                  background: 'linear-gradient(135deg, #7c3aed, #2563eb)',
                  color: 'white', fontSize: 15, fontWeight: 600, cursor: 'pointer',
                  boxShadow: '0 4px 30px rgba(124,58,237,0.35)', transition: 'all 0.3s',
                }}>{t('hero.cta')}</button>
                <button onClick={() => {
                  document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' });
                }} style={{
                  padding: '14px 32px', borderRadius: 12,
                  border: `1px solid ${cardBorder}`, background: 'transparent',
                  color: textSecondary, fontSize: 15, fontWeight: 500, cursor: 'pointer',
                  transition: 'all 0.2s',
                }}>{t('hero.ctaSecondary')}</button>
              </div>
            </ScrollReveal>

            {/* Stats */}
            <ScrollReveal delay={0.5}>
              <div style={{
                display: 'flex', gap: 48, marginTop: 64, flexWrap: 'wrap', justifyContent: 'center',
              }}>
                {HOME_STATS.map((s, i) => (
                  <CounterStat key={i} value={s.value} label={s.label} delay={0.6 + i * 0.15} />
                ))}
              </div>
            </ScrollReveal>
          </section>

          {/* ─── INTEGRATION SECTION ──────────────────────── */}
          <section style={{ position: 'relative', zIndex: 5, padding: '60px 40px 80px', maxWidth: 1100, margin: '0 auto' }}>
            <ScrollReveal>
              <div style={{ textAlign: 'center', marginBottom: 52 }}>
                <div style={{
                  padding: '4px 12px', borderRadius: 16, border: '1px solid rgba(59,130,246,0.2)',
                  background: 'rgba(59,130,246,0.05)', color: '#60a5fa',
                  fontSize: 11, fontWeight: 600, marginBottom: 16,
                  display: 'inline-block', textTransform: 'uppercase', letterSpacing: '0.08em',
                }}>Integrations</div>
                <h2 style={{ fontSize: 'clamp(26px, 3.5vw, 36px)', fontWeight: 700, marginBottom: 12, letterSpacing: '-0.03em' }}>
                  Integrates with your workflow
                </h2>
                <p style={{ fontSize: 16, color: textSecondary, maxWidth: 560, margin: '0 auto', lineHeight: 1.7 }}>
                  Use Determine-AI wherever you work. From the terminal to your browser, from VS Code to your phone — your AI assistant is always one command away.
                </p>
              </div>
            </ScrollReveal>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
              {INTEGRATIONS.map((intg, i) => (
                <ScrollReveal key={i} delay={i * 0.08}>
                  <div style={{
                    background: 'rgba(14,14,20,0.7)', border: '1px solid rgba(30,30,46,0.5)',
                    borderRadius: 14, padding: '28px 24px', transition: 'all 0.4s cubic-bezier(0.23,1,0.32,1)',
                    backdropFilter: 'blur(12px)', transformStyle: 'preserve-3d',
                  }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = 'rgba(124,58,237,0.3)';
                      e.currentTarget.style.transform = 'translateY(-6px) perspective(800px) rotateX(2deg)';
                      e.currentTarget.style.boxShadow = '0 16px 50px rgba(124,58,237,0.12)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = 'rgba(30,30,46,0.5)';
                      e.currentTarget.style.transform = 'translateY(0) perspective(800px) rotateX(0deg)';
                      e.currentTarget.style.boxShadow = 'none';
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                      <div style={{
                        width: 40, height: 40, borderRadius: 10,
                        background: 'linear-gradient(135deg, rgba(124,58,237,0.1), rgba(59,130,246,0.06))',
                        border: '1px solid rgba(124,58,237,0.12)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>{intg.icon}</div>
                      <span style={{
                        padding: '3px 8px', borderRadius: 6, fontSize: 10, fontWeight: 600,
                        background: 'rgba(124,58,237,0.08)', color: '#a78bfa',
                        textTransform: 'uppercase', letterSpacing: '0.05em',
                      }}>{intg.tag}</span>
                    </div>
                    <h4 style={{ fontSize: 15, fontWeight: 600, marginBottom: 8, color: '#e8e8f0', margin: '0 0 8px' }}>{intg.name}</h4>
                    <p style={{ fontSize: 13, lineHeight: 1.6, color: '#6b6b80', margin: 0 }}>{intg.desc}</p>
                  </div>
                </ScrollReveal>
              ))}
            </div>
          </section>

          {/* ─── TERMINAL DEMO ────────────────────────────── */}
          <section style={{ position: 'relative', zIndex: 5, padding: '20px 40px 80px', maxWidth: 900, margin: '0 auto' }}>
            <ScrollReveal>
              <div style={{ textAlign: 'center', marginBottom: 36 }}>
                <h2 style={{ fontSize: 'clamp(26px, 3.5vw, 36px)', fontWeight: 700, marginBottom: 10, letterSpacing: '-0.03em' }}>See It In Action</h2>
                <p style={{ fontSize: 15, color: textSecondary }}>CLI-powered AI that understands your entire codebase</p>
              </div>
              <TerminalDemo />
            </ScrollReveal>
          </section>

          {/* ─── INTERACTIVE 3D EXAMPLES ─────────────────── */}
          <InteractiveExamplesSection />

          {/* ─── CLI SHOWCASE ─────────────────────────────── */}
          <CLIShowcaseSection />

          {/* ─── FEATURES GRID ─────────────────────────────── */}
          <section style={{ position: 'relative', zIndex: 5, padding: '40px 40px 80px', maxWidth: 1100, margin: '0 auto' }}>
            <ScrollReveal>
              <div style={{ textAlign: 'center', marginBottom: 48 }}>
                <div style={{
                  padding: '4px 12px', borderRadius: 16, border: '1px solid rgba(124,58,237,0.2)',
                  background: 'rgba(124,58,237,0.05)', color: '#a78bfa',
                  fontSize: 11, fontWeight: 600, marginBottom: 16,
                  display: 'inline-block', textTransform: 'uppercase', letterSpacing: '0.08em',
                }}>Features</div>
                <h2 style={{ fontSize: 'clamp(26px, 3.5vw, 36px)', fontWeight: 700, marginBottom: 10, letterSpacing: '-0.03em' }}>
                  Everything you need, nothing you don't
                </h2>
                <p style={{ fontSize: 16, color: textSecondary, maxWidth: 520, margin: '0 auto', lineHeight: 1.7 }}>
                  Built for developers who care about privacy, performance, and having full control over their AI stack.
                </p>
              </div>
            </ScrollReveal>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 16 }}>
              {FEATURES.map((f, i) => (
                <ScrollReveal key={i} delay={i * 0.06}>
                  <FeatureCard3D icon={f.icon} title={f.title} desc={f.desc} detail={f.detail} />
                </ScrollReveal>
              ))}
            </div>
          </section>

          {/* ─── ARCHITECTURE / HOW IT WORKS ───────────────── */}
          <section id="how-it-works" style={{ position: 'relative', zIndex: 5, padding: '60px 40px 80px', maxWidth: 1000, margin: '0 auto' }}>
            <ScrollReveal>
              <div style={{ textAlign: 'center', marginBottom: 52 }}>
                <div style={{
                  padding: '4px 12px', borderRadius: 16, border: '1px solid rgba(34,197,94,0.2)',
                  background: 'rgba(34,197,94,0.05)', color: '#22c55e',
                  fontSize: 11, fontWeight: 600, marginBottom: 16,
                  display: 'inline-block', textTransform: 'uppercase', letterSpacing: '0.08em',
                }}>Architecture</div>
                <h2 style={{ fontSize: 'clamp(26px, 3.5vw, 36px)', fontWeight: 700, marginBottom: 10, letterSpacing: '-0.03em' }}>
                  How it works
                </h2>
                <p style={{ fontSize: 16, color: textSecondary, maxWidth: 520, margin: '0 auto', lineHeight: 1.7 }}>
                  A transparent, fully self-contained architecture. Every component runs on your infrastructure.
                </p>
              </div>
            </ScrollReveal>

            {/* Architecture Diagram */}
            <ScrollReveal delay={0.1}>
              <div style={{
                background: 'rgba(14,14,20,0.7)', border: '1px solid rgba(30,30,46,0.5)',
                borderRadius: 16, padding: '40px 32px', backdropFilter: 'blur(12px)',
              }}>
                {/* Flow diagram */}
                <div style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  gap: 0, flexWrap: 'wrap', marginBottom: 40,
                }}>
                  {[
                    { label: 'User', sub: 'Browser / CLI / API', icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" strokeWidth="1.5"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg> },
                    { label: 'Frontend', sub: 'React + Vite', icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="1.5"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg> },
                    { label: 'Backend', sub: 'FastAPI + MongoDB', icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="1.5"><rect x="2" y="2" width="20" height="8" rx="2" ry="2"/><rect x="2" y="14" width="20" height="8" rx="2" ry="2"/><line x1="6" y1="6" x2="6.01" y2="6"/><line x1="6" y1="18" x2="6.01" y2="18"/></svg> },
                    { label: 'AI Engine', sub: 'Custom Transformer', icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="1.5"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg> },
                  ].map((node, i) => (
                    <React.Fragment key={i}>
                      <div style={{ textAlign: 'center', padding: '0 16px' }}>
                        <div style={{
                          width: 64, height: 64, borderRadius: 16,
                          background: 'rgba(124,58,237,0.06)', border: '1px solid rgba(124,58,237,0.12)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          margin: '0 auto 12px',
                        }}>{node.icon}</div>
                        <div style={{ fontSize: 14, fontWeight: 600, color: '#e8e8f0', marginBottom: 4 }}>{node.label}</div>
                        <div style={{ fontSize: 11, color: '#6b6b80', fontFamily: "'JetBrains Mono', monospace" }}>{node.sub}</div>
                      </div>
                      {i < 3 && (
                        <svg width="40" height="16" viewBox="0 0 40 16" fill="none" style={{ flexShrink: 0, margin: '0 4px', marginBottom: 30 }}>
                          <line x1="0" y1="8" x2="32" y2="8" stroke="rgba(124,58,237,0.3)" strokeWidth="1.5" strokeDasharray="4 3" />
                          <path d="M30 4L36 8L30 12" fill="none" stroke="rgba(124,58,237,0.4)" strokeWidth="1.5" />
                        </svg>
                      )}
                    </React.Fragment>
                  ))}
                </div>

                {/* Tech stack pills */}
                <div style={{
                  borderTop: '1px solid rgba(30,30,46,0.4)', paddingTop: 24,
                  textAlign: 'center',
                }}>
                  <div style={{ fontSize: 12, color: '#6b6b80', marginBottom: 14, textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600 }}>Tech Stack</div>
                  <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'center' }}>
                    {['Python', 'FastAPI', 'React', 'Vite', 'MongoDB', 'LoRA/QLoRA', 'JWT', 'Pollinations', 'Stripe'].map(tech => (
                      <span key={tech} style={{
                        padding: '6px 14px', borderRadius: 8, fontSize: 12, fontWeight: 500,
                        background: 'rgba(124,58,237,0.06)', border: '1px solid rgba(124,58,237,0.1)',
                        color: '#a78bfa', fontFamily: "'JetBrains Mono', monospace",
                      }}>{tech}</span>
                    ))}
                  </div>
                </div>
              </div>
            </ScrollReveal>
          </section>

          {/* ─── TESTIMONIALS ──────────────────────────────── */}
          <section style={{ position: 'relative', zIndex: 5, padding: '60px 40px 80px', maxWidth: 1100, margin: '0 auto' }}>
            <ScrollReveal>
              <div style={{ textAlign: 'center', marginBottom: 52 }}>
                <div style={{
                  padding: '4px 12px', borderRadius: 16, border: '1px solid rgba(251,191,36,0.2)',
                  background: 'rgba(251,191,36,0.05)', color: '#fbbf24',
                  fontSize: 11, fontWeight: 600, marginBottom: 16,
                  display: 'inline-block', textTransform: 'uppercase', letterSpacing: '0.08em',
                }}>Testimonials</div>
                <h2 style={{ fontSize: 'clamp(26px, 3.5vw, 36px)', fontWeight: 700, marginBottom: 10, letterSpacing: '-0.03em' }}>
                  Loved by developers
                </h2>
                <p style={{ fontSize: 16, color: textSecondary, maxWidth: 480, margin: '0 auto', lineHeight: 1.7 }}>
                  Teams and individuals trust Determine-AI for their private AI needs.
                </p>
              </div>
            </ScrollReveal>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 16 }}>
              {TESTIMONIALS.map((test, i) => (
                <ScrollReveal key={i} delay={i * 0.08}>
                  <div style={{
                    background: 'rgba(14,14,20,0.7)', border: '1px solid rgba(30,30,46,0.5)',
                    borderRadius: 14, padding: '28px 24px',
                    backdropFilter: 'blur(12px)', transition: 'all 0.3s',
                  }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = 'rgba(124,58,237,0.2)';
                      e.currentTarget.style.transform = 'translateY(-3px)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = 'rgba(30,30,46,0.5)';
                      e.currentTarget.style.transform = 'translateY(0)';
                    }}
                  >
                    <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
                      {[...Array(5)].map((_, s) => (
                        <svg key={s} width="14" height="14" viewBox="0 0 24 24" fill="#fbbf24" stroke="none">
                          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                        </svg>
                      ))}
                    </div>
                    <p style={{ fontSize: 14, lineHeight: 1.7, color: '#8888a0', marginBottom: 20, margin: '0 0 20px' }}>
                      "{test.text}"
                    </p>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div style={{
                        width: 36, height: 36, borderRadius: '50%',
                        background: 'linear-gradient(135deg, #7c3aed, #3b82f6)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 14, fontWeight: 700, color: 'white',
                      }}>{test.avatar}</div>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 600, color: '#e8e8f0' }}>{test.name}</div>
                        <div style={{ fontSize: 12, color: '#6b6b80' }}>{test.role}</div>
                      </div>
                    </div>
                  </div>
                </ScrollReveal>
              ))}
            </div>
          </section>

          {/* ─── PRICING ───────────────────────────────────── */}
          <section style={{ position: 'relative', zIndex: 5, padding: '60px 40px 80px', maxWidth: 1100, margin: '0 auto' }}>
            <ScrollReveal>
              <div style={{ textAlign: 'center', marginBottom: 52 }}>
                <div style={{
                  padding: '4px 12px', borderRadius: 16, border: '1px solid rgba(124,58,237,0.2)',
                  background: 'rgba(124,58,237,0.05)', color: '#a78bfa',
                  fontSize: 11, fontWeight: 600, marginBottom: 16,
                  display: 'inline-block', textTransform: 'uppercase', letterSpacing: '0.08em',
                }}>Pricing</div>
                <h2 style={{ fontSize: 'clamp(26px, 3.5vw, 36px)', fontWeight: 700, marginBottom: 10, letterSpacing: '-0.03em' }}>
                  {t('pricing.title')}
                </h2>
                <p style={{ fontSize: 16, color: textSecondary, maxWidth: 480, margin: '0 auto', lineHeight: 1.7 }}>
                  {t('pricing.subtitle')}
                </p>
              </div>
            </ScrollReveal>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))', gap: 16 }}>
              {TIERS.map((tier, i) => (
                <ScrollReveal key={tier.id} delay={i * 0.1}>
                  <PricingCard tier={tier} featured={tier.featured} />
                </ScrollReveal>
              ))}
            </div>
          </section>

          {/* ─── DOCS PREVIEW ─────────────────────────────── */}
          <section id="docs" style={{ position: 'relative', zIndex: 5, padding: '40px 40px 80px', maxWidth: 900, margin: '0 auto' }}>
            <ScrollReveal>
              <div style={{ textAlign: 'center', marginBottom: 36 }}>
                <h2 style={{ fontSize: 'clamp(26px, 3.5vw, 36px)', fontWeight: 700, marginBottom: 10, letterSpacing: '-0.03em' }}>Documentation</h2>
                <p style={{ fontSize: 15, color: textSecondary }}>Everything you need to get started</p>
              </div>
              <DocSection />
            </ScrollReveal>
          </section>

          {/* ─── FAQ ───────────────────────────────────────── */}
          <section style={{ position: 'relative', zIndex: 5, padding: '40px 40px 100px', maxWidth: 720, margin: '0 auto' }}>
            <ScrollReveal>
              <div style={{ textAlign: 'center', marginBottom: 36 }}>
                <h2 style={{ fontSize: 'clamp(26px, 3.5vw, 36px)', fontWeight: 700, marginBottom: 10, letterSpacing: '-0.03em' }}>Frequently Asked Questions</h2>
                <p style={{ fontSize: 15, color: textSecondary }}>Got questions? We've got answers.</p>
              </div>
              <FAQAccordion items={FAQ_ITEMS} />
            </ScrollReveal>
          </section>

          {/* ─── FINAL CTA ─────────────────────────────────── */}
          <section style={{ position: 'relative', zIndex: 5, padding: '60px 40px 100px', maxWidth: 800, margin: '0 auto', textAlign: 'center' }}>
            <ScrollReveal>
              <div style={{
                background: 'linear-gradient(135deg, rgba(124,58,237,0.08), rgba(59,130,246,0.04))',
                border: '1px solid rgba(124,58,237,0.2)', borderRadius: 20,
                padding: '60px 40px',
              }}>
                <RotatingLogo size={60} />
                <h2 style={{ fontSize: 'clamp(26px, 3.5vw, 36px)', fontWeight: 700, marginTop: 24, marginBottom: 12, letterSpacing: '-0.03em' }}>
                  Ready to take control of your AI?
                </h2>
                <p style={{ fontSize: 16, color: textSecondary, maxWidth: 460, margin: '0 auto 32px', lineHeight: 1.7 }}>
                  Start for free. No credit card required. Deploy on your own infrastructure in minutes.
                </p>
                <div style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap' }}>
                  <button onClick={() => navigate('/login')} style={{
                    padding: '14px 36px', border: 'none', borderRadius: 12,
                    background: 'linear-gradient(135deg, #7c3aed, #2563eb)',
                    color: 'white', fontSize: 15, fontWeight: 600, cursor: 'pointer',
                    boxShadow: '0 4px 30px rgba(124,58,237,0.35)', transition: 'all 0.3s',
                  }}>Get Started Free</button>
                  <a href="#docs" style={{
                    padding: '14px 36px', borderRadius: 12,
                    border: '1px solid rgba(30,30,46,0.5)', background: 'transparent',
                    color: textSecondary, fontSize: 15, fontWeight: 500, cursor: 'pointer',
                    textDecoration: 'none', display: 'inline-flex', alignItems: 'center',
                    transition: 'all 0.2s',
                  }}>Read the Docs</a>
                </div>
              </div>
            </ScrollReveal>
          </section>
        </>
      )}

      {/* ============ FEATURES PAGE ============ */}
      {page === 'features' && (
        <section style={{ position: 'relative', zIndex: 5, padding: '120px 40px 80px', maxWidth: 1100, margin: '0 auto' }}>
          <ScrollReveal>
            <div style={{ textAlign: 'center', marginBottom: 52 }}>
              <h2 style={{ fontSize: 36, fontWeight: 700, letterSpacing: '-0.03em', marginBottom: 10 }}>{t('features.title')}</h2>
              <p style={{ fontSize: 16, color: textSecondary }}>{t('features.subtitle')}</p>
            </div>
          </ScrollReveal>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 16 }}>
            {FEATURES.map((f, i) => (
              <ScrollReveal key={i} delay={i * 0.07}>
                <FeatureCard3D icon={f.icon} title={f.title} desc={f.desc} detail={f.detail} />
              </ScrollReveal>
            ))}
          </div>
          <ScrollReveal delay={0.3}>
            <div style={{ textAlign: 'center', marginTop: 48 }}>
              <button onClick={() => navigate('/login')} style={{
                padding: '13px 30px', border: 'none', borderRadius: 12,
                background: 'linear-gradient(135deg, #7c3aed, #2563eb)',
                color: 'white', fontSize: 14, fontWeight: 600, cursor: 'pointer',
                boxShadow: '0 4px 24px rgba(124,58,237,0.3)',
              }}>Get Started Free</button>
            </div>
          </ScrollReveal>
        </section>
      )}

      {/* ============ PRICING PAGE ============ */}
      {page === 'pricing' && (
        <section style={{ position: 'relative', zIndex: 5, padding: '120px 40px 80px', maxWidth: 1100, margin: '0 auto' }}>
          <ScrollReveal>
            <div style={{ textAlign: 'center', marginBottom: 52 }}>
              <h2 style={{ fontSize: 36, fontWeight: 700, letterSpacing: '-0.03em', marginBottom: 10 }}>{t('pricing.title')}</h2>
              <p style={{ fontSize: 16, color: textSecondary }}>{t('pricing.subtitle')}</p>
            </div>
          </ScrollReveal>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))', gap: 16 }}>
            {TIERS.map((tier, i) => (
              <ScrollReveal key={tier.id} delay={i * 0.1}>
                <PricingCard tier={tier} featured={tier.featured} />
              </ScrollReveal>
            ))}
          </div>
        </section>
      )}

      {/* ─── FOOTER ──────────────────────────────────────── */}
      <footer style={{
        position: 'relative', zIndex: 5, borderTop: `1px solid ${cardBorder}`,
        transition: 'border-color 0.4s',
      }}>
        <div style={{
          maxWidth: 1100, margin: '0 auto', padding: '60px 40px 40px',
        }}>
          {/* Top row */}
          <div style={{
            display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', gap: 40,
            marginBottom: 48,
          }}>
            {/* Brand column */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                <Logo size={28} />
                <span style={{ fontWeight: 700, fontSize: 16, letterSpacing: '-0.01em' }}>Determine-AI</span>
              </div>
              <p style={{ fontSize: 13, lineHeight: 1.7, color: textSecondary, maxWidth: 280, margin: 0 }}>
                {t('footer.desc')}
              </p>
              <div style={{ display: 'flex', gap: 10, marginTop: 18 }}>
                {/* GitHub */}
                <a href="#" style={{
                  width: 32, height: 32, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: isLight ? 'rgba(0,0,0,0.04)' : 'rgba(30,30,46,0.5)', color: textSecondary,
                  textDecoration: 'none', transition: 'all 0.2s',
                }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>
                </a>
                {/* Twitter / X */}
                <a href="#" style={{
                  width: 32, height: 32, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: isLight ? 'rgba(0,0,0,0.04)' : 'rgba(30,30,46,0.5)', color: textSecondary,
                  textDecoration: 'none', transition: 'all 0.2s',
                }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
                </a>
                {/* Discord */}
                <a href="#" style={{
                  width: 32, height: 32, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: isLight ? 'rgba(0,0,0,0.04)' : 'rgba(30,30,46,0.5)', color: textSecondary,
                  textDecoration: 'none', transition: 'all 0.2s',
                }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M20.317 4.37a19.791 19.791 0 00-4.885-1.515.074.074 0 00-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 00-5.487 0 12.64 12.64 0 00-.617-1.25.077.077 0 00-.079-.037A19.736 19.736 0 003.677 4.37a.07.07 0 00-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 00.031.057 19.9 19.9 0 005.993 3.03.078.078 0 00.084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 00-.041-.106 13.107 13.107 0 01-1.872-.892.077.077 0 01-.008-.128 10.2 10.2 0 00.372-.292.074.074 0 01.077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 01.078.01c.12.098.246.198.373.292a.077.077 0 01-.006.127 12.299 12.299 0 01-1.873.892.077.077 0 00-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 00.084.028 19.839 19.839 0 006.002-3.03.077.077 0 00.032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 00-.031-.03z"/></svg>
                </a>
              </div>
            </div>

            {/* Links columns */}
            <div>
              <h4 style={{ fontSize: 12, fontWeight: 600, color: textColor, marginBottom: 16, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Product</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <Link to="/features" style={{ color: textSecondary, fontSize: 13, textDecoration: 'none', transition: 'color 0.2s' }}>Features</Link>
                <Link to="/pricing" style={{ color: textSecondary, fontSize: 13, textDecoration: 'none', transition: 'color 0.2s' }}>Pricing</Link>
                <a href="#docs" style={{ color: textSecondary, fontSize: 13, textDecoration: 'none', transition: 'color 0.2s' }}>Documentation</a>
                <Link to="/changelog" style={{ color: textSecondary, fontSize: 13, textDecoration: 'none', transition: 'color 0.2s' }}>Changelog</Link>
              </div>
            </div>
            <div>
              <h4 style={{ fontSize: 12, fontWeight: 600, color: textColor, marginBottom: 16, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Developers</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <a href="#docs" style={{ color: textSecondary, fontSize: 13, textDecoration: 'none', transition: 'color 0.2s' }}>API Reference</a>
                <a href="#docs" style={{ color: textSecondary, fontSize: 13, textDecoration: 'none', transition: 'color 0.2s' }}>CLI Guide</a>
                <a href="#docs" style={{ color: textSecondary, fontSize: 13, textDecoration: 'none', transition: 'color 0.2s' }}>Self-Hosting</a>
                <Link to="/status" style={{ color: textSecondary, fontSize: 13, textDecoration: 'none', transition: 'color 0.2s' }}>Status</Link>
              </div>
            </div>
            <div>
              <h4 style={{ fontSize: 12, fontWeight: 600, color: textColor, marginBottom: 16, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Company</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <Link to="/about" style={{ color: textSecondary, fontSize: 13, textDecoration: 'none', transition: 'color 0.2s' }}>About</Link>
                <Link to="/blog" style={{ color: textSecondary, fontSize: 13, textDecoration: 'none', transition: 'color 0.2s' }}>Blog</Link>
                <Link to="/privacy" style={{ color: textSecondary, fontSize: 13, textDecoration: 'none', transition: 'color 0.2s' }}>Privacy Policy</Link>
                <Link to="/terms" style={{ color: textSecondary, fontSize: 13, textDecoration: 'none', transition: 'color 0.2s' }}>Terms of Service</Link>
              </div>
            </div>
          </div>

          {/* Bottom row */}
          <div style={{
            borderTop: `1px solid ${cardBorder}`, paddingTop: 24,
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            flexWrap: 'wrap', gap: 12,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 12, color: isLight ? '#aaa' : '#3a3a4a' }}>
                &copy; 2026 Determine-AI. {t('footer.rights')}
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <span style={{ fontSize: 12, color: textSecondary }}>
                {t('footer.builtWith')}
              </span>
              <span style={{ fontSize: 12, color: textSecondary }}>
                Open Source
              </span>
            </div>
          </div>
        </div>
      </footer>

      <style>{`
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
        @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0} }
        @keyframes gradientShift { 0%{background-position:0% 50%} 50%{background-position:100% 50%} 100%{background-position:0% 50%} }
        * { box-sizing: border-box; }
        html { scroll-behavior: smooth; }
        body { margin: 0; overflow-x: hidden; }

        /* Nav responsive */
        @media (max-width: 768px) {
          nav { padding: 12px 20px !important; }
          nav > div:nth-child(2) { gap: 12px !important; }
          footer > div > div:first-child { grid-template-columns: 1fr 1fr !important; }
        }
        @media (max-width: 480px) {
          nav > div:nth-child(2) > a:nth-child(-n+3) { display: none; }
          footer > div > div:first-child { grid-template-columns: 1fr !important; gap: 24px !important; }
        }

        /* Hero responsive */
        @media (max-width: 600px) {
          section:first-of-type { padding: 100px 16px 40px !important; }
          section:first-of-type h1 { font-size: 32px !important; }
          section:first-of-type p { font-size: 15px !important; }
        }

        /* Integration cards responsive */
        @media (max-width: 600px) {
          section:nth-of-type(2) > div:last-child { grid-template-columns: 1fr 1fr !important; gap: 10px !important; }
        }
        @media (max-width: 380px) {
          section:nth-of-type(2) > div:last-child { grid-template-columns: 1fr !important; }
        }

        /* Feature grid responsive */
        @media (max-width: 700px) {
          section:nth-of-type(4) > div:last-child { grid-template-columns: 1fr !important; }
        }

        /* Architecture diagram responsive */
        @media (max-width: 700px) {
          #how-it-works > div > div > div:first-child { flex-direction: column !important; gap: 16px !important; }
          #how-it-works svg[width="40"] { transform: rotate(90deg); margin: 4px 0 !important; }
        }

        /* Testimonials responsive */
        @media (max-width: 700px) {
          section:nth-of-type(6) > div:last-child { grid-template-columns: 1fr !important; }
        }

        /* Pricing responsive */
        @media (max-width: 700px) {
          section:nth-of-type(7) > div:last-child { grid-template-columns: 1fr 1fr !important; }
        }
        @media (max-width: 500px) {
          section:nth-of-type(7) > div:last-child { grid-template-columns: 1fr !important; max-width: 360px; margin: 0 auto; }
        }

        /* DocSection responsive */
        @media (max-width: 600px) {
          #docs > div > div > div { grid-template-columns: 1fr !important; }
          #docs > div > div > div:first-child { border-right: none !important; border-bottom: 1px solid rgba(30,30,46,0.4); }
        }

        /* FAQ responsive */
        @media (max-width: 500px) {
          section:nth-of-type(9) { padding-left: 16px !important; padding-right: 16px !important; }
        }

        /* Final CTA responsive */
        @media (max-width: 500px) {
          section:last-of-type > div > div { padding: 40px 20px !important; }
        }

        /* Footer responsive */
        @media (max-width: 360px) {
          footer > div { padding: 40px 16px 24px !important; }
        }
      `}</style>
    </div>
  );
}
