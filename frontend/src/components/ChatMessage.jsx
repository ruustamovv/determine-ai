import React, { useState, useEffect, useRef } from 'react';

function parseContent(text) {
  if (!text) return null;
  const parts = [];
  const codeBlockRegex = /```(\w*)\n?([\s\S]*?)```/g;
  let lastIndex = 0;
  let match;

  while ((match = codeBlockRegex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push({ type: 'text', content: text.slice(lastIndex, match.index) });
    }
    parts.push({ type: 'code', lang: match[1] || '', content: match[2].replace(/\n$/, '') });
    lastIndex = match.index + match[0].length;
  }
  if (lastIndex < text.length) {
    parts.push({ type: 'text', content: text.slice(lastIndex) });
  }
  if (parts.length === 0) parts.push({ type: 'text', content: text });
  return parts;
}

function renderInlineMarkdown(text) {
  const segments = [];
  const inlineRegex = /`([^`]+)`|(\*\*[^*]+\*\*)/g;
  let lastIdx = 0;
  let m;

  while ((m = inlineRegex.exec(text)) !== null) {
    if (m.index > lastIdx) {
      segments.push(<span key={`t${lastIdx}`}>{text.slice(lastIdx, m.index)}</span>);
    }
    if (m[1]) {
      segments.push(<code key={`c${m.index}`}>{m[1]}</code>);
    } else if (m[2]) {
      segments.push(<strong key={`b${m.index}`}>{m[2].slice(2, -2)}</strong>);
    }
    lastIdx = m.index + m[0].length;
  }
  if (lastIdx < text.length) {
    segments.push(<span key={`t${lastIdx}`}>{text.slice(lastIdx)}</span>);
  }
  return segments.length > 0 ? segments : text;
}

function ChatMessage({ message, aiTextColor, fontSize }) {
  const isUser = message.role === 'user';
  const [displayedText, setDisplayedText] = useState(message.content);
  const prevContentRef = useRef(message.content);
  const charIndexRef = useRef(message.content.length);
  const [fullscreenImage, setFullscreenImage] = useState(null);

  useEffect(() => {
    if (message.streaming && message.content.length > prevContentRef.current.length) {
      const newChars = message.content.slice(prevContentRef.current.length);
      let idx = 0;
      const typeInterval = setInterval(() => {
        if (idx < newChars.length) {
          charIndexRef.current++;
          setDisplayedText(message.content.slice(0, charIndexRef.current));
          idx++;
        } else {
          clearInterval(typeInterval);
          prevContentRef.current = message.content;
          charIndexRef.current = message.content.length;
          setDisplayedText(message.content);
        }
      }, 8);
      return () => clearInterval(typeInterval);
    } else {
      setDisplayedText(message.content);
      prevContentRef.current = message.content;
      charIndexRef.current = message.content.length;
    }
  }, [message.content, message.streaming]);

  const botTextStyle = !isUser && aiTextColor ? { color: aiTextColor } : {};
  const sizeStyle = fontSize ? { fontSize: `${fontSize}px` } : {};

  const parts = parseContent(displayedText);

  const downloadImage = () => {
    if (!message.generatedImage) return;
    const a = document.createElement('a');
    a.href = message.generatedImage;
    a.download = `determine-ai-${Date.now()}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className={`msg ${isUser ? 'user' : 'bot'} ${message.error ? 'error' : ''} ${message.streaming ? 'streaming' : ''}`}>
      <div className="msg-avatar">
        {isUser ? (
          <div className="avatar-sm user-avatar">U</div>
        ) : (
          <div className="avatar-sm bot-avatar"><span>D</span></div>
        )}
      </div>
      <div className="msg-body">
        <div className="msg-name">{isUser ? 'You' : 'Determine-AI'}</div>
        {message.image && (
          <div className="msg-image"><img src={message.image} alt="Uploaded" /></div>
        )}
        <div className="msg-text" style={{ ...botTextStyle, ...sizeStyle }}>
          {parts && parts.map((part, i) => {
            if (part.type === 'code') {
              return (
                <pre key={i}>
                  {part.lang && <span className="code-lang">{part.lang}</span>}
                  <code>{part.content}</code>
                </pre>
              );
            }
            return <span key={i}>{renderInlineMarkdown(part.content)}</span>;
          })}
        </div>
        {message.generatedImage && (
          <div className="msg-generated-image">
            <img
              src={message.generatedImage}
              alt={message.imagePrompt || 'Generated image'}
              onClick={() => setFullscreenImage(message.generatedImage)}
              style={{ cursor: 'zoom-in' }}
            />
            {message.imagePrompt && <div className="msg-image-caption">{message.imagePrompt}</div>}
            <button className="msg-image-download" onClick={downloadImage}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7,10 12,15 17,10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
              Download
            </button>
          </div>
        )}
      </div>
      {fullscreenImage && (
        <div className="image-lightbox" onClick={() => setFullscreenImage(null)}>
          <img src={fullscreenImage} alt="Full size" onClick={(e) => e.stopPropagation()} />
          <button className="lightbox-close" onClick={() => setFullscreenImage(null)}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
          </button>
        </div>
      )}
    </div>
  );
}

export default ChatMessage;
