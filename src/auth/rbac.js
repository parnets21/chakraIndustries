// ─── Role-Based Access Control Config ────────────────────────────────────────
// access: 'full' | 'view' | false

export const ROLES = {
  super_admin:        'Super Admin',
  management:         'Management',
  purchase_manager:   'Purchase Manager',
  production_manager: 'Production Manager',
  dealer:             'Dealer',
  corporate_client:   'Corporate Client',
};

export const ROLE_KEYS = Object.keys(ROLES);

// Default access matrix — super_admin is always locked to 'full'
export const DEFAULT_PAGE_ACCESS = {
  dashboard:    { super_admin: 'full', management: 'full',  purchase_manager: 'full',  production_manager: 'full',  dealer: 'view', corporate_client: 'view' },
  procurement:  { super_admin: 'full', management: 'view',  purchase_manager: 'full',  production_manager: false,   dealer: false,  corporate_client: false  },
  inventory:    { super_admin: 'full', management: 'full',  purchase_manager: 'full',  production_manager: 'full',  dealer: 'view', corporate_client: false  },
  production:   { super_admin: 'full', management: 'view',  purchase_manager: false,   production_manager: 'full',  dealer: false,  corporate_client: false  },
  oem:          { super_admin: 'full', management: 'view',  purchase_manager: false,   production_manager: 'full',  dealer: false,  corporate_client: false  },
  orders:       { super_admin: 'full', management: 'view',  purchase_manager: false,   production_manager: false,   dealer: 'view', corporate_client: false  },
  bulk:         { super_admin: 'full', management: 'view',  purchase_manager: false,   production_manager: false,   dealer: false,  corporate_client: 'full' },
  logistics:    { super_admin: 'full', management: 'view',  purchase_manager: 'view',  production_manager: false,   dealer: false,  corporate_client: 'view' },
  returns:      { super_admin: 'full', management: 'view',  purchase_manager: 'full',  production_manager: false,   dealer: 'view', corporate_client: 'view' },
  finance:      { super_admin: 'full', management: 'full',  purchase_manager: 'view',  production_manager: false,   dealer: false,  corporate_client: false  },
  forecasting:  { super_admin: 'full', management: 'full',  purchase_manager: 'view',  production_manager: 'view',  dealer: false,  corporate_client: false  },
  reports:      { super_admin: 'full', management: 'full',  purchase_manager: 'full',  production_manager: 'full',  dealer: false,  corporate_client: false  },
  assets:       { super_admin: 'full', management: 'view',  purchase_manager: false,   production_manager: 'view',  dealer: false,  corporate_client: false  },
  barcode:      { super_admin: 'full', management: 'view',  purchase_manager: 'full',  production_manager: 'full',  dealer: false,  corporate_client: false  },
  tasks:        { super_admin: 'full', management: 'full',  purchase_manager: 'full',  production_manager: 'full',  dealer: 'full', corporate_client: 'full' },
  settings:     { super_admin: 'full', management: false,   purchase_manager: false,   production_manager: false,   dealer: false,  corporate_client: false  },
};

const STORAGE_KEY = 'chakra_page_access';

// Load from localStorage (Super Admin can override at runtime)
export function loadPageAccess() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const saved = JSON.parse(raw);
      // Merge with defaults so new pages added later still work
      const merged = {};
      for (const page of Object.keys(DEFAULT_PAGE_ACCESS)) {
        merged[page] = { ...DEFAULT_PAGE_ACCESS[page], ...saved[page] };
        merged[page].super_admin = 'full'; // always lock super_admin
      }
      return merged;
    }
  } catch { /* ignore */ }
  return { ...DEFAULT_PAGE_ACCESS };
}

export function savePageAccess(matrix) {
  // Always keep super_admin as full
  const safe = {};
  for (const page of Object.keys(matrix)) {
    safe[page] = { ...matrix[page], super_admin: 'full' };
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(safe));
  return safe;
}

export function resetPageAccess() {
  localStorage.removeItem(STORAGE_KEY);
  return { ...DEFAULT_PAGE_ACCESS };
}

// Live accessor — reads from localStorage each time (used by guards)
export function getAccess(role, page) {
  const matrix = loadPageAccess();
  return matrix[page]?.[role] ?? false;
}

export function canAccess(role, page) {
  return getAccess(role, page) !== false;
}

export function isViewOnly(role, page) {
  return getAccess(role, page) === 'view';
}

// Sidebar nav items
export const NAV_ITEMS = [
  { section: 'MAIN' },
  { path: '/dashboard',   label: 'Dashboard',   page: 'dashboard',   icon: 'MdDashboard' },
  { section: 'OPERATIONS' },
  { path: '/procurement', label: 'Procurement', page: 'procurement', icon: 'MdShoppingCart' },
  { path: '/inventory',   label: 'Inventory',   page: 'inventory',   icon: 'MdInventory2' },
  { path: '/production',  label: 'Production',  page: 'production',  icon: 'MdPrecisionManufacturing' },
  { path: '/oem',         label: 'OEM',         page: 'oem',         icon: 'MdStar' },
  { path: '/orders',      label: 'Orders',      page: 'orders',      icon: 'MdAssignment' },
  { path: '/bulk',        label: 'Bulk Orders', page: 'bulk',        icon: 'MdBusinessCenter' },
  { path: '/logistics',   label: 'Logistics',   page: 'logistics',   icon: 'MdLocalShipping' },
  { path: '/returns',     label: 'Returns',     page: 'returns',     icon: 'MdAssignmentReturn' },
  { section: 'FINANCE & ANALYTICS' },
  { path: '/finance',     label: 'Finance',     page: 'finance',     icon: 'MdAccountBalance' },
  { path: '/forecasting', label: 'Forecasting', page: 'forecasting', icon: 'MdTrendingUp' },
  { path: '/reports',     label: 'BI Reports',  page: 'reports',     icon: 'MdBarChart' },
  { section: 'TOOLS' },
  { path: '/assets',      label: 'Assets',      page: 'assets',      icon: 'MdBuild' },
  { path: '/barcode',     label: 'Barcode',     page: 'barcode',     icon: 'MdQrCode2' },
  { path: '/tasks',       label: 'Tasks',       page: 'tasks',       icon: 'MdTask' },
  { section: 'SYSTEM' },
  { path: '/settings',    label: 'Settings',    page: 'settings',    icon: 'MdSettings' },
];

export function getNavForRole(role) {
  const result = [];
  let lastSection = null;
  for (const item of NAV_ITEMS) {
    if (item.section) { lastSection = item; continue; }
    if (canAccess(role, item.page)) {
      if (lastSection) { result.push(lastSection); lastSection = null; }
      result.push(item);
    }
  }
  return result;
}
