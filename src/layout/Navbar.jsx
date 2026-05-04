import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  MdSearch, MdNotifications, MdKeyboardArrowDown,
  MdWarning, MdError, MdCheckCircle, MdInfo,
  MdPerson, MdSettings, MdHelpOutline, MdLogout,
  MdMenu, MdAdd, MdRefresh,
} from 'react-icons/md';
import { useAuth } from '../auth/AuthContext';
import { ROLES } from '../auth/rbac';
import { useNotifications } from '../hooks/useNotifications';

const PAGE_LABELS = {
  dashboard: 'Dashboard', procurement: 'Procurement', inventory: 'Inventory',
  production: 'Production', oem: 'OEM', orders: 'Orders', bulk: 'Bulk Orders',
  logistics: 'Logistics', returns: 'Returns', finance: 'Finance',
  forecasting: 'Forecasting', reports: 'BI Reports', assets: 'Assets',
  barcode: 'Barcode', tasks: 'Tasks', settings: 'Settings',
};

const NOTIF_META = {
  warning: { icon: <MdWarning size={13} />, color: '#f59e0b', bg: 'rgba(245,158,11,0.1)', border: 'rgba(245,158,11,0.2)' },
  danger:  { icon: <MdError size={13} />,   color: '#ef4444', bg: 'rgba(239,68,68,0.1)',  border: 'rgba(239,68,68,0.2)'  },
  success: { icon: <MdCheckCircle size={13} />, color: '#22c55e', bg: 'rgba(34,197,94,0.1)', border: 'rgba(34,197,94,0.2)' },
  info:    { icon: <MdInfo size={13} />,    color: '#3b82f6', bg: 'rgba(59,130,246,0.1)', border: 'rgba(59,130,246,0.2)' },
};

const QUICK_ITEMS = [
  { label: 'Purchase Order', path: '/procurement/po',  color: '#ef4444' },
  { label: 'Work Order',     path: '/production/workorders', color: '#a855f7' },
  { label: 'Sales Order',    path: '/orders',          color: '#3b82f6' },
  { label: 'GRN Entry',      path: '/procurement/grn', color: '#22c55e' },
  { label: 'New Task',       path: '/tasks/kanban',    color: '#f59e0b' },
];

const ROLE_GRADIENTS = {
  super_admin:        'linear-gradient(135deg,#ef4444,#b91c1c)',
  management:         'linear-gradient(135deg,#a855f7,#7c3aed)',
  purchase_manager:   'linear-gradient(135deg,#3b82f6,#1d4ed8)',
  production_manager: 'linear-gradient(135deg,#22c55e,#15803d)',
  dealer:             'linear-gradient(135deg,#f59e0b,#d97706)',
  corporate_client:   'linear-gradient(135deg,#14b8a6,#0f766e)',
};

function formatTimeAgo(date) {
  if (!date) return '';
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1)  return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24)  return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

function Avatar({ size = 32, name, role }) {
  const gradient = ROLE_GRADIENTS[role] || ROLE_GRADIENTS.super_admin;
  return (
    <div style={{
      width: size, height: size, borderRadius: Math.round(size * 0.3),
      background: gradient,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      color: '#fff', fontSize: Math.round(size * 0.38), fontWeight: 800, flexShrink: 0,
    }}>
      {(name || 'U').charAt(0).toUpperCase()}
    </div>
  );
}

/* Dropdown panel — anchors to viewport edge on mobile */
function Panel({ children, width = 300, right = 0, className = '' }) {
  return (
    <div className={className} style={{
      position: 'absolute',
      top: 'calc(100% + 8px)',
      right,
      width,
      background: '#fff',
      borderRadius: 14,
      border: '1px solid #e2e8f0',
      boxShadow: '0 16px 48px rgba(0,0,0,0.14), 0 4px 12px rgba(0,0,0,0.06)',
      zIndex: 500,
      overflow: 'hidden',
      transformOrigin: 'top right',
      animation: 'nbPanelIn .15s cubic-bezier(.4,0,.2,1)',
    }}>
      {children}
    </div>
  );
}

function DropItem({ children, onClick, danger }) {
  const [hov, setHov] = useState(false);
  return (
    <button onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        width: '100%', display: 'flex', alignItems: 'center', gap: 10,
        padding: '10px 16px',
        background: hov ? (danger ? '#fef2f2' : '#f8fafc') : 'transparent',
        border: 'none', cursor: 'pointer', fontSize: 13, fontFamily: 'inherit',
        color: danger ? '#ef4444' : '#374151', textAlign: 'left',
        transition: 'background .1s',
      }}
    >
      {children}
    </button>
  );
}

