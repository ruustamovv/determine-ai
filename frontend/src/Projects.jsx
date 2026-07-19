import React, { useState, useEffect, useCallback } from 'react';

const API = window.location.origin;

const SAMPLE_PROJECTS = [
  {
    _id: 'demo-1',
    title: 'E-commerce Platform',
    description: 'Full-stack React + Node.js e-commerce with payment integration, user auth, and admin dashboard.',
    author: 'Determine-AI',
    tags: ['React', 'Node.js', 'MongoDB'],
    stars: 42,
    language: 'JavaScript',
  },
  {
    _id: 'demo-2',
    title: 'AI Chat Application',
    description: 'Real-time chat app with AI assistance, image analysis, and multi-language support.',
    author: 'Determine-AI',
    tags: ['Python', 'FastAPI', 'React'],
    stars: 38,
    language: 'Python',
  },
  {
    _id: 'demo-3',
    title: 'Task Management System',
    description: 'Kanban-style project management with drag-and-drop, team collaboration, and analytics.',
    author: 'Determine-AI',
    tags: ['TypeScript', 'React', 'PostgreSQL'],
    stars: 27,
    language: 'TypeScript',
  },
  {
    _id: 'demo-4',
    title: 'REST API Boilerplate',
    description: 'Production-ready API template with auth, rate limiting, caching, and auto-generated docs.',
    author: 'Determine-AI',
    tags: ['Python', 'FastAPI', 'Docker'],
    stars: 31,
    language: 'Python',
  },
];

const LANG_COLORS = {
  JavaScript: '#f1e05a',
  TypeScript: '#3178c6',
  Python: '#3572A5',
  Rust: '#dea584',
  Go: '#00ADD8',
  Java: '#b07219',
  HTML: '#e34c26',
  CSS: '#563d7c',
};

