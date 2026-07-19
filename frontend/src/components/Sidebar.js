import React from 'react';

function Sidebar({ memories, onClearChat, modelLoaded, sessionId }) {
  return (
    <div className="sidebar">
      <h2>Determine-AI</h2>

      <div className={`status-badge ${modelLoaded ? 'loaded' : 'unloaded'}`}>
        <span className={`status-dot ${modelLoaded ? 'loaded' : 'unloaded'}`} />
        {modelLoaded ? 'Model Active' : 'No Model Loaded'}
      </div>

      <button className="btn" onClick={onClearChat}>
        New Conversation
      </button>

      {sessionId && (
        <div style={{ fontSize: '11px', color: '#666', marginTop: '4px', wordBreak: 'break-all' }}>
          Session: {sessionId.substring(0, 8)}...
        </div>
      )}

      <div style={{ marginTop: '24px' }}>
        <h2>Memories</h2>
        {memories.length === 0 ? (
          <p style={{ fontSize: '13px', color: '#666' }}>
            No memories stored yet.
          </p>
        ) : (
          <ul className="memory-list">
            {memories.map((mem, i) => (
              <li key={i}>{mem}</li>
            ))}
          </ul>
        )}
      </div>

      <div style={{ marginTop: 'auto', paddingTop: '20px' }}>
        <p style={{ fontSize: '11px', color: '#555' }}>
          Built from scratch with Python & PyTorch
        </p>
      </div>
    </div>
  );
}

export default Sidebar;
