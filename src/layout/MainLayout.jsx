import { useState } from 'react';
import Sidebar from './Sidebar';
import Navbar from './Navbar';

export default function MainLayout({ activePage, setActivePage, children }) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="main-layout">
      <Sidebar
        collapsed={collapsed}
        setCollapsed={setCollapsed}
        activePage={activePage}
        setActivePage={setActivePage}
      />
      <div className={`main-content${collapsed ? ' collapsed' : ''}`}>
        <Navbar activePage={activePage} setActivePage={setActivePage} />
        <div className="page-content fade-in">
          {children}
        </div>
      </div>
    </div>
  );
}
