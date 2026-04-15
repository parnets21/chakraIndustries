import {
  MdDashboard, MdShoppingCart, MdInventory2, MdPrecisionManufacturing,
  MdStar, MdAssignment, MdLocalShipping, MdAssignmentReturn,
  MdAccountBalance, MdTrendingUp, MdBarChart, MdBuild,
  MdQrCode2, MdTask, MdSettings,
  MdChevronLeft, MdChevronRight
} from 'react-icons/md';

const NAV_ITEMS = [
  { section: 'MAIN' },
  { id: 'dashboard',   label: 'Dashboard',   Icon: MdDashboard },
  { section: 'OPERATIONS' },
  { id: 'procurement', label: 'Procurement', Icon: MdShoppingCart },
  { id: 'inventory',   label: 'Inventory',   Icon: MdInventory2 },
  { id: 'production',  label: 'Production',  Icon: MdPrecisionManufacturing },
  { id: 'oem',         label: 'OEM',         Icon: MdStar },
  { id: 'orders',      label: 'Orders',      Icon: MdAssignment },
  { id: 'logistics',   label: 'Logistics',   Icon: MdLocalShipping },
  { id: 'returns',     label: 'Returns',     Icon: MdAssignmentReturn },
  { section: 'FINANCE & ANALYTICS' },
  { id: 'finance',     label: 'Finance',     Icon: MdAccountBalance },
  { id: 'forecasting', label: 'Forecasting', Icon: MdTrendingUp },
  { id: 'reports',     label: 'BI Reports',  Icon: MdBarChart },
  { section: 'TOOLS' },
  { id: 'assets',      label: 'Assets',      Icon: MdBuild },
  { id: 'barcode',     label: 'Barcode',     Icon: MdQrCode2 },
  { id: 'tasks',       label: 'Tasks',       Icon: MdTask },
  { section: 'SYSTEM' },
  { id: 'settings',    label: 'Settings',    Icon: MdSettings },
];

export default function Sidebar({ collapsed, setCollapsed, activePage, setActivePage }) {
  return (
    <aside className={`sidebar${collapsed ? ' collapsed' : ''}`}>
      {/* Logo */}
      <div className="sb-logo">
        <div className="sb-logo-icon">
          <img src="/logos.png" alt="Chakra" />
        </div>
        <div className="sb-logo-text">
          <div className="sb-logo-name">Chakra Industries</div>
          <div className="sb-logo-tag">ERP Platform</div>
        </div>
      </div>

      {/* Nav */}
      <nav className="sb-nav">
        {NAV_ITEMS.map((item, i) => {
          if (item.section) {
            return <div key={i} className="sb-section">{item.section}</div>;
          }
          const isActive = activePage === item.id;
          return (
            <button
              key={item.id}
              className={`sb-item${isActive ? ' sb-item--active' : ''}`}
              onClick={() => setActivePage(item.id)}
              title={collapsed ? item.label : undefined}
            >
              <span className="sb-item-icon">
                <item.Icon size={19} />
              </span>
              <span className="sb-item-label">{item.label}</span>
              {isActive && <span className="sb-item-dot" />}
            </button>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="sb-footer">
        <button className="sb-collapse-btn" onClick={() => setCollapsed(c => !c)}>
          <span className="sb-item-icon">
            {collapsed ? <MdChevronRight size={20} /> : <MdChevronLeft size={20} />}
          </span>
          <span className="sb-item-label">Collapse</span>
        </button>
      </div>
    </aside>
  );
}
