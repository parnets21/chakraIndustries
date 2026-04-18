import ForecastingPage from './ForecastingPage';
const TAB_MAP = { demand: 0, planning: 1, inventory: 2 };
export default function ForecastingSubPage({ tab }) {
  return <ForecastingPage initialTab={TAB_MAP[tab] ?? 0} />;
}
