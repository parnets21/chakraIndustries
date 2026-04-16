import ReturnsPage from './ReturnsPage';
const TAB_MAP = { requests: 0, docket: 1, matching: 2, loss: 3 };
export default function ReturnsSubPage({ tab }) {
  return <ReturnsPage initialTab={TAB_MAP[tab] ?? 0} />;
}
