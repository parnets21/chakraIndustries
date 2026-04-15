import { Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from '../auth/ProtectedRoute';

import LoginPage      from '../pages/login/LoginPage';
import DashboardPage  from '../pages/dashboard/DashboardPage';
import ProcurementPage from '../pages/procurement/ProcurementPage';
import InventoryPage  from '../pages/inventory/InventoryPage';
import ProductionPage from '../pages/production/ProductionPage';
import OEMPage        from '../pages/oem/OEMPage';
import OrdersPage     from '../pages/orders/OrdersPage';
import BulkOrdersPage from '../pages/bulk/BulkOrdersPage';
import LogisticsPage  from '../pages/logistics/LogisticsPage';
import ReturnsPage    from '../pages/returns/ReturnsPage';
import FinancePage    from '../pages/finance/FinancePage';
import ForecastingPage from '../pages/forecasting/ForecastingPage';
import AssetsPage     from '../pages/assets/AssetsPage';
import BarcodePage    from '../pages/barcode/BarcodePage';
import TasksPage      from '../pages/tasks/TasksPage';
import ReportsPage    from '../pages/reports/ReportsPage';
import SettingsPage   from '../pages/settings/SettingsPage';

function P({ element }) {
  return <ProtectedRoute>{element}</ProtectedRoute>;
}

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/login"        element={<LoginPage />} />
      <Route path="/"             element={<P element={<DashboardPage />} />} />
      <Route path="/dashboard"    element={<P element={<DashboardPage />} />} />
      <Route path="/procurement"  element={<P element={<ProcurementPage />} />} />
      <Route path="/inventory"    element={<P element={<InventoryPage />} />} />
      <Route path="/production"   element={<P element={<ProductionPage />} />} />
      <Route path="/oem"          element={<P element={<OEMPage />} />} />
      <Route path="/orders"       element={<P element={<OrdersPage />} />} />
      <Route path="/bulk"         element={<P element={<BulkOrdersPage />} />} />
      <Route path="/logistics"    element={<P element={<LogisticsPage />} />} />
      <Route path="/returns"      element={<P element={<ReturnsPage />} />} />
      <Route path="/finance"      element={<P element={<FinancePage />} />} />
      <Route path="/forecasting"  element={<P element={<ForecastingPage />} />} />
      <Route path="/reports"      element={<P element={<ReportsPage />} />} />
      <Route path="/assets"       element={<P element={<AssetsPage />} />} />
      <Route path="/barcode"      element={<P element={<BarcodePage />} />} />
      <Route path="/tasks"        element={<P element={<TasksPage />} />} />
      <Route path="/settings"     element={<P element={<SettingsPage />} />} />
      <Route path="*"             element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}
