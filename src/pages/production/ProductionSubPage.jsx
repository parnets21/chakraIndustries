import ProductionPage from './ProductionPage';
const TAB_MAP = { bom: 0, workorders: 1, planning: 2, scheduling: 3, tracking: 4, efficiency: 5, wastage: 6 };
export default function ProductionSubPage({ tab }) {
  return <ProductionPage initialTab={TAB_MAP[tab] ?? 0} />;
}
