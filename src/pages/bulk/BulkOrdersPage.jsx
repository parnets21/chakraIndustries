import { useState } from 'react';
import StatusBadge from '../../components/common/StatusBadge';
import DataTable from '../../components/tables/DataTable';
import Modal from '../../components/common/Modal';

const corporateClients = [
  { id: 'CC-001', name: 'Tata Motors Ltd', contact: 'Rajesh Mehta', phone: '9876543210', city: 'Mumbai', tier: 'Platinum', creditLimit: '₹50,00,000', outstanding: '₹12,40,000', status: 'Active' },
  { id: 'CC-002', name: 'Mahindra & Mahindra', contact: 'Suresh Nair', phone: '9812345678', city: 'Pune', tier: 'Gold', creditLimit: '₹30,00,000', outstanding: '₹8,20,000', status: 'Active' },
  { id: 'CC-003', name: 'Bajaj Auto Ltd', contact: 'Anil Sharma', phone: '9823456789', city: 'Aurangabad', tier: 'Platinum', creditLimit: '₹45,00,000', outstanding: '₹18,60,000', status: 'Active' },
  { id: 'CC-004', name: 'Hero MotoCorp', contact: 'Vijay Rao', phone: '9834567890', city: 'Delhi', tier: 'Gold', creditLimit: '₹25,00,000', outstanding: '₹5,80,000', status: 'Active' },
  { id: 'CC-005', name: 'TVS Motor Company', contact: 'Pradeep Kumar', phone: '9845678901', city: 'Chennai', tier: 'Silver', creditLimit: '₹15,00,000', outstanding: '₹3,20,000', status: 'Active' },
  { id: 'CC-006', name: 'Ashok Leyland', contact: 'Ramesh Das', phone: '9856789012', city: 'Chennai', tier: 'Gold', creditLimit: '₹35,00,000', outstanding: '₹0', status: 'Inactive' },
];

const bulkQuotations = [
  { id: 'BQ-2024-018', client: 'Tata Motors Ltd', items: 12, qty: 5000, value: '₹42,00,000', packaging: 'Custom Branded', validity: '30 Apr', status: 'Sent' },
  { id: 'BQ-2024-017', client: 'Bajaj Auto Ltd', items: 8, qty: 3200, value: '₹28,50,000', packaging: 'Standard', validity: '25 Apr', status: 'Approved' },
  { id: 'BQ-2024-016', client: 'Mahindra & Mahindra', items: 15, qty: 4800, value: '₹36,80,000', packaging: 'Custom Branded', validity: '20 Apr', status: 'Draft' },
  { id: 'BQ-2024-015', client: 'Hero MotoCorp', items: 6, qty: 2000, value: '₹14,20,000', packaging: 'Bulk Loose', validity: '18 Apr', status: 'Expired' },
];

const quotationItems = [
  { item: 'Bearing 6205', sku: 'SKU-1042', qty: 1000, unitPrice: 420, discount: 8, total: 386400 },
  { item: 'Oil Seal 35x52', sku: 'SKU-2187', qty: 800, unitPrice: 115, discount: 10, total: 82800 },
  { item: 'Gasket Set A', sku: 'SKU-0934', qty: 500, unitPrice: 650, discount: 5, total: 308750 },
];

const packagingOptions = [
  { id: 'PKG-01', name: 'Standard Box', description: 'Plain corrugated box with product label', moq: 100, extraCost: '₹0', leadTime: '0 days' },
  { id: 'PKG-02', name: 'Custom Branded', description: 'Client logo & branding on box', moq: 500, extraCost: '₹12/unit', leadTime: '5 days' },
  { id: 'PKG-03', name: 'Bulk Loose', description: 'No individual packaging, bulk pallet', moq: 1000, extraCost: '-₹5/unit', leadTime: '0 days' },
  { id: 'PKG-04', name: 'Premium Gift Box', description: 'Premium finish with foam insert', moq: 200, extraCost: '₹45/unit', leadTime: '7 days' },
];

const tierColor = { Platinum: '#8b5cf6', Gold: '#f59e0b', Silver: '#6b7280' };

