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
};

export default function InventorySubPage({ tab }) {
  return <InventoryPage initialTab={TAB_MAP[tab] ?? 0} />;
}
