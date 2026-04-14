import React, { useState } from 'react';
import Sidebar from './Sidebar';
import Navbar from './Navbar';

const SIDEBAR_W = 256;
const COLLAPSED_W = 68;

export default function MainLayout({ activePage, setActivePage, children }) {
  const [collapsed, setCollapsed] = useState(false);
  const ml = collapsed ? COLLAPSED_W : SIDEBAR_W;

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <Sidebar
        collapsed={collapsed}
        setCollapsed={setCollapsed}
        activePage={activePage}
        setActivePage={setActivePage}
      />
      <div style={{
        flex: 1,
        marginLeft: ml,
        transition: 'margin-left 0.28s cubic-bezier(0.4,0,0.2,1)',
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        background: 'var(--bg)',
      }}>
        <Navbar activePage={activePage} setActivePage={setActivePage} />
        <div className="page-content fade-in">
          {children}
        </div>
      </div>
    </div>
  );
}
