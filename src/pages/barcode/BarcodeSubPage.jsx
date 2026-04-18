import BarcodePage from './BarcodePage';
const TAB_MAP = { generate: 0, scan: 1, logs: 2 };
export default function BarcodeSubPage({ tab }) {
  return <BarcodePage initialTab={TAB_MAP[tab] ?? 0} />;
}