const inputCls = "w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none bg-white text-gray-800 focus:border-red-500 focus:ring-2 focus:ring-red-100 placeholder:text-gray-400 font-[inherit]";
const selectCls = "w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none bg-white text-gray-800 focus:border-red-500 focus:ring-2 focus:ring-red-100 font-[inherit]";
const labelCls = "text-xs font-semibold text-gray-600";
const fieldCls = "flex flex-col gap-1.5 mb-4";
const thCls = "bg-gray-50 px-4 py-2.5 text-left text-[10.5px] font-bold text-gray-400 uppercase tracking-wide border-b border-gray-200 whitespace-nowrap";
const tdCls = "px-4 py-3 text-gray-800 align-middle";
const trCls = "border-b border-gray-50 last:border-0 hover:bg-red-50/40 transition-colors";
const btnPrimary = "inline-flex items-center gap-1.5 px-4 py-2 bg-gradient-to-br from-red-400 to-red-700 text-white rounded-xl text-sm font-semibold shadow-md hover:-translate-y-px transition-all border-0 cursor-pointer font-[inherit]";
const btnOutline = "inline-flex items-center gap-1.5 px-4 py-2 border border-red-600 text-red-700 bg-transparent rounded-xl text-sm font-semibold hover:bg-red-700 hover:text-white transition-all cursor-pointer font-[inherit]";
const btnSm = "inline-flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg";

