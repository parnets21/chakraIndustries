import FinancePage from './FinancePage';
const TAB_MAP = {
  dashboard: 0,
  'accounts-payable': 1,
  'accounts-receivable': 2,
  'supplier-payments': 3,
  'dealer-receipts': 4,
  'supplier-ledger': 5,
  'dealer-ledger': 6,
  'outstanding-invoices': 7,
  'bank-cash-accounts': 8,
  'payment-history': 9,
  'financial-reports': 10
};
export default function FinanceSubPage({ tab }) {
  const t = TAB_MAP[tab] ?? 0; return <FinancePage key={t} initialTab={t} />;
}
