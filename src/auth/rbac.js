// ─── Role-Based Access Control Config ────────────────────────────────────────
// access: 'full' | 'view' | false

export const BASE_ROLES = {
  super_admin:        'Super Admin',
  management:         'Management',
  purchase_manager:   'Purchase Manager',
  production_manager: 'Production Manager',
  dealer:             'Dealer',
  corporate_client:   'Corporate Client',
};

const CUSTOM_ROLES_KEY = 'chakra_custom_roles';

// Load custom roles from localStorage { key: label, ... }
export function loadCustomRoles() {
  try {
    const raw = localStorage.getItem(CUSTOM_ROLES_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch { return {}; }
}

export function saveCustomRole(key, label) {
  const existing = loadCustomRoles();
  existing[key] = label;
  localStorage.setItem(CUSTOM_ROLES_KEY, JSON.stringify(existing));
}

export function deleteCustomRole(key) {
  const existing = loadCustomRoles();
  delete existing[key];
  localStorage.setItem(CUSTOM_ROLES_KEY, JSON.stringify(existing));
  // Also clean up page access for this role
  try {
    const raw = localStorage.getItem('chakra_page_access');
    if (raw) {
      const matrix = JSON.parse(raw);
      for (const page of Object.keys(matrix)) {
        delete matrix[page][key];
      }
      localStorage.setItem('chakra_page_access', JSON.stringify(matrix));
    }
  } catch { /* ignore */ }
}

// Merged ROLES = base + custom (live, reads localStorage each call)
export function getAllRoles() {
  return { ...BASE_ROLES, ...loadCustomRoles() };
}

// For static imports that need ROLES at module load time — use BASE_ROLES + custom
export const ROLES = new Proxy({}, {
  get(_, prop) { return getAllRoles()[prop]; },
  ownKeys() { return Object.keys(getAllRoles()); },
  has(_, prop) { return prop in getAllRoles(); },
  getOwnPropertyDescriptor(_, prop) {
    const val = getAllRoles()[prop];
    return val !== undefined ? { value: val, writable: true, enumerable: true, configurable: true } : undefined;
  },
});

export const ROLE_KEYS = new Proxy([], {
  get(target, prop) {
    const keys = Object.keys(getAllRoles());
    if (prop === 'length') return keys.length;
    if (prop === Symbol.iterator) return keys[Symbol.iterator].bind(keys);
    if (prop === 'filter') return keys.filter.bind(keys);
    if (prop === 'map') return keys.map.bind(keys);
    if (prop === 'forEach') return keys.forEach.bind(keys);
    if (prop === 'find') return keys.find.bind(keys);
    if (prop === 'includes') return keys.includes.bind(keys);
    if (typeof prop === 'string' && !isNaN(prop)) return keys[Number(prop)];
    return target[prop];
  },
});

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
  tally:        { super_admin: 'full', management: 'view',  purchase_manager: false,   production_manager: false,   dealer: false,  corporate_client: false  },
  forecasting:  { super_admin: 'full', management: 'full',  purchase_manager: 'view',  production_manager: 'view',  dealer: false,  corporate_client: false  },
  reports:      { super_admin: 'full', management: 'full',  purchase_manager: 'full',  production_manager: 'full',  dealer: false,  corporate_client: false  },
  assets:       { super_admin: 'full', management: 'view',  purchase_manager: false,   production_manager: 'view',  dealer: false,  corporate_client: false  },
  barcode:      { super_admin: 'full', management: 'view',  purchase_manager: 'full',  production_manager: 'full',  dealer: false,  corporate_client: false  },
  tasks:        { super_admin: 'full', management: 'full',  purchase_manager: 'full',  production_manager: 'full',  dealer: 'full', corporate_client: 'full' },
  vinculum:     { super_admin: 'full', management: 'view',  purchase_manager: 'full',  production_manager: false,   dealer: false,  corporate_client: false  },
  creditnotes:  { super_admin: 'full', management: 'full',  purchase_manager: 'view',  production_manager: false,   dealer: false,  corporate_client: false  },
  livetracking: { super_admin: 'full', management: 'view',  purchase_manager: 'view',  production_manager: false,   dealer: 'view', corporate_client: 'view' },
  settings:     { super_admin: 'full', management: false,   purchase_manager: false,   production_manager: false,   dealer: false,  corporate_client: false  },
};

const STORAGE_KEY = 'chakra_page_access';

// Load from localStorage (Super Admin can override at runtime)
export function loadPageAccess() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const customRoles = loadCustomRoles();
    if (raw) {
      const saved = JSON.parse(raw);
      const merged = {};
      for (const page of Object.keys(DEFAULT_PAGE_ACCESS)) {
        merged[page] = { ...DEFAULT_PAGE_ACCESS[page], ...saved[page] };
        merged[page].super_admin = 'full'; // always lock super_admin
        // Ensure custom roles have an entry (default false)
        for (const cr of Object.keys(customRoles)) {
          if (merged[page][cr] === undefined) merged[page][cr] = false;
        }
      }
      return merged;
    }
    // No saved data — build from defaults + custom roles defaulting to false
    const fresh = {};
    for (const page of Object.keys(DEFAULT_PAGE_ACCESS)) {
      fresh[page] = { ...DEFAULT_PAGE_ACCESS[page] };
      for (const cr of Object.keys(customRoles)) {
        fresh[page][cr] = false;
      }
    }
    return fresh;
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
  {
    label: 'Procurement', page: 'procurement', icon: 'MdShoppingCart',
    children: [
      { path: '/procurement/vendors',   label: 'Vendors',               page: 'procurement' },
      { path: '/procurement/rfq',       label: 'RFQ',                   page: 'procurement' },
      { path: '/procurement/pr',        label: 'Purchase Requisition',  page: 'procurement' },
      { path: '/procurement/approvals', label: 'Approvals',             page: 'procurement' },
      { path: '/procurement/po',        label: 'Purchase Orders',       page: 'procurement' },
      { path: '/procurement/grn',       label: 'GRN',                   page: 'procurement' },
      { path: '/procurement/qc',        label: 'Quality Check',         page: 'procurement' },
      { path: '/procurement/excess',    label: 'Excess PO Monitor',     page: 'procurement' },
    ],
  },
  {
    label: 'Inventory', page: 'inventory', icon: 'MdInventory2',
    children: [
      { path: '/inventory/dashboard',  label: 'Stock Dashboard',    page: 'inventory' },
      { path: '/inventory/stock',      label: 'Stock Table',        page: 'inventory' },
      { path: '/inventory/warehouses', label: 'Warehouses',         page: 'inventory' },
      { path: '/inventory/movement',   label: 'Stock Movement',     page: 'inventory' },
      { path: '/inventory/picking',    label: 'Picking',            page: 'inventory' },
      { path: '/inventory/packing',    label: 'Sorting & Packing',  page: 'inventory' },
      { path: '/inventory/batch',      label: 'Batch Tracking',     page: 'inventory' },
      { path: '/inventory/ageing',     label: 'Ageing Stock',       page: 'inventory' },
      { path: '/inventory/defective',  label: 'Defective Stock',    page: 'inventory' },
      { path: '/inventory/storage',    label: 'Storage Locations',  page: 'inventory' },
      { path: '/inventory/pincode',    label: 'Pincode Stock View', page: 'inventory' },
    ],
  },
  {
    label: 'Production', page: 'production', icon: 'MdPrecisionManufacturing',
    children: [
      { path: '/production/bom',        label: 'BOM',                 page: 'production' },
      { path: '/production/workorders', label: 'Work Orders',         page: 'production' },
      { path: '/production/planning',   label: 'Planning',            page: 'production' },
      { path: '/production/scheduling', label: 'Scheduling',          page: 'production' },
      { path: '/production/tracking',   label: 'Tracking',            page: 'production' },
      { path: '/production/efficiency', label: 'Efficiency',          page: 'production' },
      { path: '/production/wastage',    label: 'Wastage',             page: 'production' },
    ],
  },
  { path: '/oem',    label: 'OEM',    page: 'oem',    icon: 'MdStar' },
  { path: '/orders', label: 'Orders', page: 'orders', icon: 'MdAssignment' },
  {
    label: 'Bulk Orders', page: 'bulk', icon: 'MdBusinessCenter',
    children: [
      { path: '/bulk/clients',   label: 'Corporate Clients',    page: 'bulk' },
      { path: '/bulk/quotations',label: 'Bulk Quotations',      page: 'bulk' },
      { path: '/bulk/packaging', label: 'Packaging Options',    page: 'bulk' },
      { path: '/bulk/delivery',  label: 'Delivery Scheduling',  page: 'bulk' },
    ],
  },
  {
    label: 'Logistics', page: 'logistics', icon: 'MdLocalShipping',
    children: [
      { path: '/logistics/dispatch',  label: 'Dispatch Dashboard',  page: 'logistics' },
      { path: '/logistics/vehicles',  label: 'Vehicle Allocation',  page: 'logistics' },
      { path: '/logistics/tracking',  label: 'Delivery Tracking',   page: 'logistics' },
      { path: '/logistics/dc',        label: 'DC Regularization',   page: 'logistics' },
      { path: '/logistics/pendency',  label: 'Pendency',            page: 'logistics' },
      { path: '/logistics/courier',   label: 'Courier & POD',       page: 'logistics' },
      { path: '/logistics/livetrack', label: 'Live Tracking',       page: 'livetracking' },
    ],
  },
  {
    label: 'Returns', page: 'returns', icon: 'MdAssignmentReturn',
    children: [
      { path: '/returns/requests',  label: 'Return Requests',       page: 'returns' },
      { path: '/returns/docket',    label: 'Docket Tracking',       page: 'returns' },
      { path: '/returns/matching',  label: 'Debit/Credit Matching', page: 'returns' },
      { path: '/returns/loss',      label: 'Loss Tracking',         page: 'returns' },
      { path: '/returns/material',  label: 'Material Returns',      page: 'returns' },
    ],
  },
  { section: 'FINANCE & ANALYTICS' },
  {
    label: 'Finance', page: 'finance', icon: 'MdAccountBalance',
    children: [
      { path: '/finance/ledger',   label: 'Ledger',              page: 'finance' },
      { path: '/finance/brs',      label: 'BRS',                 page: 'finance' },
      { path: '/finance/payments', label: 'Payments',            page: 'finance' },
      { path: '/finance/notes',    label: 'Credit/Debit Notes',  page: 'finance' },
      { path: '/finance/matching', label: 'Ledger Matching',     page: 'finance' },
      { path: '/finance/cntracks', label: 'CN Tracking',         page: 'creditnotes' },
    ],
  },
  {
    label: 'Tally Integration', page: 'tally', icon: 'MdSync',
    children: [
      { path: '/tally/dashboard',     label: 'Sync Dashboard',      page: 'tally' },
      { path: '/tally/master',        label: 'Master Data Sync',    page: 'tally' },
      { path: '/tally/transactions',  label: 'Transaction Sync',    page: 'tally' },
      { path: '/tally/logs',          label: 'Sync Logs',           page: 'tally' },
      { path: '/tally/config',        label: 'Configuration',       page: 'tally' },
    ],
  },
  {
    label: 'Forecasting', page: 'forecasting', icon: 'MdTrendingUp',
    children: [
      { path: '/forecasting/demand',    label: 'Demand Forecast',         page: 'forecasting' },
      { path: '/forecasting/planning',  label: 'Purchase Planning',       page: 'forecasting' },
      { path: '/forecasting/inventory', label: 'Inventory Optimization',  page: 'forecasting' },
      { path: '/forecasting/seasonal',  label: 'Seasonal Trends',         page: 'forecasting' },
    ],
  },
  {
    label: 'BI Reports', page: 'reports', icon: 'MdBarChart',
    children: [
      { path: '/reports/sales',       label: 'Sales Analytics',        page: 'reports' },
      { path: '/reports/pl',          label: 'Profit & Loss',          page: 'reports' },
      { path: '/reports/turnover',    label: 'Inventory Turnover',     page: 'reports' },
      { path: '/reports/stock',       label: 'Stock Summary',          page: 'reports' },
      { path: '/reports/purchase',    label: 'Purchase Register',      page: 'reports' },
      { path: '/reports/production',  label: 'Production Report',      page: 'reports' },
      { path: '/reports/returns',     label: 'Return Reconciliation',  page: 'reports' },
    ],
  },
  { section: 'TOOLS' },
  {
    label: 'Vinculum', page: 'vinculum', icon: 'MdSync',
    children: [
      { path: '/vinculum/config', label: 'API Configuration', page: 'vinculum' },
      { path: '/vinculum/logs',   label: 'Sync Logs',         page: 'vinculum' },
      { path: '/vinculum/sku',    label: 'SKU Matching',      page: 'vinculum' },
      { path: '/vinculum/sync',   label: 'Manual Sync',       page: 'vinculum' },
    ],
  },
  {
    label: 'Assets', page: 'assets', icon: 'MdBuild',
    children: [
      { path: '/assets/register',    label: 'Asset Register',        page: 'assets' },
      { path: '/assets/maintenance', label: 'Maintenance Calendar',  page: 'assets' },
      { path: '/assets/lifecycle',   label: 'Asset Lifecycle',       page: 'assets' },
    ],
  },
  {
    label: 'Barcode', page: 'barcode', icon: 'MdQrCode2',
    children: [
      { path: '/barcode/generate', label: 'Generate Barcode', page: 'barcode' },
      { path: '/barcode/scan',     label: 'Scan & Lookup',   page: 'barcode' },
      { path: '/barcode/logs',     label: 'Movement Logs',   page: 'barcode' },
    ],
  },
  {
    label: 'Tasks', page: 'tasks', icon: 'MdTask',
    children: [
      { path: '/tasks/kanban',    label: 'Kanban Board',       page: 'tasks' },
      { path: '/tasks/todo',      label: 'Daily To-Do',        page: 'tasks' },
      { path: '/tasks/recurring', label: 'Recurring Templates',page: 'tasks' },
      { path: '/tasks/notifs',    label: 'Notifications',      page: 'tasks' },
    ],
  },
  { section: 'SYSTEM' },
  { path: '/settings', label: 'Settings', page: 'settings', icon: 'MdSettings' },
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