import FinancePage from './FinancePage';
const TAB_MAP = { ledger: 0, brs: 1, payments: 2, notes: 3, matching: 4 };
export default function FinanceSubPage({ tab }) {
  return <FinancePage initialTab={TAB_MAP[tab] ?? 0} />;
}
