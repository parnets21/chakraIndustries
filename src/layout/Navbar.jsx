import React, { useState } from 'react';

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

  const quickCreateItems = [
    { label: 'New Purchase Order', page: 'procurement' },
    { label: 'New Work Order', page: 'production' },
    { label: 'New Sales Order', page: 'orders' },
    { label: 'New GRN', page: 'procurement' },
    { label: 'New Task', page: 'tasks' },
  ];

  const pageLabel = activePage.charAt(0).toUpperCase() + activePage.slice(1);

  return (
    <div className="navbar">
      {/* Page Title */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ width: 3, height: 28, background: 'linear-gradient(180deg, var(--primary-light), var(--primary))', borderRadius: 2 }} />
        <div>
          <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--text)', letterSpacing: '-0.2px' }}>{pageLabel}</div>
          <div className="breadcrumb"><span>Home</span><span style={{ color: 'var(--text-xlight)' }}>›</span><span className="current">{pageLabel}</span></div>
        </div>
      </div>

      {/* Search */}
      <div className="navbar-search" style={{ marginLeft: 24 }}>
        <SearchIcon />
        <input type="text" placeholder="Search orders, SKUs, vendors..." />
      </div>

      <div className="navbar-actions">
        {/* Quick Create */}
        <div style={{ position: 'relative' }}>
          <button className="quick-create-btn" onClick={() => { setShowCreate(!showCreate); setShowNotif(false); setShowProfile(false); }}>
            <PlusIcon /> Quick Create
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
          <button className="icon-btn" onClick={() => { setShowNotif(!showNotif); setShowCreate(false); setShowProfile(false); }}>
            <BellIcon />
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
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: n.type === 'warning' ? 'var(--warning)' : n.type === 'danger' ? 'var(--danger)' : n.type === 'success' ? 'var(--success)' : 'var(--info)', marginTop: 5, flexShrink: 0 }} />
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
          <button className="profile-btn" onClick={() => { setShowProfile(!showProfile); setShowNotif(false); setShowCreate(false); }}>
            <div className="avatar">AK</div>
            <div style={{ textAlign: 'left' }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text)' }}>Arjun Kumar</div>
              <div style={{ fontSize: 10, color: 'var(--text-light)' }}>Admin</div>
            </div>
            <ChevronDownIcon />
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

function SearchIcon() {
  return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-light)' }}><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>;
}
function BellIcon() {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 01-3.46 0"/></svg>;
}
function PlusIcon() {
  return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>;
}
function ChevronDownIcon() {
  return <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"/></svg>;
}
