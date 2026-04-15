import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  MdSearch, MdNotifications, MdKeyboardArrowDown,
  MdWarning, MdError, MdCheckCircle, MdInfo,
  MdPerson, MdSettings, MdHelpOutline, MdLogout,
  MdMenu, MdAdd,
} from 'react-icons/md';
import { useAuth } from '../auth/AuthContext';
import { ROLES } from '../auth/rbac';

const PAGE_LABELS = {
  dashboard: 'Dashboard', procurement: 'Procurement', inventory: 'Inventory',
  production: 'Production', oem: 'OEM', orders: 'Orders', bulk: 'Bulk Orders',
  logistics: 'Logistics', returns: 'Returns', finance: 'Finance',
  forecasting: 'Forecasting', reports: 'BI Reports', assets: 'Assets',
  barcode: 'Barcode', tasks: 'Tasks', settings: 'Settings',
};

const NOTIF_META = {
  warning: { icon: <MdWarning size={14} />, color: '#d97706', bg: '#fffbeb', border: '#fde68a' },
  danger:  { icon: <MdError size={14} />,   color: '#dc2626', bg: '#fef2f2', border: '#fecaca' },
  success: { icon: <MdCheckCircle size={14} />, color: '#16a34a', bg: '#f0fdf4', border: '#bbf7d0' },
  info:    { icon: <MdInfo size={14} />,    color: '#2563eb', bg: '#eff6ff', border: '#bfdbfe' },
};

const NOTIFICATIONS = [
  { id: 1, text: 'PO #PO-2024-089 awaiting approval', time: '5m ago',  type: 'warning' },
  { id: 2, text: 'Low stock: SKU-1042 (Bearing 6205)', time: '12m ago', type: 'danger'  },
  { id: 3, text: 'GRN #GRN-0234 received successfully', time: '1h ago', type: 'success' },
  { id: 4, text: 'Work Order WO-0891 completed',        time: '2h ago', type: 'info'    },
];

const QUICK_ITEMS = [
  { label: 'Purchase Order', path: '/procurement' },
  { label: 'Work Order',     path: '/production'  },
  { label: 'Sales Order',    path: '/orders'      },
  { label: 'GRN Entry',      path: '/procurement' },
  { label: 'New Task',       path: '/tasks'       },
];

/* ── tiny icon-button ─────────────────────────────────────────────────────── */
function IconBtn({ children, badge, onClick, active }) {
  const [hov, setHov] = useState(false);
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        position: 'relative',
        width: 38, height: 38,
        borderRadius: 10,
        border: `1.5px solid ${hov || active ? '#fca5a5' : '#e5e7eb'}`,
        background: hov || active ? '#fef2f2' : '#fff',
        color: hov || active ? '#ef4444' : '#6b7280',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        cursor: 'pointer',
        transition: 'border-color .15s, background .15s, color .15s',
        flexShrink: 0,
      }}
    >
      {children}
      {badge != null && (
        <span style={{
          position: 'absolute', top: -5, right: -5,
          minWidth: 17, height: 17,
          background: '#ef4444', color: '#fff',
          fontSize: 9, fontWeight: 800,
          borderRadius: 99, border: '2px solid #fff',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: '0 3px',
        }}>{badge}</span>
      )}
    </button>
  );
}

/* ── dropdown panel ───────────────────────────────────────────────────────── */
function Panel({ children, width = 280, right = 0 }) {
  return (
    <div style={{
      position: 'absolute',
      top: 'calc(100% + 8px)',
      right,
      width,
      background: '#fff',
      borderRadius: 14,
      border: '1px solid #e5e7eb',
      boxShadow: '0 12px 40px rgba(0,0,0,0.13), 0 2px 8px rgba(0,0,0,0.06)',
      zIndex: 400,
      overflow: 'hidden',
      transformOrigin: 'top right',
      animation: 'panelIn .14s cubic-bezier(.4,0,.2,1)',
    }}>
      {children}
    </div>
  );
}