export default function BulkOrdersPage({ initialTab = 0 }) {
  const [activeTab, setActiveTab] = useState(initialTab);
  const [showClientModal, setShowClientModal] = useState(false);
  const [showQuoteModal, setShowQuoteModal] = useState(false);
  const [selectedPkg, setSelectedPkg] = useState('PKG-02');

  const subtotal = quotationItems.reduce((s, i) => s + i.total, 0);
  const gst = Math.round(subtotal * 0.18);
  const grand = subtotal + gst;

  const kpis = [
    { label: 'Corporate Clients', value: corporateClients.filter(c => c.status === 'Active').length, color: '#8b5cf6' },
    { label: 'Active Quotations', value: bulkQuotations.filter(q => q.status === 'Sent').length, color: '#f59e0b' },
    { label: 'Approved Quotes', value: bulkQuotations.filter(q => q.status === 'Approved').length, color: '#10b981' },
    { label: 'Total Pipeline', value: '₹1.21Cr', color: '#c0392b' },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
        <div>
          <div className="text-xl font-black text-gray-900 tracking-tight">Bulk & Corporate Orders</div>
          <div className="flex items-center gap-1 mt-0.5">
            <span className="text-xs text-gray-400">Home</span>
            <span className="text-xs text-gray-400">›</span>
            <span className="text-xs text-red-600 font-semibold">Bulk Orders</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button className={btnOutline} onClick={() => setShowClientModal(true)}>+ Add Client</button>
          <button className={btnPrimary} onClick={() => setShowQuoteModal(true)}>+ New Quotation</button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-5">
        {kpis.map((k, i) => (
          <div key={i} className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm hover:-translate-y-1 hover:shadow-lg transition-all">
            <div className="text-2xl font-black tracking-tight" style={{ color: k.color }}>{k.value}</div>
            <div className="text-xs text-gray-500 font-medium mt-1">{k.label}</div>
          </div>
        ))}
      </div>

      <div className="flex border-b-2 border-gray-200 mb-5 overflow-x-auto">
        {['Corporate Clients', 'Bulk Quotations', 'Packaging Options', 'Delivery Scheduling'].map((t, i) => (
          <button key={i} onClick={() => setActiveTab(i)}
            className={`px-5 py-2.5 text-sm font-semibold whitespace-nowrap border-b-2 -mb-0.5 cursor-pointer flex-shrink-0 bg-transparent font-[inherit] ${activeTab === i ? 'text-red-700 border-red-600' : 'text-gray-400 border-transparent hover:text-red-600'}`}>
            {t}
          </button>
        ))}
      </div>

      {activeTab === 0 && (
        <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
          <DataTable
            columns={[
              { key: 'id', label: 'Client ID', render: v => <span className="font-semibold text-red-700">{v}</span> },
              { key: 'name', label: 'Company', render: v => <span className="font-bold">{v}</span> },
              { key: 'contact', label: 'Contact' },
              { key: 'city', label: 'City' },
              { key: 'tier', label: 'Tier', render: v => (
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold" style={{ background: (tierColor[v] || '#6b7280') + '20', color: tierColor[v] || '#6b7280' }}>{v}</span>
              )},
              { key: 'creditLimit', label: 'Credit Limit', render: v => <span className="font-semibold">{v}</span> },
              { key: 'outstanding', label: 'Outstanding', render: v => <span className={`font-bold ${v === '₹0' ? 'text-green-600' : 'text-red-500'}`}>{v}</span> },
              { key: 'status', label: 'Status', render: v => <StatusBadge status={v} /> },
              { key: 'id', label: 'Actions', render: () => (
                <div className="flex gap-1.5">
                  <button className={`${btnSm} border border-red-600 text-red-700 bg-transparent font-semibold cursor-pointer font-[inherit]`}>View</button>
                  <button className={`${btnSm} bg-gradient-to-br from-red-400 to-red-700 text-white font-semibold border-0 cursor-pointer font-[inherit]`}>Quote</button>
                </div>
              )},
            ]}
            data={corporateClients}
          />
        </div>
      )}

      {activeTab === 1 && (
        <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
          <DataTable
            columns={[
              { key: 'id', label: 'Quote ID', render: v => <span className="font-semibold text-red-700">{v}</span> },
              { key: 'client', label: 'Client', render: v => <span className="font-semibold">{v}</span> },
              { key: 'items', label: 'SKUs' },
              { key: 'qty', label: 'Total Qty', render: v => <span className="font-bold">{v.toLocaleString()}</span> },
              { key: 'value', label: 'Value', render: v => <span className="font-bold text-red-700">{v}</span> },
              { key: 'packaging', label: 'Packaging' },
              { key: 'validity', label: 'Valid Till' },
              { key: 'status', label: 'Status', render: v => <StatusBadge status={v} /> },
              { key: 'id', label: 'Actions', render: () => (
                <div className="flex gap-1.5">
                  <button className={`${btnSm} border border-red-600 text-red-700 bg-transparent font-semibold cursor-pointer font-[inherit]`}>View</button>
                  <button className={`${btnSm} bg-gray-100 text-gray-800 font-semibold border-0 cursor-pointer font-[inherit]`}>Convert to PO</button>
                </div>
              )},
            ]}
            data={bulkQuotations}
          />
        </div>
      )}

      {activeTab === 2 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex flex-col gap-3.5">
            {packagingOptions.map(pkg => (
              <div key={pkg.id} onClick={() => setSelectedPkg(pkg.id)}
                className={`p-4 rounded-xl cursor-pointer border-2 transition-all ${selectedPkg === pkg.id ? 'border-red-600 bg-red-50' : 'border-gray-200 bg-white'}`}>
                <div className="flex justify-between items-center mb-1.5">
                  <div className="font-bold text-sm text-gray-800">{pkg.name}</div>
                  <span className={`font-bold text-[13px] ${pkg.extraCost.startsWith('-') ? 'text-green-600' : pkg.extraCost === '₹0' ? 'text-gray-400' : 'text-red-700'}`}>{pkg.extraCost}</span>
                </div>
                <div className="text-xs text-gray-400 mb-2">{pkg.description}</div>
                <div className="flex gap-4 text-[11px]">
                  <span className="text-gray-400">MOQ: <strong className="text-gray-800">{pkg.moq.toLocaleString()} units</strong></span>
                  <span className="text-gray-400">Lead Time: <strong className="text-gray-800">{pkg.leadTime}</strong></span>
                </div>
              </div>
            ))}
          </div>
          <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
            <div className="text-sm font-bold text-gray-800 mb-4">Packaging Preview</div>
            <div className="bg-gray-50 rounded-xl p-6 text-center mb-4">
              <div className="text-6xl mb-2">📦</div>
              <div className="font-bold text-[15px] text-gray-800">{packagingOptions.find(p => p.id === selectedPkg)?.name}</div>
              <div className="text-xs text-gray-400 mt-1">{packagingOptions.find(p => p.id === selectedPkg)?.description}</div>
            </div>
            <div className="flex flex-col gap-2">
              {[
                ['Selected Option', packagingOptions.find(p => p.id === selectedPkg)?.name],
                ['Extra Cost per Unit', packagingOptions.find(p => p.id === selectedPkg)?.extraCost],
                ['Minimum Order Qty', (packagingOptions.find(p => p.id === selectedPkg)?.moq.toLocaleString()) + ' units'],
                ['Lead Time', packagingOptions.find(p => p.id === selectedPkg)?.leadTime],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between py-2 border-b border-gray-50 text-[13px]">
                  <span className="text-gray-400">{k}</span>
                  <span className="font-bold text-gray-800">{v}</span>
                </div>
              ))}
            </div>
            <button className={`${btnPrimary} mt-4 w-full justify-center`}>Apply to Quotation</button>
          </div>
        </div>
      )}

      {activeTab === 3 && (
        <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="text-sm font-bold text-gray-800">Delivery Scheduling</div>
              <div className="text-xs text-gray-400 mt-0.5">Plan and schedule bulk order deliveries</div>
            </div>
            <button className={btnPrimary}>+ Schedule Delivery</button>
          </div>
          <div className="overflow-x-auto rounded-xl border border-gray-200">
            <table className="w-full">
              <thead><tr>{['Quote ID','Client','Items','Qty','Delivery Date','Slot','Warehouse','Vehicle','Status'].map(h => <th key={h} className={thCls}>{h}</th>)}</tr></thead>
              <tbody>
                {[
                  { id: 'BQ-2024-017', client: 'Bajaj Auto Ltd', items: 8, qty: 3200, date: '20 Apr', slot: '10:00–12:00', wh: 'WH-01', vehicle: 'MH-12-AB-1234', status: 'Confirmed' },
                  { id: 'BQ-2024-018', client: 'Tata Motors Ltd', items: 12, qty: 5000, date: '22 Apr', slot: '02:00–04:00', wh: 'WH-03', vehicle: 'Pending', status: 'Pending' },
                  { id: 'BQ-2024-016', client: 'Mahindra & Mahindra', items: 15, qty: 4800, date: '25 Apr', slot: '09:00–11:00', wh: 'WH-01', vehicle: 'Pending', status: 'Draft' },
                ].map((r, i) => (
                  <tr key={i} className={trCls}>
                    <td className={`${tdCls} font-semibold text-red-700`}>{r.id}</td>
                    <td className={`${tdCls} font-semibold`}>{r.client}</td>
                    <td className={tdCls}>{r.items}</td>
                    <td className={`${tdCls} font-bold`}>{r.qty.toLocaleString()}</td>
                    <td className={tdCls}>{r.date}</td>
                    <td className={tdCls}>{r.slot}</td>
                    <td className={tdCls}>{r.wh}</td>
                    <td className={`${tdCls} ${r.vehicle === 'Pending' ? 'text-amber-500 font-semibold' : 'font-mono text-xs'}`}>{r.vehicle}</td>
                    <td className={tdCls}><StatusBadge status={r.status} type={r.status === 'Confirmed' ? 'success' : r.status === 'Pending' ? 'warning' : 'info'} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add Client Modal */}
      <Modal open={showClientModal} onClose={() => setShowClientModal(false)} title="Add Corporate Client"
        footer={<>
          <button className={btnOutline} onClick={() => setShowClientModal(false)}>Cancel</button>
          <button className={btnPrimary} onClick={() => setShowClientModal(false)}>Save Client</button>
        </>}>
        <div className="grid grid-cols-2 gap-4">
          <div className={fieldCls}><label className={labelCls}>Company Name *</label><input className={inputCls} placeholder="e.g. Maruti Suzuki" /></div>
          <div className={fieldCls}><label className={labelCls}>Contact Person *</label><input className={inputCls} placeholder="Name" /></div>
          <div className={fieldCls}><label className={labelCls}>Phone</label><input className={inputCls} placeholder="10-digit number" /></div>
          <div className={fieldCls}><label className={labelCls}>Email</label><input type="email" className={inputCls} placeholder="email@company.com" /></div>
          <div className={fieldCls}><label className={labelCls}>City</label><input className={inputCls} placeholder="City" /></div>
          <div className={fieldCls}><label className={labelCls}>Client Tier</label><select className={selectCls}><option>Silver</option><option>Gold</option><option>Platinum</option></select></div>
          <div className={fieldCls}><label className={labelCls}>Credit Limit (₹)</label><input type="number" className={inputCls} placeholder="0" /></div>
          <div className={fieldCls}><label className={labelCls}>GST Number</label><input className={inputCls} placeholder="GSTIN" /></div>
          <div className={`${fieldCls} col-span-2`}><label className={labelCls}>Address</label><textarea className={inputCls} placeholder="Full address..." /></div>
        </div>
      </Modal>

      {/* Bulk Quotation Modal */}
      <Modal open={showQuoteModal} onClose={() => setShowQuoteModal(false)} title="Generate Bulk Quotation" size="lg"
        footer={<>
          <button className={btnOutline} onClick={() => setShowQuoteModal(false)}>Save Draft</button>
          <button className={btnPrimary} onClick={() => setShowQuoteModal(false)}>Send Quotation</button>
        </>}>
        <div className="grid grid-cols-2 gap-4 mb-5">
          <div className={fieldCls}><label className={labelCls}>Corporate Client *</label>
            <select className={selectCls}>{corporateClients.filter(c => c.status === 'Active').map(c => <option key={c.id}>{c.name}</option>)}</select>
          </div>
          <div className={fieldCls}><label className={labelCls}>Validity Date</label><input type="date" className={inputCls} /></div>
          <div className={fieldCls}><label className={labelCls}>Packaging Option</label>
            <select className={selectCls}>{packagingOptions.map(p => <option key={p.id}>{p.name}</option>)}</select>
          </div>
          <div className={fieldCls}><label className={labelCls}>Payment Terms</label>
            <select className={selectCls}><option>Net 30</option><option>Net 45</option><option>Net 60</option><option>Advance</option></select>
          </div>
        </div>
        <div className="font-bold text-[13px] text-gray-800 mb-2.5">Line Items</div>
        <div className="overflow-x-auto rounded-xl border border-gray-200 mb-4">
          <table className="w-full">
            <thead><tr>{['Item','SKU','Qty','Unit Price (₹)','Discount %','Total (₹)'].map(h => <th key={h} className={thCls}>{h}</th>)}</tr></thead>
            <tbody>
              {quotationItems.map((item, i) => (
                <tr key={i} className={trCls}>
                  <td className={`${tdCls} font-semibold`}>{item.item}</td>
                  <td className={`${tdCls} font-mono text-xs text-red-700`}>{item.sku}</td>
                  <td className={tdCls}><input type="number" className="w-20 px-2 py-1.5 border border-gray-200 rounded-lg text-sm outline-none bg-white text-gray-800 focus:border-red-500 font-[inherit]" defaultValue={item.qty} /></td>
                  <td className={tdCls}><input type="number" className="w-24 px-2 py-1.5 border border-gray-200 rounded-lg text-sm outline-none bg-white text-gray-800 focus:border-red-500 font-[inherit]" defaultValue={item.unitPrice} /></td>
                  <td className={tdCls}><input type="number" className="w-16 px-2 py-1.5 border border-gray-200 rounded-lg text-sm outline-none bg-white text-gray-800 focus:border-red-500 font-[inherit]" defaultValue={item.discount} /></td>
                  <td className={`${tdCls} font-bold`}>₹{item.total.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="bg-gray-50 rounded-lg p-4 max-w-[300px] ml-auto">
          <div className="flex justify-between mb-2 text-[13px]"><span className="text-gray-600">Subtotal</span><span className="font-semibold text-gray-800">₹{subtotal.toLocaleString()}</span></div>
          <div className="flex justify-between mb-2 text-[13px]"><span className="text-gray-600">GST (18%)</span><span className="font-semibold text-gray-800">₹{gst.toLocaleString()}</span></div>
          <div className="flex justify-between pt-2 border-t border-gray-200 text-[15px] font-extrabold text-red-700"><span>Grand Total</span><span>₹{grand.toLocaleString()}</span></div>
        </div>
      </Modal>
    </div>
  );
}