export default function Projects({ onClose }) {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [editProject, setEditProject] = useState(null);

  const loadProjects = useCallback(() => {
    const token = localStorage.getItem('token');
    fetch(`${API}/api/projects`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
      .then(r => r.ok ? r.json() : SAMPLE_PROJECTS)
      .then(data => { setProjects(data.length > 0 ? data : SAMPLE_PROJECTS); setLoading(false); })
      .catch(() => { setProjects(SAMPLE_PROJECTS); setLoading(false); });
  }, []);

  useEffect(() => { loadProjects(); }, [loadProjects]);

  const languages = [...new Set(projects.map(p => p.language).filter(Boolean))];
  const filtered = projects.filter(p => {
    const matchesFilter = filter === 'all' || p.language === filter;
    const matchesSearch = !searchQuery || p.title.toLowerCase().includes(searchQuery.toLowerCase()) || p.description.toLowerCase().includes(searchQuery.toLowerCase()) || (p.tags && p.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase())));
    return matchesFilter && matchesSearch;
  });

  const handleCreate = async (data) => {
    const token = localStorage.getItem('token');
    if (!token) return;
    try {
      const r = await fetch(`${API}/api/projects`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(data),
      });
      if (r.ok) {
        loadProjects();
        setShowCreate(false);
      }
    } catch {}
  };

  const handleUpdate = async (id, data) => {
    const token = localStorage.getItem('token');
    if (!token) return;
    try {
      const r = await fetch(`${API}/api/projects/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(data),
      });
      if (r.ok) {
        loadProjects();
        setEditProject(null);
      }
    } catch {}
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this project?')) return;
    const token = localStorage.getItem('token');
    if (!token) return;
    try {
      const r = await fetch(`${API}/api/projects/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (r.ok) loadProjects();
    } catch {}
  };

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={styles.modal}>
        <div style={styles.header}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" strokeWidth="2"><path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z"/></svg>
            <h2 style={styles.title}>Projects</h2>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={() => setShowCreate(true)} style={styles.createBtn}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 5v14M5 12h14"/></svg>
              New Project
            </button>
            <button onClick={onClose} style={styles.closeBtn}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
            </button>
          </div>
        </div>

        <div style={styles.searchBar}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#6b6b80" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
          <input
            type="text"
            placeholder="Search projects..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            style={styles.searchInput}
          />
        </div>

        <div style={styles.filterRow}>
          <button onClick={() => setFilter('all')} style={{ ...styles.filterBtn, ...(filter === 'all' ? styles.filterBtnActive : {}) }}>All</button>
          {languages.map(lang => (
            <button key={lang} onClick={() => setFilter(lang)} style={{ ...styles.filterBtn, ...(filter === lang ? styles.filterBtnActive : {}) }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: LANG_COLORS[lang] || '#666', display: 'inline-block' }} />
              {lang}
            </button>
          ))}
        </div>

        <div style={styles.projectList}>
          {loading ? (
            <div style={styles.loading}>Loading projects...</div>
          ) : filtered.length === 0 ? (
            <div style={styles.empty}>No projects found. Create one!</div>
          ) : (
            filtered.map(project => (
              <div key={project._id || project.id} style={styles.projectCard}
                onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(124,58,237,0.3)'; e.currentTarget.style.background = 'rgba(124,58,237,0.03)'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = '#1e1e2e'; e.currentTarget.style.background = 'transparent'; }}
              >
                <div style={styles.projectHeader}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" strokeWidth="2"><path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z"/></svg>
                  <span style={styles.projectTitle}>{project.title}</span>
                  {project.stars > 0 && (
                    <div style={styles.starBadge}>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="#fbbf24" stroke="#fbbf24" strokeWidth="1"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                      {project.stars}
                    </div>
                  )}
                  <div style={{ display: 'flex', gap: 4 }}>
                    {!project.id?.startsWith('demo') && (
                      <>
                        <button onClick={() => setEditProject(project)} style={styles.actionBtn} title="Edit">
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                        </button>
                        <button onClick={() => handleDelete(project._id)} style={{ ...styles.actionBtn, color: '#ef4444' }} title="Delete">
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
                        </button>
                      </>
                    )}
                  </div>
                </div>
                <p style={styles.projectDesc}>{project.description}</p>
                <div style={styles.projectTags}>
                  {(project.tags || []).map(tag => (
                    <span key={tag} style={styles.tag}>{tag}</span>
                  ))}
                  {project.language && (
                    <span style={styles.langBadge}>
                      <span style={{ width: 8, height: 8, borderRadius: '50%', background: LANG_COLORS[project.language] || '#666', display: 'inline-block' }} />
                      {project.language}
                    </span>
                  )}
                </div>
                <div style={styles.projectFooter}>
                  <span style={styles.author}>by {project.username || project.author || 'You'}</span>
                  {project.visibility && (
                    <span style={styles.visBadge}>{project.visibility}</span>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {(showCreate || editProject) && (
        <ProjectForm
          project={editProject}
          onSubmit={(data) => editProject ? handleUpdate(editProject._id, data) : handleCreate(data)}
          onClose={() => { setShowCreate(false); setEditProject(null); }}
        />
      )}

      <style>{`
        @keyframes projectsIn {
          from { opacity: 0; transform: scale(0.95) translateY(10px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
      `}</style>
    </div>
  );
}

function ProjectForm({ project, onSubmit, onClose }) {
  const [title, setTitle] = useState(project?.title || '');
  const [description, setDescription] = useState(project?.description || '');
  const [tags, setTags] = useState((project?.tags || []).join(', '));
  const [language, setLanguage] = useState(project?.language || 'Python');
  const [visibility, setVisibility] = useState(project?.visibility || 'public');
  const [loading, setLoading] = useState(false);

  const LANGS = ['Python', 'JavaScript', 'TypeScript', 'Rust', 'Go', 'Java', 'HTML', 'CSS', 'Other'];

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) return;
    setLoading(true);
    await onSubmit({
      title: title.trim(),
      description: description.trim(),
      tags: tags.split(',').map(t => t.trim()).filter(Boolean),
      language,
      visibility,
    });
    setLoading(false);
  };

  return (
    <div style={{ ...styles.overlay, zIndex: 1100 }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{ ...styles.modal, width: 480, animation: 'projectsIn 0.25s ease-out' }}>
        <div style={styles.header}>
          <h2 style={styles.title}>{project ? 'Edit Project' : 'New Project'}</h2>
          <button onClick={onClose} style={styles.closeBtn}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
          </button>
        </div>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label style={styles.label}>Title *</label>
            <input value={title} onChange={e => setTitle(e.target.value)} placeholder="My awesome project" style={styles.input} required autoFocus />
          </div>
          <div>
            <label style={styles.label}>Description</label>
            <textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="What does this project do?" rows={3} style={{ ...styles.input, resize: 'vertical' }} />
          </div>
          <div>
            <label style={styles.label}>Tags (comma separated)</label>
            <input value={tags} onChange={e => setTags(e.target.value)} placeholder="React, TypeScript, API" style={styles.input} />
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <div style={{ flex: 1 }}>
              <label style={styles.label}>Language</label>
              <select value={language} onChange={e => setLanguage(e.target.value)} style={{ ...styles.input, cursor: 'pointer' }}>
                {LANGS.map(l => <option key={l} value={l}>{l}</option>)}
              </select>
            </div>
            <div style={{ flex: 1 }}>
              <label style={styles.label}>Visibility</label>
              <select value={visibility} onChange={e => setVisibility(e.target.value)} style={{ ...styles.input, cursor: 'pointer' }}>
                <option value="public">Public</option>
                <option value="private">Private</option>
              </select>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 8 }}>
            <button type="button" onClick={onClose} style={{ ...styles.filterBtn, padding: '10px 20px' }}>Cancel</button>
            <button type="submit" disabled={loading || !title.trim()} style={styles.createBtn}>{loading ? '...' : project ? 'Save Changes' : 'Create Project'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

const styles = {
  overlay: {
    position: 'fixed', inset: 0, zIndex: 1000,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)',
  },
  modal: {
    background: '#12121a', border: '1px solid #1e1e2e', borderRadius: 24,
    padding: '28px 32px', width: 640, maxHeight: '85vh', overflowY: 'auto',
    boxShadow: '0 25px 80px rgba(0,0,0,0.5)',
    animation: 'projectsIn 0.3s ease-out',
  },
  header: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20,
  },
  title: { fontSize: 20, fontWeight: 700, color: '#f0f0f5', margin: 0 },
  closeBtn: {
    background: 'none', border: 'none', color: '#6e6e82', cursor: 'pointer',
    padding: 6, borderRadius: 8,
  },
  createBtn: {
    display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px',
    border: 'none', borderRadius: 10,
    background: 'linear-gradient(135deg, #7c3aed, #2563eb)',
    color: 'white', fontSize: 13, fontWeight: 600, cursor: 'pointer',
  },
  searchBar: {
    display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px',
    background: '#16161f', border: '1px solid #1e1e2e', borderRadius: 12,
    marginBottom: 14,
  },
  searchInput: {
    flex: 1, background: 'none', border: 'none', color: '#f0f0f5',
    fontSize: 14, outline: 'none',
  },
  filterRow: {
    display: 'flex', gap: 6, marginBottom: 18, flexWrap: 'wrap',
  },
  filterBtn: {
    display: 'flex', alignItems: 'center', gap: 5, padding: '6px 12px',
    border: '1px solid #1e1e2e', borderRadius: 8, background: 'transparent',
    color: '#6b6b80', fontSize: 12, fontWeight: 500, cursor: 'pointer',
    transition: 'all 0.2s',
  },
  filterBtnActive: {
    borderColor: 'rgba(124,58,237,0.3)', background: 'rgba(124,58,237,0.08)',
    color: '#a78bfa',
  },
  projectList: { display: 'flex', flexDirection: 'column', gap: 10 },
  projectCard: {
    padding: '16px 18px', border: '1px solid #1e1e2e', borderRadius: 14,
    transition: 'all 0.2s', cursor: 'pointer',
  },
  projectHeader: {
    display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8,
  },
  projectTitle: { fontSize: 15, fontWeight: 600, color: '#e8e8f0', flex: 1 },
  starBadge: {
    display: 'flex', alignItems: 'center', gap: 4, fontSize: 12,
    color: '#fbbf24', fontWeight: 500,
  },
  projectDesc: { fontSize: 13, color: '#6b6b80', lineHeight: 1.6, margin: '0 0 10px' },
  projectTags: { display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 },
  tag: {
    padding: '3px 8px', borderRadius: 6, fontSize: 11, fontWeight: 500,
    background: 'rgba(124,58,237,0.08)', color: '#a78bfa',
    border: '1px solid rgba(124,58,237,0.12)',
  },
  langBadge: {
    display: 'flex', alignItems: 'center', gap: 5, padding: '3px 8px',
    borderRadius: 6, fontSize: 11, color: '#8888a0',
    background: 'rgba(255,255,255,0.03)',
  },
  projectFooter: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  author: { fontSize: 12, color: '#4a4a5c' },
  visBadge: { fontSize: 10, color: '#6b6b80', background: 'rgba(255,255,255,0.04)', padding: '2px 8px', borderRadius: 6 },
  actionBtn: {
    background: 'none', border: 'none', color: '#6b6b80', cursor: 'pointer',
    padding: 4, borderRadius: 6, display: 'flex', transition: 'all 0.15s',
  },
  loading: { textAlign: 'center', padding: 40, color: '#6b6b80', fontSize: 14 },
  empty: { textAlign: 'center', padding: 40, color: '#6b6b80', fontSize: 14 },
  label: { display: 'block', fontSize: 12, color: '#6b6b80', marginBottom: 6, fontWeight: 500 },
  input: {
    width: '100%', padding: '10px 14px', border: '1px solid #1e1e2e', borderRadius: 10,
    background: '#16161f', color: '#f0f0f5', fontSize: 14, outline: 'none',
  },
};
