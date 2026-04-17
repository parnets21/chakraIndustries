import TallyPage from './TallyPage';

const TAB_MAP = {
  dashboard: 0,
  master: 1,
  transactions: 2,
  logs: 3,
  config: 4,
};

export default function TallySubPage({ tab }) {
  const initialTab = TAB_MAP[tab] ?? 0;
  return <TallyPage initialTab={initialTab} />;
}
