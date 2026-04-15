import { useState } from 'react';
import {
  MdSearch, MdNotifications, MdAdd, MdKeyboardArrowDown,
  MdWarning, MdError, MdCheckCircle, MdInfo
} from 'react-icons/md';

export default function Navbar({ activePage, setActivePage }) {
  const [showNotif, setShowNotif] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [showCreate, setShowCreate] = useState(false);

  const notifications = [
    { id: 1, text: 'New PO #PO-2024-089 awaiting approval', time: '5m ago', type: 'warning' },
    { id: 2, text: 'Low stock alert: SKU-1042 (Bearing 6205)', time: '12m ago', type: 'danger' },
    { id: 3, text: 'GRN #GRN-0234 received successfully', time: '1h ago', type: 'success' },
    { id: 4, text: 'Production WO-0891 completed', time: '2h ago', type: 'info' },
  ];

  const notifIconMap = {
    warning: <MdWarning size={14} color="var(--warning)" />,
    danger:  <MdError   size={14} color="var(--danger)" />,
    success: <MdCheckCircle size={14} color="var(--success)" />,
    info:    <MdInfo    size={14} color="var(--info)" />,
  };

  const quickCreateItems = [
    { label: 'New Purchase Order', page: 'procurement' },
    { label: 'New Work Order',     page: 'production' },
    { label: 'New Sales Order',    page: 'orders' },
    { label: 'New GRN',            page: 'procurement' },
    { label: 'New Task',           page: 'tasks' },
  ];

  const pageLabel = activePage === 'oem' ? 'OEM'
    : activePage === 'dashboard' ? 'Dashboard'
    : activePage.charAt(0).toUpperCase() + activePage.slice(1);

  const pagePath = activePage === 'dashboard' ? '/' : `/${activePage}`;

  return (
    <div className="navbar">
      {/* Page Title */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ width: 3, height: 28, background: 'linear-gradient(180deg, var(--primary-light), var(--primary))', borderRadius: 2 }} />
        <div>
          <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--text)', letterSpacing: '-0.2px' }}>{pageLabel}</div>
          <div className="breadcrumb">
            <span>localhost:5173</span>
            <span style={{ color: 'var(--text-xlight)' }}>›</span>
            <span className="current" style={{ fontFamily: 'monospace', fontSize: 11 }}>{pagePath}</span>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="navbar-search" style={{ marginLeft: 24 }}>
        <MdSearch size={16} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-light)' }} />
        <input type="text" placeholder="Search orders, SKUs, vendors..." />
      </div>

      <div className="navbar-actions">
        {/* Quick Create */}
        <div style={{ position: 'relative' }}>
          <button
            className="quick-create-btn"
            onClick={() => { setShowCreate(!showCreate); setShowNotif(false); setShowProfile(false); }}
          >
            <MdAdd size={16} /> Quick Create
          </button>
          {showCreate && (
            <div className="dropdown" style={{ minWidth: 220 }}>
              <div className="dropdown-header">Quick Create</div>
              {quickCreateItems.map(item => (
                <div key={item.label} className="dropdown-item" onClick={() => { setActivePage(item.page); setShowCreate(false); }}>
                  <span style={{ fontSize: 13 }}>{item.label}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Notifications */}
        <div style={{ position: 'relative' }}>
          <button
            className="icon-btn"
            onClick={() => { setShowNotif(!showNotif); setShowCreate(false); setShowProfile(false); }}
          >
            <MdNotifications size={18} />
            <span className="badge">4</span>
          </button>
          {showNotif && (
            <div className="dropdown">
              <div className="dropdown-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>Notifications</span>
                <span style={{ fontSize: 11, color: 'var(--primary)', cursor: 'pointer', fontWeight: 500 }}>Mark all read</span>
              </div>
              {notifications.map(n => (
                <div key={n.id} className="dropdown-item">
                  <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                    <div style={{ marginTop: 2, flexShrink: 0 }}>{notifIconMap[n.type]}</div>
                    <div>
                      <div style={{ fontSize: 12, color: 'var(--text)' }}>{n.text}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-light)', marginTop: 2 }}>{n.time}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Profile */}
        <div style={{ position: 'relative' }}>
          <button
            className="profile-btn"
            onClick={() => { setShowProfile(!showProfile); setShowNotif(false); setShowCreate(false); }}
          >
            <div className="avatar">AK</div>
            <div style={{ textAlign: 'left' }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text)' }}>Arjun Kumar</div>
              <div style={{ fontSize: 10, color: 'var(--text-light)' }}>Admin</div>
            </div>
            <MdKeyboardArrowDown size={16} style={{ color: 'var(--text-light)' }} />
          </button>
          {showProfile && (
            <div className="dropdown" style={{ minWidth: 180 }}>
              <div className="dropdown-header">My Account</div>
              {['Profile', 'Settings', 'Help', 'Sign Out'].map(item => (
                <div key={item} className="dropdown-item" style={{ fontSize: 13 }}>{item}</div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
