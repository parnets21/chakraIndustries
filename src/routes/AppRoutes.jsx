import React from 'react';
import DashboardPage from '../pages/dashboard/DashboardPage';
import ProcurementPage from '../pages/procurement/ProcurementPage';
import InventoryPage from '../pages/inventory/InventoryPage';
import ProductionPage from '../pages/production/ProductionPage';
import OEMPage from '../pages/oem/OEMPage';
import OrdersPage from '../pages/orders/OrdersPage';
import LogisticsPage from '../pages/logistics/LogisticsPage';
import ReturnsPage from '../pages/returns/ReturnsPage';
import FinancePage from '../pages/finance/FinancePage';
import ForecastingPage from '../pages/forecasting/ForecastingPage';
import AssetsPage from '../pages/assets/AssetsPage';
import BarcodePage from '../pages/barcode/BarcodePage';
import TasksPage from '../pages/tasks/TasksPage';
import ReportsPage from '../pages/reports/ReportsPage';

export default function AppRoutes({ activePage }) {
  const pages = {
    dashboard: <DashboardPage />,
    procurement: <ProcurementPage />,
    inventory: <InventoryPage />,
    production: <ProductionPage />,
    oem: <OEMPage />,
    orders: <OrdersPage />,
    logistics: <LogisticsPage />,
    returns: <ReturnsPage />,
    finance: <FinancePage />,
    forecasting: <ForecastingPage />,
    assets: <AssetsPage />,
    barcode: <BarcodePage />,
    tasks: <TasksPage />,
    reports: <ReportsPage />,
    settings: <SettingsPage />,
  };
  return pages[activePage] || pages.dashboard;
}

function SettingsPage() {
  return (
    <div>
      <div className="page-title" style={{ marginBottom: 20 }}>Settings</div>
      <div className="grid-2">
        {['Company Profile', 'User Management', 'Notifications', 'Integrations', 'Backup & Export', 'Audit Logs'].map(s => (
          <div key={s} className="card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}>
            <span style={{ fontWeight: 600 }}>{s}</span>
            <span style={{ color: 'var(--text-light)' }}>›</span>
          </div>
        ))}
      </div>
    </div>
  );
}
