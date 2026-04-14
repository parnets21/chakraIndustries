import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';

export default function Modal({ open, onClose, title, children, footer, size = 'md' }) {
  const maxW = size === 'lg' ? 820 : size === 'xl' ? 1020 : 580;

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    // Prevent body scroll while modal open
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', handler);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

  if (!open) return null;

  // Portal renders directly on body — completely outside sidebar/layout margin
  return createPortal(
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: '100vw',
        height: '100vh',
        background: 'rgba(10,15,25,0.6)',
        backdropFilter: 'blur(5px)',
        WebkitBackdropFilter: 'blur(5px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 99999,
        padding: '20px',
        boxSizing: 'border-box',
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: '#ffffff',
          borderRadius: 18,
          width: '100%',
          maxWidth: maxW,
          maxHeight: '88vh',
          overflowY: 'auto',
          boxShadow: '0 32px 80px rgba(0,0,0,0.3), 0 8px 24px rgba(0,0,0,0.15)',
          fontFamily: "'Inter','Segoe UI',system-ui,sans-serif",
          position: 'relative',
        }}
      >
        {/* ── Header ── */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '20px 24px 16px',
          borderBottom: '1px solid #e8ecf0',
          position: 'sticky',
          top: 0,
          background: '#fff',
          zIndex: 1,
          borderRadius: '18px 18px 0 0',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 4, height: 24,
              background: 'linear-gradient(180deg, #e74c3c, #c0392b)',
              borderRadius: 2,
              flexShrink: 0,
            }} />
            <span style={{
              fontSize: 16,
              fontWeight: 800,
              color: '#1a202c',
              letterSpacing: '-0.2px',
            }}>
              {title}
            </span>
          </div>
          <button
            onClick={onClose}
            style={{
              width: 34, height: 34,
              borderRadius: 9,
              border: '1.5px solid #e2e8f0',
              background: 'transparent',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#718096',
              fontSize: 20,
              lineHeight: 1,
              flexShrink: 0,
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = '#fee2e2';
              e.currentTarget.style.borderColor = '#e74c3c';
              e.currentTarget.style.color = '#c0392b';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = 'transparent';
              e.currentTarget.style.borderColor = '#e2e8f0';
              e.currentTarget.style.color = '#718096';
            }}
          >
            ×
          </button>
        </div>

        {/* ── Body ── */}
        <div style={{ padding: '22px 24px' }}>
          {children}
        </div>

        {/* ── Footer ── */}
        {footer && (
          <div style={{
            padding: '14px 24px 20px',
            borderTop: '1px solid #e8ecf0',
            display: 'flex',
            gap: 10,
            justifyContent: 'flex-end',
            position: 'sticky',
            bottom: 0,
            background: '#fff',
            borderRadius: '0 0 18px 18px',
          }}>
            {footer}
          </div>
        )}
      </div>
    </div>,
    document.body   // ← renders outside the entire React tree layout
  );
}
