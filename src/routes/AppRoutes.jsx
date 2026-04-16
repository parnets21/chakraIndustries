import { Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from '../auth/ProtectedRoute';

import LoginPage     from '../pages/login/LoginPage';
import DashboardPage from '../pages/dashboard/DashboardPage';
import OEMPage       from '../pages/oem/OEMPage';
import OrdersPage    from '../pages/orders/OrdersPage';
import SettingsPage  from '../pages/settings/SettingsPage';

// Procurement
import VendorsPage             from '../pages/procurement/VendorsPage';
import RFQPage                 from '../pages/procurement/RFQPage';
import PurchaseRequisitionPage from '../pages/procurement/PurchaseRequisitionPage';
import ApprovalsPage           from '../pages/procurement/ApprovalsPage';
import PurchaseOrdersPage      from '../pages/procurement/PurchaseOrdersPage';
import GRNPage                 from '../pages/procurement/GRNPage';
import QualityCheckPage        from '../pages/procurement/QualityCheckPage';

// Inventory
import InventorySubPage from '../pages/inventory/InventorySubPage';

// Production
import ProductionSubPage from '../pages/production/ProductionSubPage';

// Bulk Orders
import BulkSubPage from '../pages/bulk/BulkSubPage';

// Logistics
import LogisticsSubPage from '../pages/logistics/LogisticsSubPage';

// Returns
import ReturnsSubPage from '../pages/returns/ReturnsSubPage';

// Finance
import FinanceSubPage from '../pages/finance/FinanceSubPage';

// Forecasting
import ForecastingSubPage from '../pages/forecasting/ForecastingSubPage';

// Reports
import ReportsSubPage from '../pages/reports/ReportsSubPage';

// Assets
import AssetsSubPage from '../pages/assets/AssetsSubPage';

// Barcode
import BarcodeSubPage from '../pages/barcode/BarcodeSubPage';

// Tasks
import TasksSubPage from '../pages/tasks/TasksSubPage';

function P({ element }) {
  return <ProtectedRoute>{element}</ProtectedRoute>;
}

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/login"     element={<LoginPage />} />
      <Route path="/"          element={<P element={<DashboardPage />} />} />
      <Route path="/dashboard" element={<P element={<DashboardPage />} />} />

      {/* Procurement */}
      <Route path="/procurement"              element={<Navigate to="/procurement/vendors" replace />} />
      <Route path="/procurement/vendors"      element={<P element={<VendorsPage />} />} />
      <Route path="/procurement/rfq"          element={<P element={<RFQPage />} />} />
      <Route path="/procurement/pr"           element={<P element={<PurchaseRequisitionPage />} />} />
      <Route path="/procurement/approvals"    element={<P element={<ApprovalsPage />} />} />
      <Route path="/procurement/po"           element={<P element={<PurchaseOrdersPage />} />} />
      <Route path="/procurement/grn"          element={<P element={<GRNPage />} />} />
      <Route path="/procurement/qc"           element={<P element={<QualityCheckPage />} />} />

      {/* Inventory */}
      <Route path="/inventory"             element={<Navigate to="/inventory/dashboard" replace />} />
      <Route path="/inventory/dashboard"   element={<P element={<InventorySubPage tab="dashboard" />} />} />
      <Route path="/inventory/stock"       element={<P element={<InventorySubPage tab="stock" />} />} />
      <Route path="/inventory/warehouses"  element={<P element={<InventorySubPage tab="warehouses" />} />} />
      <Route path="/inventory/movement"    element={<P element={<InventorySubPage tab="movement" />} />} />
      <Route path="/inventory/picking"     element={<P element={<InventorySubPage tab="picking" />} />} />
      <Route path="/inventory/packing"     element={<P element={<InventorySubPage tab="packing" />} />} />
      <Route path="/inventory/batch"       element={<P element={<InventorySubPage tab="batch" />} />} />
      <Route path="/inventory/ageing"      element={<P element={<InventorySubPage tab="ageing" />} />} />
      <Route path="/inventory/defective"   element={<P element={<InventorySubPage tab="defective" />} />} />

      {/* Production */}
      <Route path="/production"             element={<Navigate to="/production/bom" replace />} />
      <Route path="/production/bom"         element={<P element={<ProductionSubPage tab="bom" />} />} />
      <Route path="/production/workorders"  element={<P element={<ProductionSubPage tab="workorders" />} />} />
      <Route path="/production/planning"    element={<P element={<ProductionSubPage tab="planning" />} />} />
      <Route path="/production/scheduling"  element={<P element={<ProductionSubPage tab="scheduling" />} />} />
      <Route path="/production/tracking"    element={<P element={<ProductionSubPage tab="tracking" />} />} />
      <Route path="/production/efficiency"  element={<P element={<ProductionSubPage tab="efficiency" />} />} />
      <Route path="/production/wastage"     element={<P element={<ProductionSubPage tab="wastage" />} />} />

      {/* OEM & Orders — single pages */}
      <Route path="/oem"    element={<P element={<OEMPage />} />} />
      <Route path="/orders" element={<P element={<OrdersPage />} />} />

      {/* Bulk Orders */}
      <Route path="/bulk"             element={<Navigate to="/bulk/clients" replace />} />
      <Route path="/bulk/clients"     element={<P element={<BulkSubPage tab="clients" />} />} />
      <Route path="/bulk/quotations"  element={<P element={<BulkSubPage tab="quotations" />} />} />
      <Route path="/bulk/packaging"   element={<P element={<BulkSubPage tab="packaging" />} />} />
      <Route path="/bulk/delivery"    element={<P element={<BulkSubPage tab="delivery" />} />} />

      {/* Logistics */}
      <Route path="/logistics"           element={<Navigate to="/logistics/dispatch" replace />} />
      <Route path="/logistics/dispatch"  element={<P element={<LogisticsSubPage tab="dispatch" />} />} />
      <Route path="/logistics/vehicles"  element={<P element={<LogisticsSubPage tab="vehicles" />} />} />
      <Route path="/logistics/tracking"  element={<P element={<LogisticsSubPage tab="tracking" />} />} />
      <Route path="/logistics/dc"        element={<P element={<LogisticsSubPage tab="dc" />} />} />
      <Route path="/logistics/pendency"  element={<P element={<LogisticsSubPage tab="pendency" />} />} />
      <Route path="/logistics/courier"   element={<P element={<LogisticsSubPage tab="courier" />} />} />

      {/* Returns */}
      <Route path="/returns"           element={<Navigate to="/returns/requests" replace />} />
      <Route path="/returns/requests"  element={<P element={<ReturnsSubPage tab="requests" />} />} />
      <Route path="/returns/docket"    element={<P element={<ReturnsSubPage tab="docket" />} />} />
      <Route path="/returns/matching"  element={<P element={<ReturnsSubPage tab="matching" />} />} />
      <Route path="/returns/loss"      element={<P element={<ReturnsSubPage tab="loss" />} />} />

      {/* Finance */}
      <Route path="/finance"           element={<Navigate to="/finance/ledger" replace />} />
      <Route path="/finance/ledger"    element={<P element={<FinanceSubPage tab="ledger" />} />} />
      <Route path="/finance/brs"       element={<P element={<FinanceSubPage tab="brs" />} />} />
      <Route path="/finance/payments"  element={<P element={<FinanceSubPage tab="payments" />} />} />
      <Route path="/finance/notes"     element={<P element={<FinanceSubPage tab="notes" />} />} />
      <Route path="/finance/matching"  element={<P element={<FinanceSubPage tab="matching" />} />} />

      {/* Forecasting */}
      <Route path="/forecasting"            element={<Navigate to="/forecasting/demand" replace />} />
      <Route path="/forecasting/demand"     element={<P element={<ForecastingSubPage tab="demand" />} />} />
      <Route path="/forecasting/planning"   element={<P element={<ForecastingSubPage tab="planning" />} />} />
      <Route path="/forecasting/inventory"  element={<P element={<ForecastingSubPage tab="inventory" />} />} />

      {/* Reports */}
      <Route path="/reports"            element={<Navigate to="/reports/sales" replace />} />
      <Route path="/reports/sales"      element={<P element={<ReportsSubPage tab="sales" />} />} />
      <Route path="/reports/pl"         element={<P element={<ReportsSubPage tab="pl" />} />} />
      <Route path="/reports/turnover"   element={<P element={<ReportsSubPage tab="turnover" />} />} />
      <Route path="/reports/stock"      element={<P element={<ReportsSubPage tab="stock" />} />} />
      <Route path="/reports/purchase"   element={<P element={<ReportsSubPage tab="purchase" />} />} />
      <Route path="/reports/production" element={<P element={<ReportsSubPage tab="production" />} />} />
      <Route path="/reports/returns"    element={<P element={<ReportsSubPage tab="returns" />} />} />

      {/* Assets */}
      <Route path="/assets"             element={<Navigate to="/assets/register" replace />} />
      <Route path="/assets/register"    element={<P element={<AssetsSubPage tab="register" />} />} />
      <Route path="/assets/maintenance" element={<P element={<AssetsSubPage tab="maintenance" />} />} />
      <Route path="/assets/lifecycle"   element={<P element={<AssetsSubPage tab="lifecycle" />} />} />

      {/* Barcode */}
      <Route path="/barcode"          element={<Navigate to="/barcode/generate" replace />} />
      <Route path="/barcode/generate" element={<P element={<BarcodeSubPage tab="generate" />} />} />
      <Route path="/barcode/scan"     element={<P element={<BarcodeSubPage tab="scan" />} />} />
      <Route path="/barcode/logs"     element={<P element={<BarcodeSubPage tab="logs" />} />} />

      {/* Tasks */}
      <Route path="/tasks"         element={<Navigate to="/tasks/kanban" replace />} />
      <Route path="/tasks/kanban"  element={<P element={<TasksSubPage tab="kanban" />} />} />
      <Route path="/tasks/todo"    element={<P element={<TasksSubPage tab="todo" />} />} />
      <Route path="/tasks/notifs"  element={<P element={<TasksSubPage tab="notifs" />} />} />

      <Route path="/settings" element={<P element={<SettingsPage />} />} />
      <Route path="*"         element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}
