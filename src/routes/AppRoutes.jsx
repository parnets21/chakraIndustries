import DashboardPage   from '../pages/dashboard/DashboardPage';
import ProcurementPage from '../pages/procurement/ProcurementPage';
import InventoryPage   from '../pages/inventory/InventoryPage';
import ProductionPage  from '../pages/production/ProductionPage';
import OEMPage         from '../pages/oem/OEMPage';
import OrdersPage      from '../pages/orders/OrdersPage';
import LogisticsPage   from '../pages/logistics/LogisticsPage';
import ReturnsPage     from '../pages/returns/ReturnsPage';
import FinancePage     from '../pages/finance/FinancePage';
import ForecastingPage from '../pages/forecasting/ForecastingPage';
import AssetsPage      from '../pages/assets/AssetsPage';
import BarcodePage     from '../pages/barcode/BarcodePage';
import TasksPage       from '../pages/tasks/TasksPage';
import ReportsPage     from '../pages/reports/ReportsPage';
import SettingsPage    from '../pages/settings/SettingsPage';

export default function AppRoutes({ activePage, activeModal, openModal, closeModal }) {
  const props = { activeModal, openModal, closeModal };

  switch (activePage) {
    case 'procurement': return <ProcurementPage {...props} />;
    case 'inventory':   return <InventoryPage   {...props} />;
    case 'production':  return <ProductionPage  {...props} />;
    case 'oem':         return <OEMPage         {...props} />;
    case 'orders':      return <OrdersPage      {...props} />;
    case 'logistics':   return <LogisticsPage   {...props} />;
    case 'returns':     return <ReturnsPage     {...props} />;
    case 'finance':     return <FinancePage     {...props} />;
    case 'forecasting': return <ForecastingPage {...props} />;
    case 'assets':      return <AssetsPage      {...props} />;
    case 'barcode':     return <BarcodePage     {...props} />;
    case 'tasks':       return <TasksPage       {...props} />;
    case 'reports':     return <ReportsPage     {...props} />;
    case 'settings':    return <SettingsPage    {...props} />;
    default:            return <DashboardPage   {...props} />;
  }
}
