import React, { useState, useEffect } from 'react';

const API = window.location.origin;

const PLAN_DETAILS = {
  free: {
    name: 'Free',
    messages: '50',
    features: ['Basic AI chat', 'Community support', 'Standard response speed'],
    gradient: 'linear-gradient(135deg, #6b7280, #4b5563)',
    border: '#333',
    accent: '#6b7280',
  },
  basic: {
    name: 'Basic',
    messages: '500',
    features: ['500 messages/day', 'Priority response speed', 'Email support', 'Basic analytics'],
    gradient: 'linear-gradient(135deg, #3b82f6, #1e40af)',
    border: '#1e40af',
    accent: '#3b82f6',
  },
  pro: {
    name: 'Pro',
    messages: 'Unlimited',
    features: ['Unlimited messages', 'Fastest response speed', 'Priority support', 'Advanced analytics', 'Early access to features'],
    gradient: 'linear-gradient(135deg, #a78bfa, #7c3aed)',
    border: '#7c3aed',
    accent: '#a78bfa',
  },
  enterprise: {
    name: 'Enterprise',
    messages: 'Unlimited',
    features: ['Unlimited messages', 'Priority support', 'Custom integrations', 'Dedicated account manager', 'SLA guarantee', 'Advanced analytics'],
    gradient: 'linear-gradient(135deg, #fbbf24, #d97706)',
    border: '#d97706',
    accent: '#fbbf24',
  },
};

const ROLE_STYLES = {
  user: { bg: '#1e1e2e', color: '#6e6e82', border: '#333' },
  admin: { bg: '#1a1a3e', color: '#a78bfa', border: '#7c3aed' },
  owner: { bg: '#2a2a1a', color: '#fbbf24', border: '#d97706' },
};

