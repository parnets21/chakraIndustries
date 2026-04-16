import AssetsPage from './AssetsPage';
const TAB_MAP = { register: 0, maintenance: 1, lifecycle: 2 };
export default function AssetsSubPage({ tab }) {
  return <AssetsPage initialTab={TAB_MAP[tab] ?? 0} />;
}
