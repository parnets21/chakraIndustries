import BulkOrdersPage from './BulkOrdersPage';
const TAB_MAP = { clients: 0, quotations: 1, packaging: 2, delivery: 3 };
export default function BulkSubPage({ tab }) {
  return <BulkOrdersPage initialTab={TAB_MAP[tab] ?? 0} />;
}
