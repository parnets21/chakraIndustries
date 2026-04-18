import LogisticsPage from './LogisticsPage';
const TAB_MAP = { dispatch: 0, vehicles: 1, tracking: 2, dc: 3, pendency: 4, courier: 5 };
export default function LogisticsSubPage({ tab }) {
  return <LogisticsPage initialTab={TAB_MAP[tab] ?? 0} />;
}