export default function Profile({ user, subscription, dailyUsed, dailyLimit, onClose, onUpdate, theme }) {
  const isLight = theme === 'light';
  const colors = {
    overlay: isLight ? 'rgba(0,0,0,0.3)' : 'rgba(0,0,0,0.6)',
    modal: isLight ? '#ffffff' : '#12121a',
    border: isLight ? '#e0e0e8' : '#1e1e2e',
    text: isLight ? '#1a1a26' : '#f0f0f5',
    text2: isLight ? '#6e6e82' : '#6e6e82',
    text3: isLight ? '#999' : '#4a4a5c',
    input: isLight ? '#f5f5f5' : '#16161f',
    inputBorder: isLight ? '#e0e0e8' : '#1e1e2e',
    card: isLight ? '#f8f8fc' : '#16161f',
    divider: isLight ? '#e0e0e8' : '#1e1e2e',
    success: isLight ? 'rgba(34,197,94,0.1)' : 'rgba(34,197,94,0.1)',
    successColor: isLight ? '#16a34a' : '#4ade80',
    error: isLight ? 'rgba(239,68,68,0.1)' : 'rgba(239,68,68,0.1)',
    errorColor: isLight ? '#dc2626' : '#f87171',
    planFeature: isLight ? '#4a4a5c' : '#9e9eb3',
    btnBg: isLight ? '#f0f0f5' : '#1e1e2e',
  };
  const [displayName, setDisplayName] = useState(user?.display_name || user?.username || '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [passwordMessage, setPasswordMessage] = useState(null);
  const [showPasswordFields, setShowPasswordFields] = useState(false);
  const [profileData, setProfileData] = useState(null);

  const token = localStorage.getItem('token');
  const authHeaders = { Authorization: `Bearer ${token}` };

  const tier = subscription || 'free';
  const plan = PLAN_DETAILS[tier] || PLAN_DETAILS.free;
  const role = user?.role || 'user';
  const roleStyle = ROLE_STYLES[role] || ROLE_STYLES.user;
  const usagePercent = dailyLimit > 0 && dailyLimit !== -1 ? Math.min((dailyUsed / dailyLimit) * 100, 100) : 0;
  const isUnlimited = dailyLimit === -1 || tier === 'pro' || tier === 'enterprise';

  useEffect(() => {
    fetch(`${API}/api/user/profile`, { headers: authHeaders })
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data) {
          setProfileData(data);
          if (data.display_name) setDisplayName(data.display_name);
        }
      })
      .catch(() => {});
  }, []);

  const handleSaveProfile = async () => {
    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch(`${API}/api/user/profile`, {
        method: 'PUT',
        headers: { ...authHeaders, 'Content-Type': 'application/json' },
        body: JSON.stringify({ display_name: displayName }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Failed to update profile');
      setMessage({ type: 'success', text: 'Profile updated successfully.' });
      if (onUpdate) onUpdate();
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async () => {
    setPasswordMessage(null);
    if (!currentPassword || !newPassword) {
      setPasswordMessage({ type: 'error', text: 'Please fill in all password fields.' });
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordMessage({ type: 'error', text: 'New passwords do not match.' });
      return;
    }
    if (newPassword.length < 4) {
      setPasswordMessage({ type: 'error', text: 'Password must be at least 4 characters.' });
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${API}/api/user/profile`, {
        method: 'PUT',
        headers: { ...authHeaders, 'Content-Type': 'application/json' },
        body: JSON.stringify({ current_password: currentPassword, new_password: newPassword }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Failed to change password');
      setPasswordMessage({ type: 'success', text: 'Password changed successfully.' });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setShowPasswordFields(false);
    } catch (err) {
      setPasswordMessage({ type: 'error', text: err.message });
    } finally {
      setLoading(false);
    }
  };

  const memberSince = profileData?.created_at
    ? new Date(profileData.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
    : user?.created_at
    ? new Date(user.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
    : null;

  const styles = {
    overlay: {
      position: 'fixed', inset: 0, zIndex: 1000,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)',
    },
    modal: {
      background: colors.modal, border: `1px solid ${colors.border}`, borderRadius: 24,
      padding: '32px 36px', width: 480, maxHeight: '85vh', overflowY: 'auto',
      boxShadow: '0 25px 80px rgba(0,0,0,0.5)',
      animation: 'profileIn 0.3s ease-out',
    },
    header: {
      display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24,
    },
    title: {
      fontSize: 22, fontWeight: 700, color: colors.text, margin: 0,
    },
    closeBtn: {
      background: 'none', border: 'none', color: colors.text2, cursor: 'pointer',
      padding: 6, borderRadius: 8, transition: 'color 0.2s',
    },
    content: {
      display: 'flex', flexDirection: 'column', gap: 0,
    },
    identitySection: {
      display: 'flex', alignItems: 'center', gap: 16, marginBottom: 4,
    },
    avatarLarge: {
      width: 56, height: 56, borderRadius: 16,
      background: 'linear-gradient(135deg, #7c3aed, #3b82f6)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      flexShrink: 0,
      boxShadow: '0 4px 20px rgba(124,58,237,0.3)',
    },
    avatarLetter: {
      fontSize: 24, fontWeight: 700, color: '#fff',
      lineHeight: 1,
    },
    identityInfo: {
      display: 'flex', flexDirection: 'column', gap: 2,
      minWidth: 0,
    },
    usernameRow: {
      display: 'flex', alignItems: 'center', gap: 8,
    },
    usernameText: {
      fontSize: 18, fontWeight: 600, color: colors.text,
      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
    },
    roleBadge: {
      fontSize: 11, fontWeight: 600, padding: '3px 10px',
      borderRadius: 6, border: '1px solid', textTransform: 'uppercase',
      letterSpacing: '0.5px', flexShrink: 0,
    },
    emailText: {
      fontSize: 13, color: colors.text2,
      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
    },
    memberSince: {
      fontSize: 12, color: colors.text3, marginTop: 2,
    },
    divider: {
      height: 1, background: colors.divider, margin: '20px 0',
    },
    planCard: {
      border: '1px solid', borderRadius: 14, padding: 18,
      background: colors.card,
    },
    planHeader: {
      display: 'flex', alignItems: 'center', gap: 14, marginBottom: 14,
    },
    planIcon: {
      width: 40, height: 40, borderRadius: 10,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      flexShrink: 0,
    },
    planInfo: {
      display: 'flex', flexDirection: 'column', gap: 2,
    },
    planName: {
      fontSize: 15, fontWeight: 700, color: colors.text,
    },
    planMessages: {
      fontSize: 12, color: colors.text2,
    },
    usageContainer: {
      marginBottom: 14,
    },
    usageLabel: {
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      fontSize: 12, color: colors.text2, marginBottom: 8,
    },
    usageTrack: {
      height: 6, background: colors.border, borderRadius: 3, overflow: 'hidden',
    },
    usageFill: {
      height: '100%', borderRadius: 3,
      transition: 'width 0.3s ease',
    },
    unlimitedBadge: {
      display: 'flex', alignItems: 'center', gap: 8,
      padding: '8px 12px', borderRadius: 8, marginBottom: 14,
      background: 'rgba(124,58,237,0.08)', border: '1px solid rgba(124,58,237,0.15)',
      fontSize: 13, color: '#a78bfa', fontWeight: 500,
    },
    planFeatures: {
      display: 'flex', flexDirection: 'column', gap: 8,
    },
    planFeature: {
      display: 'flex', alignItems: 'center', gap: 8,
      fontSize: 13, color: colors.planFeature,
    },
    fieldGroup: {
      marginBottom: 16,
    },
    label: {
      display: 'block', fontSize: 13, color: colors.text2, marginBottom: 8, fontWeight: 500,
    },
    input: {
      width: '100%', padding: '11px 14px', borderRadius: 10,
      border: `1px solid ${colors.inputBorder}`, background: colors.input,
      color: colors.text, fontSize: 14, outline: 'none',
      transition: 'border-color 0.2s, box-shadow 0.2s',
      boxSizing: 'border-box',
    },
    saveBtn: {
      width: '100%', padding: '13px', border: 'none', borderRadius: 12,
      background: 'linear-gradient(135deg, #7c3aed, #2563eb)',
      color: 'white', fontSize: 14, fontWeight: 600, cursor: 'pointer',
      boxShadow: '0 4px 20px rgba(124,58,237,0.3)',
      transition: 'all 0.2s',
      marginBottom: 4,
    },
    messageBox: {
      display: 'flex', alignItems: 'center', gap: 8,
      padding: '10px 14px', borderRadius: 10, fontSize: 13, fontWeight: 500,
      marginBottom: 14,
    },
    msgSuccess: {
      background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.2)',
      color: '#4ade80',
    },
    msgError: {
      background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)',
      color: '#f87171',
    },
    passwordSection: {
      borderRadius: 12, overflow: 'hidden',
    },
    passwordToggle: {
      width: '100%', display: 'flex', alignItems: 'center', gap: 10,
      padding: '12px 14px', borderRadius: 10,
      background: 'none', border: `1px solid ${colors.border}`,
      color: colors.text, fontSize: 14, fontWeight: 500,
      cursor: 'pointer', transition: 'all 0.2s',
    },
    passwordFields: {
      padding: '16px 0 0 0', display: 'flex', flexDirection: 'column',
    },
    passwordBtn: {
      width: '100%', padding: '12px', border: 'none', borderRadius: 10,
      background: colors.btnBg, color: colors.text,
      fontSize: 13, fontWeight: 600, cursor: 'pointer',
      transition: 'all 0.2s',
    },
  };

  return (
    <div style={{...styles.overlay, background: colors.overlay}} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={styles.modal}>
        <div style={styles.header}>
          <h2 style={styles.title}>Profile</h2>
          <button onClick={onClose} style={styles.closeBtn}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
          </button>
        </div>

        <div style={styles.content}>
          {/* Avatar + Identity */}
          <div style={styles.identitySection}>
            <div style={styles.avatarLarge}>
              <span style={styles.avatarLetter}>{(user?.username || '?')[0].toUpperCase()}</span>
            </div>
            <div style={styles.identityInfo}>
              <div style={styles.usernameRow}>
                <span style={styles.usernameText}>{user?.username || 'Unknown'}</span>
                <span style={{ ...styles.roleBadge, background: roleStyle.bg, color: roleStyle.color, borderColor: roleStyle.border }}>
                  {role.charAt(0).toUpperCase() + role.slice(1)}
                </span>
              </div>
              <div style={styles.emailText}>{user?.email || ''}</div>
              {memberSince && <div style={styles.memberSince}>Member since {memberSince}</div>}
            </div>
          </div>

          <div style={styles.divider} />

          {/* Plan Info */}
          <div style={{ ...styles.planCard, borderColor: plan.border }}>
            <div style={styles.planHeader}>
              <div style={{ ...styles.planIcon, background: plan.gradient }}>
                <span>{tier[0].toUpperCase()}</span>
              </div>
              <div style={styles.planInfo}>
                <div style={styles.planName}>{plan.name} Plan</div>
                <div style={styles.planMessages}>{plan.messages} messages / day</div>
              </div>
            </div>

            {!isUnlimited && (
              <div style={styles.usageContainer}>
                <div style={styles.usageLabel}>
                  <span>Daily Usage</span>
                  <span style={{ color: plan.accent }}>{dailyUsed} / {dailyLimit}</span>
                </div>
                <div style={styles.usageTrack}>
                  <div style={{ ...styles.usageFill, width: `${usagePercent}%`, background: plan.gradient }} />
                </div>
              </div>
            )}
            {isUnlimited && (
              <div style={styles.unlimitedBadge}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={plan.accent} strokeWidth="2"><path d="M18.36 6.64a9 9 0 11-12.73 0M12 2v4"/></svg>
                <span>Unlimited messages today</span>
              </div>
            )}

            <div style={styles.planFeatures}>
              {plan.features.map((f, i) => (
                <div key={i} style={styles.planFeature}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={plan.accent} strokeWidth="2.5"><path d="M20 6L9 17l-5-5"/></svg>
                  <span>{f}</span>
                </div>
              ))}
            </div>
          </div>

          <div style={styles.divider} />

          {/* Display Name */}
          <div style={styles.fieldGroup}>
            <label style={styles.label}>Display Name</label>
            <input
              type="text"
              value={displayName}
              onChange={e => setDisplayName(e.target.value)}
              placeholder="Enter display name"
              style={styles.input}
            />
          </div>

          {message && (
            <div style={{ ...styles.messageBox, ...(message.type === 'success' ? styles.msgSuccess : styles.msgError) }}>
              {message.type === 'success' ? (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M20 6L9 17l-5-5"/></svg>
              ) : (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><path d="M15 9l-6 6M9 9l6 6"/></svg>
              )}
              <span>{message.text}</span>
            </div>
          )}

          <button onClick={handleSaveProfile} disabled={loading} style={styles.saveBtn}>
            {loading ? 'Saving...' : 'Save Changes'}
          </button>

          <div style={styles.divider} />

          {/* Change Password */}
          <div style={styles.passwordSection}>
            <button
              onClick={() => setShowPasswordFields(!showPasswordFields)}
              style={styles.passwordToggle}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                <path d="M7 11V7a5 5 0 0110 0v4"/>
              </svg>
              <span>Change Password</span>
              <svg
                width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                style={{ transform: showPasswordFields ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s', marginLeft: 'auto' }}
              >
                <path d="M6 9l6 6 6-6"/>
              </svg>
            </button>

            {showPasswordFields && (
              <div style={styles.passwordFields}>
                <div style={styles.fieldGroup}>
                  <label style={styles.label}>Current Password</label>
                  <input
                    type="password"
                    value={currentPassword}
                    onChange={e => setCurrentPassword(e.target.value)}
                    placeholder="Enter current password"
                    style={styles.input}
                  />
                </div>
                <div style={styles.fieldGroup}>
                  <label style={styles.label}>New Password</label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={e => setNewPassword(e.target.value)}
                    placeholder="Enter new password"
                    style={styles.input}
                  />
                </div>
                <div style={styles.fieldGroup}>
                  <label style={styles.label}>Confirm New Password</label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    placeholder="Confirm new password"
                    style={styles.input}
                  />
                </div>

                {passwordMessage && (
                  <div style={{ ...styles.messageBox, ...(passwordMessage.type === 'success' ? styles.msgSuccess : styles.msgError) }}>
                    {passwordMessage.type === 'success' ? (
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M20 6L9 17l-5-5"/></svg>
                    ) : (
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><path d="M15 9l-6 6M9 9l6 6"/></svg>
                    )}
                    <span>{passwordMessage.text}</span>
                  </div>
                )}

                <button onClick={handleChangePassword} disabled={loading} style={styles.passwordBtn}>
                  {loading ? 'Updating...' : 'Update Password'}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
      <style>{`
        @keyframes profileIn {
          from { opacity: 0; transform: scale(0.95) translateY(10px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
        input:focus {
          outline: none;
          border-color: #7c3aed !important;
          box-shadow: 0 0 0 3px rgba(124,58,237,0.15);
        }
        button:disabled {
          opacity: 0.5;
          cursor: not-allowed !important;
        }
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: ${isLight ? '#d0d0d8' : '#333'}; border-radius: 3px; }
      `}</style>
    </div>
  );
}
