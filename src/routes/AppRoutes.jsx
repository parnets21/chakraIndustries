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
import ExcessPOMonitorPage     from '../pages/procurement/ExcessPOMonitorPage';

// Inventory
import InventorySubPage from '../pages/inventory/InventorySubPage';

// Production
import ProductionSubPage from '../pages/production/ProductionSubPage';

// Bulk Orders
import BulkSubPage from '../pages/bulk/BulkSubPage';
import ClientsESMEPage from '../pages/bulk/ClientsESMEPage';

// Logistics
import LogisticsSubPage from '../pages/logistics/LogisticsSubPage';
import RealTimeTrackingPage from '../pages/logistics/RealTimeTrackingPage';

// Returns
import ReturnsSubPage from '../pages/returns/ReturnsSubPage';
import MaterialReturnsPage from '../pages/returns/MaterialReturnsPage';

// Finance
import FinanceSubPage from '../pages/finance/FinanceSubPage';
import CreditNoteTrackingPage from '../pages/finance/CreditNoteTrackingPage';

// Tally Integration
import TallySubPage from '../pages/tally/TallySubPage';

// Forecasting
import ForecastingSubPage from '../pages/forecasting/ForecastingSubPage';

// Reports
import ReportsSubPage from '../pages/reports/ReportsSubPage';

// Assets
import AssetsSubPage from '../pages/assets/AssetsSubPage';

// Barcode
import BarcodeSubPage from '../pages/barcode/BarcodeSubPage';

// Vinculum
import VinculumSubPage from '../pages/vinculum/VinculumSubPage';

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
      <Route path="/procurement/excess"       element={<P element={<ExcessPOMonitorPage />} />} />

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
      <Route path="/inventory/storage"     element={<P element={<InventorySubPage tab="storage" />} />} />
      <Route path="/inventory/pincode"     element={<P element={<InventorySubPage tab="pincode" />} />} />

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
      <Route path="/bulk/clientsESME" element={<P element={<ClientsESMEPage />} />} />
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
      <Route path="/logistics/livetrack" element={<P element={<RealTimeTrackingPage />} />} />

      {/* Returns */}
      <Route path="/returns"           element={<Navigate to="/returns/requests" replace />} />
      <Route path="/returns/requests"  element={<P element={<ReturnsSubPage tab="requests" />} />} />
      <Route path="/returns/docket"    element={<P element={<ReturnsSubPage tab="docket" />} />} />
      <Route path="/returns/matching"  element={<P element={<ReturnsSubPage tab="matching" />} />} />
      <Route path="/returns/loss"      element={<P element={<ReturnsSubPage tab="loss" />} />} />
      <Route path="/returns/material"  element={<P element={<MaterialReturnsPage />} />} />

      {/* Finance */}
      <Route path="/finance"           element={<Navigate to="/finance/ledger" replace />} />
      <Route path="/finance/ledger"    element={<P element={<FinanceSubPage tab="ledger" />} />} />
      <Route path="/finance/brs"       element={<P element={<FinanceSubPage tab="brs" />} />} />
      <Route path="/finance/payments"  element={<P element={<FinanceSubPage tab="payments" />} />} />
      <Route path="/finance/notes"     element={<P element={<FinanceSubPage tab="notes" />} />} />
      <Route path="/finance/matching"  element={<P element={<FinanceSubPage tab="matching" />} />} />
      <Route path="/finance/cntracks"  element={<P element={<CreditNoteTrackingPage />} />} />

      {/* Forecasting */}
      <Route path="/forecasting"            element={<Navigate to="/forecasting/demand" replace />} />
      <Route path="/forecasting/demand"     element={<P element={<ForecastingSubPage tab="demand" />} />} />
      <Route path="/forecasting/planning"   element={<P element={<ForecastingSubPage tab="planning" />} />} />
      <Route path="/forecasting/inventory"  element={<P element={<ForecastingSubPage tab="inventory" />} />} />
      <Route path="/forecasting/seasonal"   element={<P element={<ForecastingSubPage tab="seasonal" />} />} />

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

      {/* Vinculum */}
      <Route path="/vinculum"          element={<Navigate to="/vinculum/config" replace />} />
      <Route path="/vinculum/config"   element={<P element={<VinculumSubPage tab="config" />} />} />
      <Route path="/vinculum/logs"     element={<P element={<VinculumSubPage tab="logs" />} />} />
      <Route path="/vinculum/sku"      element={<P element={<VinculumSubPage tab="sku" />} />} />
      <Route path="/vinculum/sync"     element={<P element={<VinculumSubPage tab="sync" />} />} />

      {/* Tasks */}
      <Route path="/tasks"           element={<Navigate to="/tasks/kanban" replace />} />
      <Route path="/tasks/kanban"    element={<P element={<TasksSubPage tab="kanban" />} />} />
      <Route path="/tasks/todo"      element={<P element={<TasksSubPage tab="todo" />} />} />
      <Route path="/tasks/recurring" element={<P element={<TasksSubPage tab="recurring" />} />} />
      <Route path="/tasks/notifs"    element={<P element={<TasksSubPage tab="notifs" />} />} />

      {/* Tally Integration */}
      <Route path="/tally"              element={<Navigate to="/tally/dashboard" replace />} />
      <Route path="/tally/dashboard"    element={<P element={<TallySubPage tab="dashboard" />} />} />
      <Route path="/tally/master"       element={<P element={<TallySubPage tab="master" />} />} />
      <Route path="/tally/transactions" element={<P element={<TallySubPage tab="transactions" />} />} />
      <Route path="/tally/logs"         element={<P element={<TallySubPage tab="logs" />} />} />
      <Route path="/tally/config"       element={<P element={<TallySubPage tab="config" />} />} />

      <Route path="/settings" element={<P element={<SettingsPage />} />} />
      <Route path="*"         element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}
