import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import Logo from '../Logo';

const API = window.location.origin;

const NAVBAR_STYLE = {
  position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
  padding: '14px 40px',
  background: 'rgba(8,8,13,0.85)', backdropFilter: 'blur(20px)',
  borderBottom: '1px solid rgba(30,30,46,0.5)',
};

const CARD_STYLE = {
  background: 'rgba(20,20,30,0.6)',
  border: '1px solid rgba(124,58,237,0.15)',
  borderRadius: 16,
  padding: '28px 24px',
  cursor: 'pointer',
  transition: 'all 0.2s ease',
};

const TAG_STYLE = {
  display: 'inline-block',
  padding: '3px 10px',
  borderRadius: 20,
  fontSize: 11,
  fontWeight: 600,
  background: 'rgba(124,58,237,0.15)',
  color: '#a78bfa',
  border: '1px solid rgba(124,58,237,0.2)',
};

export default function BlogPage() {
  const navigate = useNavigate();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSlug, setSelectedSlug] = useState(null);
  const [selectedPost, setSelectedPost] = useState(null);
  const [loadingPost, setLoadingPost] = useState(false);
  const [tagFilter, setTagFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    setLoading(true);
    fetch(`${API}/api/blog`)
      .then(r => r.ok ? r.json() : [])
      .then(data => { setPosts(data); setLoading(false); })
      .catch(() => { setPosts([]); setLoading(false); });
  }, []);

  const allTags = useMemo(() => {
    const tagSet = new Set();
    posts.forEach(p => (p.tags || []).forEach(t => tagSet.add(t)));
    return Array.from(tagSet).sort();
  }, [posts]);

  const filteredPosts = useMemo(() => {
    let result = posts;
    if (tagFilter) result = result.filter(p => (p.tags || []).includes(tagFilter));
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(p =>
        (p.title || '').toLowerCase().includes(q) ||
        (p.excerpt || '').toLowerCase().includes(q)
      );
    }
    return result;
  }, [posts, tagFilter, searchQuery]);

  useEffect(() => {
    if (!selectedSlug) { setSelectedPost(null); return; }
    setLoadingPost(true);
    fetch(`${API}/api/blog/${selectedSlug}`)
      .then(r => r.ok ? r.json() : null)
      .then(data => { setSelectedPost(data); setLoadingPost(false); })
      .catch(() => { setSelectedPost(null); setLoadingPost(false); });
  }, [selectedSlug]);

  const formatDate = (d) => {
    if (!d) return '';
    try { return new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }); }
    catch { return ''; }
  };

  const renderMarkdown = (md) => {
    if (!md) return '';
    return md
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/^### (.+)$/gm, '<h3 style="font-size:20px;font-weight:700;margin:24px 0 12px;color:#e8e8f0">$1</h3>')
      .replace(/^## (.+)$/gm, '<h2 style="font-size:24px;font-weight:700;margin:32px 0 16px;color:#e8e8f0">$1</h2>')
      .replace(/^# (.+)$/gm, '<h1 style="font-size:28px;font-weight:700;margin:40px 0 20px;color:#e8e8f0">$1</h1>')
      .replace(/\*\*(.+?)\*\*/g, '<strong style="color:#e8e8f0">$1</strong>')
      .replace(/\*(.+?)\*/g, '<em>$1</em>')
      .replace(/`([^`]+)`/g, '<code style="background:rgba(124,58,237,0.15);padding:2px 6px;border-radius:4px;font-size:13px;color:#a78bfa">$1</code>')
      .replace(/```(\w*)\n([\s\S]*?)```/g, '<pre style="background:rgba(0,0,0,0.3);border:1px solid rgba(30,30,46,0.5);border-radius:10px;padding:16px;overflow-x:auto;margin:16px 0"><code>$2</code></pre>')
      .replace(/^- (.+)$/gm, '<li style="margin:4px 0;color:#8888a0">$1</li>')
      .replace(/(<li.*<\/li>)/gs, '<ul style="padding-left:20px;margin:12px 0">$1</ul>')
      .replace(/\n{2,}/g, '<br/><br/>')
      .replace(/\n/g, '<br/>');
  };

  if (selectedSlug) {
    return (
      <div style={{ minHeight: '100vh', background: '#08080d', color: '#c8c8d8', fontFamily: "'Inter', sans-serif" }}>
        <nav style={NAVBAR_STYLE}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }} onClick={() => navigate('/')}>
            <Logo size={28} />
            <span style={{ fontWeight: 700, fontSize: 15 }}>Determine-AI</span>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={() => { setSelectedSlug(null); setSelectedPost(null); }}
              style={{ background: 'none', border: '1px solid rgba(30,30,46,0.5)', borderRadius: 8, padding: '6px 14px', color: '#a78bfa', fontSize: 13, cursor: 'pointer', fontWeight: 600 }}>
              Back to Blog
            </button>
            <button onClick={() => navigate('/')} style={{ background: 'none', border: '1px solid rgba(30,30,46,0.5)', borderRadius: 8, padding: '6px 14px', color: '#6b6b80', fontSize: 13, cursor: 'pointer' }}>Home</button>
          </div>
        </nav>
        <div style={{ maxWidth: 720, margin: '0 auto', padding: '120px 24px 80px' }}>
          {loadingPost ? (
            <div style={{ textAlign: 'center', padding: '60px 0', color: '#6b6b80' }}>Loading...</div>
          ) : selectedPost ? (
            <article>
              <button onClick={() => { setSelectedSlug(null); setSelectedPost(null); }}
                style={{ background: 'none', border: 'none', color: '#a78bfa', fontSize: 13, cursor: 'pointer', marginBottom: 24, padding: 0, fontWeight: 600 }}>
                ← Back to Blog
              </button>
              <h1 style={{ fontSize: 36, fontWeight: 700, marginBottom: 12, lineHeight: 1.2, letterSpacing: '-0.03em' }}>{selectedPost.title}</h1>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 32, color: '#6b6b80', fontSize: 13 }}>
                <span style={{ fontWeight: 600, color: '#a78bfa' }}>{selectedPost.author}</span>
                <span>·</span>
                <span>{formatDate(selectedPost.created_at)}</span>
                    {(selectedPost.tags || []).length > 0 && (
                  <>
                    <span>·</span>
                    <div style={{ display: 'flex', gap: 6 }}>
                      {selectedPost.tags.map(t => (
                        <span key={t} style={{ ...TAG_STYLE, cursor: 'pointer' }}
                          onClick={() => { setTagFilter(t); setSelectedSlug(null); setSelectedPost(null); }}
                          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(124,58,237,0.3)'; }}
                          onMouseLeave={e => { e.currentTarget.style.background = 'rgba(124,58,237,0.15)'; }}
                        >{t}</span>
                      ))}
                    </div>
                  </>
                )}
              </div>
              {selectedPost.excerpt && (
                <p style={{ fontSize: 17, color: '#8888a0', lineHeight: 1.7, marginBottom: 32, fontStyle: 'italic', borderLeft: '3px solid rgba(124,58,237,0.3)', paddingLeft: 16 }}>
                  {selectedPost.excerpt}
                </p>
              )}
              <div
                style={{ fontSize: 15, lineHeight: 1.8, color: '#b8b8d0' }}
                dangerouslySetInnerHTML={{ __html: renderMarkdown(selectedPost.content) }}
              />
            </article>
          ) : (
            <div style={{ textAlign: 'center', padding: '60px 0', color: '#6b6b80' }}>Post not found.</div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: '#08080d', color: '#e8e8f0', fontFamily: "'Inter', sans-serif" }}>
      <nav style={NAVBAR_STYLE}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }} onClick={() => navigate('/')}>
          <Logo size={28} />
          <span style={{ fontWeight: 700, fontSize: 15 }}>Determine-AI</span>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={() => navigate('/')} style={{ background: 'none', border: '1px solid rgba(30,30,46,0.5)', borderRadius: 8, padding: '6px 14px', color: '#6b6b80', fontSize: 13, cursor: 'pointer' }}>Home</button>
        </div>
      </nav>
      <div style={{ maxWidth: 900, margin: '0 auto', padding: '120px 24px 80px' }}>
        <h1 style={{ fontSize: 42, fontWeight: 700, marginBottom: 8, letterSpacing: '-0.03em' }}>Blog</h1>
        <p style={{ color: '#6b6b80', fontSize: 15, marginBottom: 36 }}>News, updates, and deep dives from the Determine-AI team.</p>

        <div style={{ display: 'flex', gap: 10, marginBottom: 36, flexWrap: 'wrap' }}>
          <input
            type="text"
            placeholder="Search posts..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            style={{
              flex: '1 1 240px', padding: '10px 16px', borderRadius: 10,
              border: '1px solid rgba(30,30,46,0.5)', background: 'rgba(20,20,30,0.6)',
              color: '#e8e8f0', fontSize: 14, outline: 'none',
            }}
          />
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
            <button
              onClick={() => setTagFilter('')}
              style={{
                padding: '6px 14px', borderRadius: 20, border: 'none',
                background: !tagFilter ? 'rgba(124,58,237,0.25)' : 'rgba(30,30,46,0.3)',
                color: !tagFilter ? '#a78bfa' : '#6b6b80',
                fontSize: 12, fontWeight: 600, cursor: 'pointer',
              }}
            >All</button>
            {allTags.map(t => (
              <button key={t} onClick={() => setTagFilter(t === tagFilter ? '' : t)}
                style={{
                  padding: '6px 14px', borderRadius: 20, border: 'none',
                  background: tagFilter === t ? 'rgba(124,58,237,0.25)' : 'rgba(30,30,46,0.3)',
                  color: tagFilter === t ? '#a78bfa' : '#6b6b80',
                  fontSize: 12, fontWeight: 600, cursor: 'pointer',
                }}
              >{t}</button>
            ))}
          </div>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px 0', color: '#6b6b80' }}>Loading posts...</div>
        ) : filteredPosts.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px 0' }}>
            <p style={{ color: '#6b6b80', fontSize: 16 }}>No posts yet.</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 20 }}>
            {filteredPosts.map(post => (
              <div key={post.id} style={CARD_STYLE}
                onClick={() => setSelectedSlug(post.slug)}
                onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(124,58,237,0.4)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(124,58,237,0.15)'; e.currentTarget.style.transform = 'translateY(0)'; }}
              >
                {(post.tags || []).length > 0 && (
                  <div style={{ display: 'flex', gap: 6, marginBottom: 12 }}>
                    {post.tags.slice(0, 3).map(t => <span key={t} style={TAG_STYLE}>{t}</span>)}
                  </div>
                )}
                <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8, lineHeight: 1.3 }}>{post.title}</h3>
                <p style={{ fontSize: 14, color: '#8888a0', lineHeight: 1.6, marginBottom: 16, display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                  {post.excerpt || post.content?.substring(0, 150) + '...'}
                </p>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 12, color: '#6b6b80' }}>
                  <span style={{ fontWeight: 600, color: '#a78bfa' }}>{post.author}</span>
                  <span>{formatDate(post.created_at)}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
