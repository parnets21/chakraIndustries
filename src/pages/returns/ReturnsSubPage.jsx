import ReturnsPage from './ReturnsPage';
const TAB_MAP = { requests: 0, docket: 1, matching: 2, loss: 3 };
export default function ReturnsSubPage({ tab }) {
  const t = TAB_MAP[tab] ?? 0; return <ReturnsPage key={t} initialTab={t} />;
}
