import React from 'react';

// ── Icons defined FIRST so they can be used in NAV_ITEMS below ──────────
function GridIcon() { return <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>; }
function ShoppingIcon() { return <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 01-8 0"/></svg>; }
function BoxIcon() { return <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>; }
function FactoryIcon() { return <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 20V8l6-4v4l6-4v4l6-4v16H2z"/><path d="M6 20v-4h4v4"/></svg>; }
function StarIcon() { return <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>; }
function ClipboardIcon() { return <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 4h2a2 2 0 012 2v14a2 2 0 01-2 2H6a2 2 0 01-2-2V6a2 2 0 012-2h2"/><rect x="8" y="2" width="8" height="4" rx="1" ry="1"/></svg>; }
function TruckIcon() { return <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="3" width="15" height="13"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>; }
function ReturnIcon() { return <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 102.13-9.36L1 10"/></svg>; }
function CurrencyIcon() { return <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/></svg>; }
function TrendIcon() { return <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/></svg>; }
function ChartIcon() { return <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>; }
function AssetIcon() { return <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2"/></svg>; }
function BarcodeIcon() { return <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 5v14M7 5v14M11 5v14M15 5v14M19 5v14M21 5v14"/></svg>; }
function TaskIcon() { return <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/></svg>; }
function SettingsIcon() { return <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/></svg>; }
function ChevronLeftIcon() { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>; }
function ChevronRightIcon() { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>; }

// ── Nav config (icons defined above, safe to reference here) ─────────────
const NAV_ITEMS = [
  { section: 'MAIN' },
  { id: 'dashboard',   label: 'Dashboard',   Icon: GridIcon },
  { section: 'OPERATIONS' },
  { id: 'procurement', label: 'Procurement', Icon: ShoppingIcon },
  { id: 'inventory',   label: 'Inventory',   Icon: BoxIcon },
  { id: 'production',  label: 'Production',  Icon: FactoryIcon },
  { id: 'oem',         label: 'OEM',         Icon: StarIcon },
  { id: 'orders',      label: 'Orders',      Icon: ClipboardIcon },
  { id: 'logistics',   label: 'Logistics',   Icon: TruckIcon },
  { id: 'returns',     label: 'Returns',     Icon: ReturnIcon },
  { section: 'FINANCE & ANALYTICS' },
  { id: 'finance',     label: 'Finance',     Icon: CurrencyIcon },
  { id: 'forecasting', label: 'Forecasting', Icon: TrendIcon },
  { id: 'reports',     label: 'BI Reports',  Icon: ChartIcon },
  { section: 'TOOLS' },
  { id: 'assets',      label: 'Assets',      Icon: AssetIcon },
  { id: 'barcode',     label: 'Barcode',     Icon: BarcodeIcon },
  { id: 'tasks',       label: 'Tasks',       Icon: TaskIcon },
  { section: 'SYSTEM' },
  { id: 'settings',    label: 'Settings',    Icon: SettingsIcon },
];

// ── Main Sidebar ─────────────────────────────────────────────────────────
export default function Sidebar({ collapsed, setCollapsed, activePage, setActivePage }) {
  const width = collapsed ? 68 : 256;

  return (
    <aside style={{
      width,
      minWidth: width,
      height: '100vh',
      position: 'fixed',
      left: 0,
      top: 0,
      display: 'flex',
      flexDirection: 'column',
      background: '#141e2b',
      zIndex: 100,
      overflow: 'hidden',
      transition: 'width 0.28s cubic-bezier(0.4,0,0.2,1), min-width 0.28s cubic-bezier(0.4,0,0.2,1)',
      boxShadow: '3px 0 24px rgba(0,0,0,0.3)',
      fontFamily: "'Inter','Segoe UI',system-ui,sans-serif",
    }}>

      {/* ── LOGO HEADER ── */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 11,
        padding: '0 14px',
        height: 68,
        minHeight: 68,
        flexShrink: 0,
        background: 'linear-gradient(135deg, #3b0d0d 0%, #1f0a0a 50%, #141e2b 100%)',
        borderBottom: '1px solid rgba(255,255,255,0.08)',
        overflow: 'hidden',
      }}>
        {/* Logo image box */}
        <div style={{
          width: 38,
          height: 38,
          borderRadius: 9,
          background: 'rgba(255,255,255,0.08)',
          border: '1px solid rgba(255,255,255,0.14)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          overflow: 'hidden',
        }}>
          <img
            src="/logos.png"
            alt="Chakra"
            style={{ width: 30, height: 30, objectFit: 'contain' }}
          />
        </div>

        {/* Brand name — hidden when collapsed */}
        {!collapsed && (
          <div style={{ overflow: 'hidden' }}>
            <div style={{
              color: '#ffffff',
              fontSize: 13.5,
              fontWeight: 800,
              whiteSpace: 'nowrap',
              lineHeight: 1.25,
              letterSpacing: '0.1px',
            }}>
              Chakra Industries
            </div>
            <div style={{
              color: '#f8c471',
              fontSize: 9,
              fontWeight: 700,
              letterSpacing: '2.2px',
              textTransform: 'uppercase',
              marginTop: 3,
              whiteSpace: 'nowrap',
            }}>
              ERP Platform
            </div>
          </div>
        )}
      </div>

      {/* ── SCROLLABLE NAV ── */}
      <nav style={{
        flex: 1,
        overflowY: 'auto',
        overflowX: 'hidden',
        padding: '8px 0 4px',
        msOverflowStyle: 'none',
        scrollbarWidth: 'none',
      }}>
        {NAV_ITEMS.map((item, i) => {
          // Section divider
          if (item.section) {
            return (
              <div key={i} style={{
                padding: collapsed ? '12px 0 4px' : '14px 16px 4px',
                textAlign: collapsed ? 'center' : 'left',
              }}>
                {collapsed
                  ? <div style={{ height: 1, background: 'rgba(255,255,255,0.08)', margin: '0 10px' }} />
                  : <span style={{
                      fontSize: 9,
                      fontWeight: 700,
                      letterSpacing: '1.8px',
                      textTransform: 'uppercase',
                      color: 'rgba(160,174,192,0.38)',
                      whiteSpace: 'nowrap',
                    }}>{item.section}</span>
                }
              </div>
            );
          }

          // Nav item
          const isActive = activePage === item.id;
          return (
            <NavItem
              key={item.id}
              id={item.id}
              label={item.label}
              Icon={item.Icon}
              isActive={isActive}
              collapsed={collapsed}
              onClick={() => setActivePage(item.id)}
            />
          );
        })}
      </nav>

      {/* ── COLLAPSE TOGGLE ── */}
      <div style={{
        flexShrink: 0,
        padding: '6px 8px 12px',
        borderTop: '1px solid rgba(255,255,255,0.07)',
      }}>
        <CollapseBtn collapsed={collapsed} onClick={() => setCollapsed(c => !c)} />
      </div>

    </aside>
  );
}

// ── Nav Item ─────────────────────────────────────────────────────────────
function NavItem({ id, label, Icon, isActive, collapsed, onClick }) {
  const [hovered, setHovered] = React.useState(false);

  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      title={collapsed ? label : undefined}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        margin: '1px 8px',
        padding: collapsed ? '10px 6px' : '9px 11px',
        borderRadius: 8,
        cursor: 'pointer',
        userSelect: 'none',
        position: 'relative',
        justifyContent: collapsed ? 'center' : 'flex-start',
        background: isActive
          ? 'rgba(192,57,43,0.22)'
          : hovered
          ? 'rgba(255,255,255,0.07)'
          : 'transparent',
        color: isActive || hovered ? '#ffffff' : 'rgba(160,174,192,0.82)',
        transition: 'background 0.15s ease, color 0.15s ease',
      }}
    >
      {/* Red left accent bar for active */}
      {isActive && (
        <div style={{
          position: 'absolute',
          left: 0,
          top: '20%',
          bottom: '20%',
          width: 3,
          borderRadius: '0 3px 3px 0',
          background: '#e74c3c',
        }} />
      )}

      {/* Icon */}
      <span style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: 20,
        height: 20,
        flexShrink: 0,
        color: isActive ? '#e74c3c' : 'inherit',
        transition: 'color 0.15s',
      }}>
        <Icon />
      </span>

      {/* Label */}
      {!collapsed && (
        <span style={{
          flex: 1,
          fontSize: 13,
          fontWeight: isActive ? 600 : 500,
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          letterSpacing: '0.1px',
        }}>
          {label}
        </span>
      )}

      {/* Active indicator dot */}
      {isActive && !collapsed && (
        <span style={{
          width: 6,
          height: 6,
          borderRadius: '50%',
          background: '#e74c3c',
          flexShrink: 0,
        }} />
      )}
    </div>
  );
}

// ── Collapse Button ───────────────────────────────────────────────────────
function CollapseBtn({ collapsed, onClick }) {
  const [hovered, setHovered] = React.useState(false);
  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: collapsed ? '10px 6px' : '9px 11px',
        margin: '0 0px',
        borderRadius: 8,
        cursor: 'pointer',
        userSelect: 'none',
        justifyContent: collapsed ? 'center' : 'flex-start',
        background: hovered ? 'rgba(255,255,255,0.07)' : 'transparent',
        color: hovered ? '#ffffff' : 'rgba(160,174,192,0.55)',
        transition: 'background 0.15s, color 0.15s',
      }}
    >
      <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 20, height: 20, flexShrink: 0 }}>
        {collapsed ? <ChevronRightIcon /> : <ChevronLeftIcon />}
      </span>
      {!collapsed && (
        <span style={{ fontSize: 12.5, fontWeight: 500, whiteSpace: 'nowrap' }}>
          Collapse
        </span>
      )}
    </div>
  );
}
