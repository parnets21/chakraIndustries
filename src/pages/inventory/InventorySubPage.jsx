// Thin wrapper — renders InventoryPage with a specific tab pre-selected
import InventoryPage from './InventoryPage';

const TAB_MAP = {
  dashboard:  0,
  stock:      1,
  warehouses: 2,
  movement:   3,
  picking:    4,
  packing:    5,
  batch:      6,
  ageing:     7,
  defective:  8,
  storage:    9,
  pincode:    10,
};

export default function InventorySubPage({ tab }) {
  const tabIndex = TAB_MAP[tab] ?? 0;
  // key forces a remount when the tab changes so useState(initialTab) re-initialises
  return <InventoryPage key={tabIndex} initialTab={tabIndex} />;
}
