import ReturnsPage from './ReturnsPage';
const TAB_MAP = { requests: 0, tracker: 1, docket: 2, matching: 3, loss: 4 };
export default function ReturnsSubPage({ tab }) {
  const t = TAB_MAP[tab] ?? 0; return <ReturnsPage key={t} initialTab={t} />;
}