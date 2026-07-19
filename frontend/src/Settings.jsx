import React, { useState, useEffect } from 'react';
import { t, setLanguage } from './i18n';

const ACCENT_COLORS = [
  { name: 'Purple', value: '#7c3aed' },
  { name: 'Blue', value: '#3b82f6' },
  { name: 'Green', value: '#22c55e' },
  { name: 'Red', value: '#ef4444' },
  { name: 'Orange', value: '#f97316' },
  { name: 'Pink', value: '#ec4899' },
  { name: 'Teal', value: '#14b8a6' },
  { name: 'Gold', value: '#f59e0b' },
];

const AI_COLORS = [
  { name: 'Violet', value: '#a78bfa' },
  { name: 'Blue', value: '#60a5fa' },
  { name: 'Green', value: '#4ade80' },
  { name: 'Cyan', value: '#22d3ee' },
  { name: 'Pink', value: '#f472b6' },
  { name: 'Orange', value: '#fb923c' },
  { name: 'White', value: '#f0f0f5' },
  { name: 'Gold', value: '#fbbf24' },
];

export default function Settings({ user, settings, onSave, onClose }) {
  const [theme, setTheme] = useState(settings.theme || 'dark');
  const [aiTextColor, setAiTextColor] = useState(settings.aiTextColor || '#a78bfa');
  const [fontSize, setFontSize] = useState(settings.fontSize || 14);
  const [accentColor, setAccentColor] = useState(settings.accentColor || '#7c3aed');
  const [language, setLang] = useState(settings.language || 'en');
  const [saved, setSaved] = useState(false);

  const isLight = settings.theme === 'light';

  const colors = {
    modal: isLight ? '#ffffff' : '#12121a',
    border: isLight ? '#e0e0e8' : '#1e1e2e',
    text: isLight ? '#1a1a26' : '#f0f0f5',
    text2: isLight ? '#6e6e82' : '#6e6e82',
    input: isLight ? '#f5f5f5' : '#1a1a26',
    inputBorder: isLight ? '#e0e0e8' : '#1e1e2e',
    btnBg: isLight ? '#f0f0f5' : '#1a1a26',
  };

  const handleSave = () => {
    const newSettings = { theme, aiTextColor, fontSize, accentColor, language };
    onSave(newSettings);
    if (language !== (localStorage.getItem('da_lang') || 'en')) {
      setLanguage(language);
      window.location.reload();
    }
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const labelStyle = {
    display: 'block', fontSize: 13, color: colors.text2, marginBottom: 10, fontWeight: 500,
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1000,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)',
    }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{
        background: colors.modal, border: `1px solid ${colors.border}`, borderRadius: 24,
        padding: '36px 40px', width: 480, maxHeight: '85vh', overflowY: 'auto',
        boxShadow: '0 25px 80px rgba(0,0,0,0.5)',
        animation: 'settingsIn 0.3s ease-out',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 }}>
          <h2 style={{ fontSize: 22, fontWeight: 700, color: colors.text }}>{t('settings.title')}</h2>
          <button onClick={onClose} style={{
            background: 'none', border: 'none', color: colors.text2, cursor: 'pointer',
            padding: 6, borderRadius: 8,
          }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
          </button>
        </div>

        {/* Theme */}
        <div style={{ marginBottom: 24 }}>
          <label style={labelStyle}>{t('settings.theme')}</label>
          <div style={{ display: 'flex', gap: 8 }}>
            {['dark', 'light'].map(th => (
              <button key={th} onClick={() => setTheme(th)} style={{
                flex: 1, padding: '10px 16px', borderRadius: 10, border: `1px solid ${theme === th ? accentColor : colors.border}`,
                background: theme === th ? `${accentColor}15` : colors.input,
                color: theme === th ? accentColor : colors.text2,
                fontSize: 13, fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s',
              }}>{t(`settings.${th}`)}</button>
            ))}
          </div>
        </div>

        {/* Accent Color */}
        <div style={{ marginBottom: 24 }}>
          <label style={labelStyle}>{t('settings.accentColor')}</label>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {ACCENT_COLORS.map(c => (
              <button key={c.value} onClick={() => setAccentColor(c.value)} title={c.name} style={{
                width: 32, height: 32, borderRadius: 10, border: `2px solid ${accentColor === c.value ? colors.text : 'transparent'}`,
                background: c.value, cursor: 'pointer', transition: 'all 0.2s',
                transform: accentColor === c.value ? 'scale(1.15)' : 'scale(1)',
              }} />
            ))}
          </div>
        </div>

        {/* AI Text Color */}
        <div style={{ marginBottom: 24 }}>
          <label style={labelStyle}>{t('settings.aiTextColor')}</label>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {AI_COLORS.map(c => (
              <button key={c.value} onClick={() => setAiTextColor(c.value)} title={c.name} style={{
                width: 32, height: 32, borderRadius: 10, border: `2px solid ${aiTextColor === c.value ? colors.text : 'transparent'}`,
                background: c.value, cursor: 'pointer', transition: 'all 0.2s',
                transform: aiTextColor === c.value ? 'scale(1.15)' : 'scale(1)',
              }} />
            ))}
          </div>
        </div>

        {/* Font Size */}
        <div style={{ marginBottom: 24 }}>
          <label style={labelStyle}>{t('settings.fontSize')}: {fontSize}px</label>
          <input type="range" min="12" max="20" value={fontSize} onChange={e => setFontSize(Number(e.target.value))}
            style={{ width: '100%', accentColor: accentColor, height: 6 }} />
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: colors.text2, marginTop: 4 }}>
            <span>12px</span><span>20px</span>
          </div>
        </div>

        {/* Language */}
        <div style={{ marginBottom: 28 }}>
          <label style={labelStyle}>{t('settings.language')}</label>
          <div style={{ display: 'flex', gap: 8 }}>
            {[{ code: 'en', label: 'English', flag: '🇺🇸' }, { code: 'ru', label: 'Русский', flag: '🇷🇺' }, { code: 'uz', label: 'O\'zbek', flag: '🇺🇿' }].map(l => (
              <button key={l.code} onClick={() => setLang(l.code)} style={{
                flex: 1, padding: '10px 12px', borderRadius: 10,
                border: `1px solid ${language === l.code ? accentColor : colors.border}`,
                background: language === l.code ? `${accentColor}15` : colors.input,
                color: language === l.code ? accentColor : colors.text2,
                fontSize: 13, fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s',
              }}>{l.flag} {l.label}</button>
            ))}
          </div>
        </div>

        <button onClick={handleSave} style={{
          width: '100%', padding: '14px', border: 'none', borderRadius: 12,
          background: `linear-gradient(135deg, ${accentColor}, #2563eb)`,
          color: 'white', fontSize: 14, fontWeight: 600, cursor: 'pointer',
          boxShadow: `0 4px 20px ${accentColor}40`,
          transition: 'all 0.2s',
        }}>
          {saved ? '✓ ' + t('settings.saved') : t('settings.save')}
        </button>
      </div>
      <style>{`@keyframes settingsIn { from{opacity:0;transform:scale(0.95) translateY(10px)} to{opacity:1;transform:scale(1) translateY(0)} }`}</style>
    </div>
  );
}