export default function Navbar({ activePage, onMenuClick }) {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(null); // 'create' | 'notif' | 'profile'

  const createRef  = useRef();
  const notifRef   = useRef();
  const profileRef = useRef();

  /* close on outside click */
  useEffect(() => {
    const handler = (e) => {
      if (
        createRef.current  && !createRef.current.contains(e.target)  &&
        notifRef.current   && !notifRef.current.contains(e.target)   &&
        profileRef.current && !profileRef.current.contains(e.target)
      ) setOpen(null);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const toggle = (k) => setOpen(p => (p === k ? null : k));
  const close  = ()  => setOpen(null);

  const label = PAGE_LABELS[activePage] || 'Dashboard';

  return (
    <>
      <style>{`
        @keyframes panelIn {
          from { opacity: 0; transform: scale(.96) translateY(-4px); }
          to   { opacity: 1; transform: scale(1)   translateY(0);    }
        }
        .nb-search-wrap { flex: 1; max-width: 360px; margin-left: 20px; position: relative; display: flex; align-items: center; }
        .nb-search { width: 100%; padding: 8px 42px 8px 34px; border: 1.5px solid #e5e7eb; border-radius: 10px; background: #f9fafb; font-size: 13px; color: #374151; outline: none; font-family: inherit; transition: border-color .15s, background .15s, box-shadow .15s; }
        .nb-search:focus { border-color: #ef4444; background: #fff; box-shadow: 0 0 0 3px rgba(239,68,68,.1); }
        .nb-search::placeholder { color: #9ca3af; }
        .nb-kbd { position: absolute; right: 10px; font-size: 10px; color: #9ca3af; background: #f3f4f6; padding: 2px 6px; border-radius: 5px; font-weight: 600; pointer-events: none; }
        .nb-search-icon { position: absolute; left: 11px; color: #9ca3af; pointer-events: none; display: flex; }
        @media (max-width: 900px) { .nb-search-wrap { display: none !important; } }
        @media (max-width: 640px) { .nb-profile-text { display: none !important; } .nb-create-text { display: none !important; } }
        @media (min-width: 1025px) { .nb-hamburger { display: none !important; } }
      `}</style>

      <header style={{
        height: 64,
        background: '#fff',
        borderBottom: '1px solid #eaecf0',
        display: 'flex',
        alignItems: 'center',
        padding: '0 20px',
        gap: 8,
        position: 'sticky',
        top: 0,
        zIndex: 100,
        flexShrink: 0,
        boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
      }}>

        {/* ── hamburger (mobile / tablet) ── */}
        <button
          className="nb-hamburger"
          onClick={onMenuClick}
          style={{
            width: 38, height: 38, borderRadius: 10,
            border: '1.5px solid #e5e7eb', background: '#fff',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', color: '#6b7280', flexShrink: 0,
          }}
        >
          <MdMenu size={20} />
        </button>

        {/* ── page title ── */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
          <div style={{
            width: 3, height: 26, borderRadius: 2, flexShrink: 0,
            background: 'linear-gradient(180deg,#f87171 0%,#b91c1c 100%)',
          }} />
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, color: '#111827', lineHeight: 1.25, letterSpacing: '-0.2px' }}>
              {label}
            </div>
            <div style={{ fontSize: 10, color: '#9ca3af', display: 'flex', alignItems: 'center', gap: 3, marginTop: 1 }}>
              Chakra ERP
              <span style={{ color: '#d1d5db' }}>›</span>
              <span style={{ color: '#ef4444', fontWeight: 600 }}>{label}</span>
            </div>
          </div>
        </div>

        {/* ── search ── */}
        <div className="nb-search-wrap">
          <span className="nb-search-icon"><MdSearch size={15} /></span>
          <input className="nb-search" placeholder="Search orders, SKUs, vendors…" />
          <span className="nb-kbd">⌘K</span>
        </div>

        {/* ── spacer ── */}
        <div style={{ flex: 1 }} />

        {/* ── right cluster ── */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>

          {/* Create button */}
          <div ref={createRef} style={{ position: 'relative' }}>
            <button
              onClick={() => toggle('create')}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '8px 14px', borderRadius: 10,
                background: 'linear-gradient(135deg,#ef4444 0%,#b91c1c 100%)',
                color: '#fff', border: 'none', cursor: 'pointer',
                fontSize: 13, fontWeight: 600, fontFamily: 'inherit',
                boxShadow: '0 2px 8px rgba(185,28,28,.28)',
                transition: 'transform .1s, box-shadow .1s',
              }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 4px 14px rgba(185,28,28,.38)'; }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)';    e.currentTarget.style.boxShadow = '0 2px 8px rgba(185,28,28,.28)'; }}
            >
              <MdAdd size={16} />
              <span className="nb-create-text">Create</span>
            </button>

            {open === 'create' && (
              <Panel width={210}>
                <div style={{ padding: '12px 16px 8px', borderBottom: '1px solid #f3f4f6' }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: '#6b7280', letterSpacing: '.8px', textTransform: 'uppercase' }}>Quick Create</span>
                </div>
                {QUICK_ITEMS.map(item => (
                  <DropItem key={item.label} onClick={() => { navigate(item.path); close(); }}>
                    <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#ef4444', flexShrink: 0 }} />
                    {item.label}
                  </DropItem>
                ))}
              </Panel>
            )}
          </div>

          {/* divider */}
          <div style={{ width: 1, height: 24, background: '#e5e7eb', margin: '0 2px' }} />

          {/* Notifications */}
          <div ref={notifRef} style={{ position: 'relative' }}>
            <IconBtn badge={4} onClick={() => toggle('notif')} active={open === 'notif'}>
              <MdNotifications size={20} />
            </IconBtn>

            {open === 'notif' && (
              <Panel width={320}>
                <div style={{ padding: '14px 16px 10px', borderBottom: '1px solid #f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                    <span style={{ fontSize: 13, fontWeight: 700, color: '#111827' }}>Notifications</span>
                    <span style={{ background: '#ef4444', color: '#fff', fontSize: 9, fontWeight: 800, padding: '1px 6px', borderRadius: 20 }}>4</span>
                  </div>
                  <span style={{ fontSize: 11, color: '#ef4444', fontWeight: 600, cursor: 'pointer' }}>Mark all read</span>
                </div>
                {NOTIFICATIONS.map(n => {
                  const m = NOTIF_META[n.type];
                  return (
                    <div key={n.id}
                      style={{ display: 'flex', alignItems: 'flex-start', gap: 11, padding: '11px 16px', borderBottom: '1px solid #f9fafb', cursor: 'pointer' }}
                      onMouseEnter={e => e.currentTarget.style.background = '#fef2f2'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                    >
                      <div style={{ width: 30, height: 30, borderRadius: 8, flexShrink: 0, background: m.bg, border: `1px solid ${m.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: m.color }}>
                        {m.icon}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 12, color: '#374151', fontWeight: 500, lineHeight: 1.45 }}>{n.text}</div>
                        <div style={{ fontSize: 10, color: '#9ca3af', marginTop: 3 }}>{n.time}</div>
                      </div>
                      <div style={{ width: 6, height: 6, borderRadius: '50%', background: m.color, flexShrink: 0, marginTop: 7 }} />
                    </div>
                  );
                })}
                <div style={{ padding: '10px 16px', textAlign: 'center', fontSize: 12, color: '#ef4444', fontWeight: 600, cursor: 'pointer' }}
                  onMouseEnter={e => e.currentTarget.style.background = '#fef2f2'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  View all notifications →
                </div>
              </Panel>
            )}
          </div>

          {/* Profile */}
          <div ref={profileRef} style={{ position: 'relative' }}>
            <ProfileBtn onClick={() => toggle('profile')} active={open === 'profile'} user={user} />

            {open === 'profile' && (
              <Panel width={220}>
                <div style={{ padding: '14px 16px', borderBottom: '1px solid #f3f4f6', display: 'flex', alignItems: 'center', gap: 10 }}>
                  <Avatar size={36} initials={user?.avatar} />
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#111827' }}>{user?.name || 'User'}</div>
                    <div style={{ fontSize: 11, color: '#9ca3af' }}>{user?.email || ''}</div>
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
                    <span style={{ color: item.danger ? '#ef4444' : '#9ca3af', display: 'flex' }}>{item.icon}</span>
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

/* ── small reusable pieces ────────────────────────────────────────────────── */
function Avatar({ size = 30, initials }) {
  const letters = initials || 'U';
  return (
    <div style={{
      width: size, height: size, borderRadius: Math.round(size * 0.27),
      background: 'linear-gradient(135deg,#ef4444 0%,#991b1b 100%)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      color: '#fff', fontSize: size * 0.37, fontWeight: 800, flexShrink: 0,
    }}>{letters}</div>
  );
}

function ProfileBtn({ onClick, active, user }) {
  const [hov, setHov] = useState(false);
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        display: 'flex', alignItems: 'center', gap: 8,
        padding: '5px 10px 5px 5px', borderRadius: 10,
        border: `1.5px solid ${hov || active ? '#fca5a5' : '#e5e7eb'}`,
        background: hov || active ? '#fef2f2' : '#fff',
        cursor: 'pointer', transition: 'all .15s',
      }}
    >
      <Avatar size={30} initials={user?.avatar} />
      <div className="nb-profile-text" style={{ textAlign: 'left' }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: '#111827', lineHeight: 1.2 }}>{user?.name || 'User'}</div>
        <div style={{ fontSize: 10, color: '#ef4444', fontWeight: 600 }}>{ROLES[user?.role] || 'User'}</div>
      </div>
      <MdKeyboardArrowDown size={14} style={{ color: '#9ca3af' }} className="nb-profile-text" />
    </button>
  );
}

function DropItem({ children, onClick, danger }) {
  const [hov, setHov] = useState(false);
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        width: '100%', display: 'flex', alignItems: 'center', gap: 10,
        padding: '9px 16px', background: hov ? (danger ? '#fef2f2' : '#f9fafb') : 'transparent',
        border: 'none', borderBottom: '1px solid #f9fafb',
        cursor: 'pointer', fontSize: 13, fontFamily: 'inherit',
        color: danger ? '#ef4444' : '#374151', textAlign: 'left',
        transition: 'background .1s',
      }}
    >
      {children}
    </button>
  );
}
