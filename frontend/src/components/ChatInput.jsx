import React, { useState, useRef, useEffect } from 'react';

const AI_VERSIONS = [
  { id: 'auto', label: 'Auto', desc: 'Based on your plan' },
  { id: '1.1', label: 'v1.1', desc: 'Starter' },
  { id: '1.2', label: 'v1.2', desc: 'Basic' },
  { id: '1.3', label: 'v1.3', desc: 'Pro' },
  { id: '1.4', label: 'v1.4', desc: 'Enterprise' },
];

function ChatInput({ onSend, disabled, onImageUpload, hasImage, selectedVersion, onVersionChange }) {
  const [input, setInput] = useState('');
  const [showVersionMenu, setShowVersionMenu] = useState(false);
  const textareaRef = useRef(null);
  const versionMenuRef = useRef(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 160) + 'px';
    }
  }, [input]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (versionMenuRef.current && !versionMenuRef.current.contains(e.target)) {
        setShowVersionMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSubmit = () => {
    if (!input.trim() || disabled) return;
    onSend(input.trim());
    setInput('');
    if (textareaRef.current) textareaRef.current.style.height = 'auto';
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const currentVersion = AI_VERSIONS.find(v => v.id === selectedVersion) || AI_VERSIONS[0];

  return (
    <div className="input-area">
      <div className="input-box">
        <button className="img-btn" onClick={onImageUpload} title="Upload image" disabled={disabled}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
            <circle cx="8.5" cy="8.5" r="1.5"/>
            <path d="M21 15l-5-5L5 21"/>
          </svg>
        </button>
        <textarea
          ref={textareaRef}
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={disabled ? 'Thinking...' : hasImage ? 'Describe the image...' : 'Message Determine-AI...'}
          disabled={disabled}
          rows={1}
        />
        <div className="version-selector" ref={versionMenuRef}>
          <button
            className="version-btn"
            onClick={() => setShowVersionMenu(!showVersionMenu)}
            title="Select AI version"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="3"/>
              <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/>
            </svg>
            <span>{currentVersion.label}</span>
          </button>
          {showVersionMenu && (
            <div className="version-menu">
              {AI_VERSIONS.map(v => (
                <button
                  key={v.id}
                  className={`version-option ${selectedVersion === v.id ? 'active' : ''}`}
                  onClick={() => {
                    onVersionChange(v.id);
                    setShowVersionMenu(false);
                  }}
                >
                  <span className="version-option-label">{v.label}</span>
                  <span className="version-option-desc">{v.desc}</span>
                  {selectedVersion === v.id && (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2.5"><path d="M20 6L9 17l-5-5"/></svg>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
        <button className={`send-btn ${input.trim() && !disabled ? 'active' : ''}`} onClick={handleSubmit} disabled={disabled || (!input.trim() && !hasImage)}>
          {disabled ? (
            <div className="spinner"></div>
          ) : (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"/></svg>
          )}
        </button>
      </div>
      <p className="input-hint">Determine-AI runs locally on your server. Your data never leaves.</p>
    </div>
  );
}

export default ChatInput;