export default function Navbar({ activePage, onMenuClick, isMobile }) {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(null);
  const { notifications, unreadCount, loading, hasNew, clearNew, refetch } = useNotifications();

  const wrapRef = useRef();

  useEffect(() => {
    const handler = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(null);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const toggle = (k) => setOpen(p => (p === k ? null : k));
  const close  = ()  => setOpen(null);
  const label  = PAGE_LABELS[activePage] || 'Dashboard';

  return (
    <>
      <style>{`
        @keyframes nbPanelIn {
          from { opacity:0; transform:scale(.96) translateY(-4px); }
          to   { opacity:1; transform:scale(1)   translateY(0);    }
        }
        @keyframes nbPulse {
          0%,100% { transform: scale(1); }
          50%      { transform: scale(1.35); }
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }

        /* ── search bar ── */
        .nb-search-wrap {
          flex:1; max-width:360px; margin-left:12px;
          position:relative; display:flex; align-items:center;
        }
        .nb-search {
          width:100%; padding:8px 36px 8px 34px;
          border:1.5px solid #e2e8f0; border-radius:10px;
          background:#f8fafc; font-size:13px; color:#1e293b;
          outline:none; font-family:inherit; transition:all .2s;
        }
        .nb-search:focus { border-color:#ef4444; background:#fff; box-shadow:0 0 0 3px rgba(239,68,68,0.08); }
        .nb-search::placeholder { color:#94a3b8; }
        .nb-search-icon { position:absolute; left:10px; color:#94a3b8; pointer-events:none; display:flex; }
        .nb-kbd {
          position:absolute; right:9px; font-size:10px; color:#94a3b8;
          background:#f1f5f9; padding:2px 6px; border-radius:5px;
          font-weight:600; pointer-events:none; border:1px solid #e2e8f0;
        }

        /* hide search on tablet/mobile */
        @media (max-width:900px) { .nb-search-wrap { display:none !important; } }

        /* hamburger only on mobile/tablet */
        @media (min-width:1025px) { .nb-hamburger { display:none !important; } }

        /* ── icon button ── */
        .nb-icon-btn {
          position:relative; width:36px; height:36px; border-radius:10px;
          border:1.5px solid #e2e8f0; background:#fff;
          color:#64748b; display:flex; align-items:center; justify-content:center;
          cursor:pointer; transition:all .15s; flex-shrink:0;
        }
        .nb-icon-btn:hover, .nb-icon-btn.active {
          border-color:#fca5a5; background:#fef2f2; color:#ef4444;
        }

        /* ── notification panel — full-width on small screens ── */
        .nb-notif-panel {
          right: 0 !important;
          width: 320px;
        }
        @media (max-width:480px) {
          .nb-notif-panel {
            position: fixed !important;
            top: 64px !important;
            left: 8px !important;
            right: 8px !important;
            width: auto !important;
          }
        }

        /* ── profile panel ── */
        .nb-profile-panel { right: 0 !important; }
        @media (max-width:480px) {
          .nb-profile-panel {
            position: fixed !important;
            top: 64px !important;
            left: 8px !important;
            right: 8px !important;
            width: auto !important;
          }
        }

        /* ── create panel ── */
        .nb-create-panel { right: 0 !important; }
        @media (max-width:480px) {
          .nb-create-panel {
            position: fixed !important;
            top: 64px !important;
            left: 8px !important;
            right: 8px !important;
            width: auto !important;
          }
        }

        /* hide text labels on small screens */
        @media (max-width:640px) {
          .nb-profile-name { display:none !important; }
          .nb-create-label { display:none !important; }
        }
      `}</style>

      <header style={{
        height: 60,
        background: '#fff',
        borderBottom: '1px solid #f1f5f9',
        display: 'flex',
        alignItems: 'center',
        padding: '0 14px',
        gap: 6,
        position: 'sticky',
        top: 0,
        zIndex: 100,
        flexShrink: 0,
        boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
        minWidth: 0,
        overflow: 'visible',
      }}>

        {/* ── hamburger ── */}
        <button className="nb-hamburger nb-icon-btn" onClick={onMenuClick}>
          <MdMenu size={20} />
        </button>

        {/* ── page title ── */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0, flexShrink: 1 }}>
          <div style={{
            width: 30, height: 30, borderRadius: 8, flexShrink: 0,
            background: 'linear-gradient(135deg,#ef4444,#b91c1c)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 2px 8px rgba(239,68,68,0.3)',
          }}>
            <span style={{ color: '#fff', fontSize: 13, fontWeight: 800 }}>{label.charAt(0)}</span>
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{
              fontSize: 14, fontWeight: 700, color: '#0f172a',
              lineHeight: 1.2, letterSpacing: '-0.2px',
              whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
            }}>
              {label}
            </div>
            <div style={{ fontSize: 10, color: '#94a3b8', display: 'flex', alignItems: 'center', gap: 2, marginTop: 1 }}>
              <span>Chakra ERP</span>
              <span style={{ color: '#cbd5e1' }}>›</span>
              <span style={{ color: '#ef4444', fontWeight: 600 }}>{label}</span>
            </div>
          </div>
        </div>

        {/* ── search (hidden on mobile) ── */}
        <div className="nb-search-wrap">
          <span className="nb-search-icon"><MdSearch size={14} /></span>
          <input className="nb-search" placeholder="Search orders, SKUs, vendors…" />
          <span className="nb-kbd">⌘K</span>
        </div>

        {/* ── spacer ── */}
        <div style={{ flex: 1 }} />

        {/* ── right cluster — all wrapped in one ref for outside-click ── */}
        <div ref={wrapRef} style={{ display: 'flex', alignItems: 'center', gap: 5, flexShrink: 0 }}>

          {/* Create button */}
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => toggle('create')}
              style={{
                display: 'flex', alignItems: 'center', gap: 5,
                padding: '7px 12px', borderRadius: 10,
                background: 'linear-gradient(135deg,#ef4444,#b91c1c)',
                color: '#fff', border: 'none', cursor: 'pointer',
                fontSize: 13, fontWeight: 600, fontFamily: 'inherit',
                boxShadow: '0 2px 8px rgba(185,28,28,0.3)',
                flexShrink: 0,
              }}
            >
              <MdAdd size={16} />
              <span className="nb-create-label">Create</span>
            </button>

            {open === 'create' && (
              <Panel width={210} className="nb-create-panel">
                <div style={{ padding: '10px 14px 7px', borderBottom: '1px solid #f1f5f9' }}>
                  <span style={{ fontSize: 10, fontWeight: 700, color: '#94a3b8', letterSpacing: '1.2px', textTransform: 'uppercase' }}>Quick Create</span>
                </div>
                {QUICK_ITEMS.map(item => (
                  <DropItem key={item.label} onClick={() => { navigate(item.path); close(); }}>
                    <span style={{ width: 7, height: 7, borderRadius: '50%', background: item.color, flexShrink: 0 }} />
                    {item.label}
                  </DropItem>
                ))}
              </Panel>
            )}
          </div>

          {/* divider */}
          <div style={{ width: 1, height: 20, background: '#e2e8f0', margin: '0 1px' }} />

          {/* Notifications */}
          <div style={{ position: 'relative' }}>
            <button
              className={`nb-icon-btn ${open === 'notif' ? 'active' : ''}`}
              onClick={() => { toggle('notif'); clearNew(); }}
            >
              <MdNotifications size={18} />
              {unreadCount > 0 && (
                <span style={{
                  position: 'absolute', top: -4, right: -4,
                  minWidth: 15, height: 15,
                  background: hasNew ? '#ef4444' : '#ef4444',
                  color: '#fff', fontSize: 8, fontWeight: 800,
                  borderRadius: 99, border: '2px solid #fff',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  padding: '0 2px',
                  animation: hasNew ? 'nbPulse .6s ease-in-out 3' : 'none',
                }}>{unreadCount > 99 ? '99+' : unreadCount}</span>
              )}
            </button>

            {open === 'notif' && (
              <Panel width={340} className="nb-notif-panel">
                {/* Header */}
                <div style={{ padding: '12px 14px 9px', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                    <span style={{ fontSize: 13, fontWeight: 700, color: '#0f172a' }}>Notifications</span>
                    {unreadCount > 0 && (
                      <span style={{ background: '#ef4444', color: '#fff', fontSize: 9, fontWeight: 800, padding: '1px 6px', borderRadius: 20 }}>{unreadCount}</span>
                    )}
                  </div>
                  <button onClick={refetch} title="Refresh" style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', display: 'flex', padding: 2 }}>
                    <MdRefresh size={15} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} />
                  </button>
                </div>

                {/* List */}
                <div style={{ maxHeight: 380, overflowY: 'auto' }}>
                  {loading && notifications.length === 0 ? (
                    <div style={{ padding: '24px 14px', textAlign: 'center', color: '#94a3b8', fontSize: 12 }}>Loading...</div>
                  ) : notifications.length === 0 ? (
                    <div style={{ padding: '24px 14px', textAlign: 'center', color: '#94a3b8', fontSize: 12 }}>
                      <div style={{ fontSize: 28, marginBottom: 6 }}>🔔</div>
                      All caught up! No pending actions.
                    </div>
                  ) : notifications.map(n => {
                    const m = NOTIF_META[n.type] || NOTIF_META.info;
                    const timeAgo = formatTimeAgo(n.time);
                    return (
                      <div key={n.id}
                        onClick={() => { if (n.link) { navigate(n.link); close(); } }}
                        style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '10px 14px', borderBottom: '1px solid #f8fafc', cursor: n.link ? 'pointer' : 'default' }}
                        onMouseEnter={e => { if (n.link) e.currentTarget.style.background = '#fef2f2'; }}
                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                      >
                        <div style={{ width: 30, height: 30, borderRadius: 8, flexShrink: 0, background: m.bg, border: `1px solid ${m.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: m.color }}>
                          {m.icon}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 12, color: '#1e293b', fontWeight: 500, lineHeight: 1.4 }}>{n.text}</div>
                          {n.subtext && <div style={{ fontSize: 11, color: '#64748b', marginTop: 1 }}>{n.subtext}</div>}
                          <div style={{ fontSize: 10.5, color: '#94a3b8', marginTop: 2 }}>{timeAgo}</div>
                        </div>
                        <div style={{ width: 6, height: 6, borderRadius: '50%', background: m.color, flexShrink: 0, marginTop: 6 }} />
                      </div>
                    );
                  })}
                </div>

                {/* Footer */}
                <div style={{ padding: '9px 14px', textAlign: 'center', fontSize: 12, color: '#ef4444', fontWeight: 600, cursor: 'pointer', borderTop: '1px solid #f1f5f9' }}
                  onClick={() => { navigate('/procurement/approvals'); close(); }}
                  onMouseEnter={e => e.currentTarget.style.background = '#fef2f2'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  View all approvals →
                </div>
              </Panel>
            )}
          </div>

          {/* Profile */}
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => toggle('profile')}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '4px 8px 4px 4px', borderRadius: 10,
                border: `1.5px solid ${open === 'profile' ? '#fca5a5' : '#e2e8f0'}`,
                background: open === 'profile' ? '#fef2f2' : '#fff',
                cursor: 'pointer', transition: 'all .15s', flexShrink: 0,
              }}
            >
              <Avatar size={28} name={user?.name} role={user?.role} />
              <div className="nb-profile-name" style={{ textAlign: 'left' }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#0f172a', lineHeight: 1.2, whiteSpace: 'nowrap' }}>{user?.name || 'User'}</div>
                <div style={{ fontSize: 10, color: '#ef4444', fontWeight: 600 }}>{ROLES[user?.role] || 'User'}</div>
              </div>
              <MdKeyboardArrowDown size={13} style={{ color: '#94a3b8', flexShrink: 0 }} className="nb-profile-name" />
            </button>

            {open === 'profile' && (
              <Panel width={220} className="nb-profile-panel">
                <div style={{ padding: '12px 14px', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', gap: 10 }}>
                  <Avatar size={36} name={user?.name} role={user?.role} />
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user?.name || 'User'}</div>
                    <div style={{ fontSize: 11, color: '#94a3b8', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user?.email || ''}</div>
                    <div style={{ fontSize: 10, color: '#ef4444', fontWeight: 600, marginTop: 2 }}>{ROLES[user?.role] || ''}</div>
                  </div>
                </div>
                {[
                  { label: 'My Profile',  icon: <MdPerson size={14} /> },
                  { label: 'Settings',    icon: <MdSettings size={14} />, path: '/settings' },
                  { label: 'Help Center', icon: <MdHelpOutline size={14} /> },
                  { label: 'Sign Out',    icon: <MdLogout size={14} />, danger: true, action: () => { logout(); navigate('/login', { replace: true }); } },
                ].map(item => (
                  <DropItem key={item.label} danger={item.danger}
                    onClick={() => {
                      if (item.action) { item.action(); close(); return; }
                      if (item.path) { navigate(item.path); close(); }
                    }}
                  >
                    <span style={{ color: item.danger ? '#ef4444' : '#94a3b8', display: 'flex' }}>{item.icon}</span>
                    {item.label}
                  </DropItem>
                ))}
              </Panel>
            )}
          </div>

        </div>
      </header>
    </>
  );
}
