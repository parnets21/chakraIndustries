import { useState, useEffect } from 'react';
import StatusBadge from '../../components/common/StatusBadge';
import DataTable from '../../components/tables/DataTable';
import Modal from '../../components/common/Modal';
import { toast } from '../../components/common/Toast';
import inventoryApi from '../../api/inventoryApi';

const tabs = ['Dispatch Dashboard', 'Vehicle Allocation', 'Delivery Tracking', 'DC Regularization', 'Pendency', 'Courier & POD'];

// Hardcoded data for vehicles (can be replaced with API later)
const vehicles = [
  { id: 'VH-001', type: 'Truck', number: 'MH-12-AB-1234', driver: 'Ramesh Patil', capacity: '5 Ton', status: 'Available' },
  { id: 'VH-002', type: 'Mini Truck', number: 'MH-12-CD-5678', driver: 'Suresh Kumar', capacity: '2 Ton', status: 'In Transit' },
  { id: 'VH-003', type: 'Tempo', number: 'MH-14-EF-9012', driver: 'Anil Rao', capacity: '1 Ton', status: 'Available' },
  { id: 'VH-004', type: 'Truck', number: 'MH-15-GH-3456', driver: 'Vijay Singh', capacity: '8 Ton', status: 'Maintenance' },
];

const allocations = [
  { order: 'ORD-2024-085', driver: 'Suresh Kumar', vehicle: 'MH-12-CD-5678', destination: 'Chennai', status: 'In Transit', eta: '16 Apr' },
  { order: 'ORD-2024-080', driver: 'Ramesh Patil', vehicle: 'MH-12-AB-1234', destination: 'Pune', status: 'Delivered', eta: '13 Apr' },
];

const deliveryTimeline = [
  { event: 'Order Dispatched', time: '14 Apr, 09:00 AM', location: 'Nashik Plant', status: 'success' },
  { event: 'In Transit — Nashik to Pune', time: '14 Apr, 11:30 AM', location: 'NH-60, Igatpuri', status: 'success' },
  { event: 'Reached Hub', time: '14 Apr, 03:00 PM', location: 'Pune Distribution Hub', status: 'success' },
  { event: 'Out for Delivery', time: '15 Apr, 08:00 AM', location: 'Pune City', status: 'warning' },
  { event: 'Delivered', time: 'Expected: 15 Apr, 02:00 PM', location: 'Customer Warehouse', status: 'gray' },
];

const dcEntries = [
  { id: 'DC-2024-041', order: 'ORD-2024-085', customer: 'TVS Motor', dcDate: '14 Apr', invoiceNo: 'INV-2024-089', invoiceDate: '14 Apr', value: '₹3,24,000', status: 'Regularized' },
  { id: 'DC-2024-040', order: 'ORD-2024-082', customer: 'Ashok Leyland', dcDate: '13 Apr', invoiceNo: '', invoiceDate: '', value: '₹6,80,000', status: 'Pending' },
  { id: 'DC-2024-039', order: 'ORD-2024-079', customer: 'Force Motors', dcDate: '12 Apr', invoiceNo: 'INV-2024-087', invoiceDate: '13 Apr', value: '₹1,40,000', status: 'Regularized' },
  { id: 'DC-2024-038', order: 'ORD-2024-076', customer: 'Eicher Motors', dcDate: '11 Apr', invoiceNo: '', invoiceDate: '', value: '₹2,10,000', status: 'Overdue' },
];

const pendencyData = [
  { id: 'ORD-2024-087', customer: 'Bajaj Auto', items: 24, dispatched: 18, pending: 6, value: '₹1,03,000', daysOld: 2, reason: 'Stock shortage' },
  { id: 'ORD-2024-083', customer: 'Eicher Motors', items: 15, dispatched: 10, pending: 5, value: '₹70,000', daysOld: 5, reason: 'Vehicle unavailable' },
  { id: 'ORD-2024-078', customer: 'Force Motors', items: 8, dispatched: 0, pending: 8, value: '₹1,12,000', daysOld: 7, reason: 'Payment hold' },
];

const courierShipments = [
  { id: 'SHP-001', courier: 'BlueDart', awb: 'BD123456789', order: 'ORD-2024-089', customer: 'Tata Motors', destination: 'Mumbai', status: 'In Transit', eta: '16 Apr', pod: false },
  { id: 'SHP-002', courier: 'DTDC', awb: 'DT987654321', order: 'ORD-2024-086', customer: 'Hero MotoCorp', destination: 'Delhi', status: 'Delivered', eta: '13 Apr', pod: true },
  { id: 'SHP-003', courier: 'Delhivery', awb: 'DL456789123', order: 'ORD-2024-084', customer: 'Ashok Leyland', destination: 'Chennai', status: 'Out for Delivery', eta: '15 Apr', pod: false },
];

export default function LogisticsPage({ initialTab = 0 }) {
  const [activeTab, setActiveTab] = useState(initialTab);
  const [showModal, setShowModal] = useState(false);
  const [readyOrders, setReadyOrders] = useState([]);
  const [dispatchList, setDispatchList] = useState([]);
  const [vehicleList, setVehicleList] = useState(vehicles);
  const [shipmentList, setShipmentList] = useState(courierShipments);
  const [allocationList, setAllocationList] = useState(allocations);
  const [selectedShipmentForPOD, setSelectedShipmentForPOD] = useState(null);
  const [podFormData, setPodFormData] = useState({
    receiverName: '',
    deliveryDateTime: '',
    podImage: null,
  });
  const [shipmentFormData, setShipmentFormData] = useState({
    orderRef: '',
    customer: '',
    weight: '',
  });
  const [selectedOrderForShipment, setSelectedOrderForShipment] = useState(null);

  // Fetch movement data from backend
  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await inventoryApi.getAllMovementsData();
        const data = res.data.data || [];
        
        // Transform movement data to orders format
        const orders = data.slice(0, 3).map((m, idx) => ({
          id: `ORD-2024-${85 - idx}`,
          customer: m.from || 'Customer',
          items: m.qty || 0,
          value: `₹${(m.qty * 1000).toLocaleString()}`,
          warehouse: m.warehouse || 'WH-01',
          weight: `${m.qty * 5} kg`
        }));
        
        setReadyOrders(orders);
        setDispatchList(orders);
      } catch (err) {
        console.error('Error fetching logistics data:', err);
        // Use fallback data
        setReadyOrders([
          { id: 'ORD-2024-085', customer: 'TVS Motor', items: 18, value: '₹3,24,000', warehouse: 'WH-01', weight: '420 kg' },
          { id: 'ORD-2024-082', customer: 'Ashok Leyland', items: 30, value: '₹6,80,000', warehouse: 'WH-03', weight: '780 kg' },
          { id: 'ORD-2024-079', customer: 'Force Motors', items: 10, value: '₹1,40,000', warehouse: 'WH-01', weight: '210 kg' },
        ]);
        setDispatchList([
          { id: 'ORD-2024-085', customer: 'TVS Motor', items: 18, value: '₹3,24,000', warehouse: 'WH-01', weight: '420 kg' },
          { id: 'ORD-2024-082', customer: 'Ashok Leyland', items: 30, value: '₹6,80,000', warehouse: 'WH-03', weight: '780 kg' },
          { id: 'ORD-2024-079', customer: 'Force Motors', items: 10, value: '₹1,40,000', warehouse: 'WH-01', weight: '210 kg' },
        ]);
      }
    };
    
    fetchData();
  }, []);

  const handleSaveModal = () => {
    if (activeTab === 0) toast('Dispatch created successfully');
    else if (activeTab === 1) toast('Vehicle added successfully');
    else if (activeTab === 5) toast('Shipment created successfully');
    setShowModal(false);
  };

  const handleDispatchOrder = (orderId) => {
    setDispatchList(prev => prev.filter(o => o.id !== orderId));
    toast(`Order ${orderId} dispatched`);
  };

  const handleUpdateVehicleStatus = (id, status) => {
    setVehicleList(prev => prev.map(v => v.id === id ? { ...v, status } : v));
    toast(`Vehicle ${id} → ${status}`);
  };

  const primaryBtn = {
    display:'inline-flex', alignItems:'center', gap:6,
    padding:'8px 16px', borderRadius:10,
    background:'linear-gradient(135deg,#ef4444,#b91c1c)',
    color:'#fff', border:'none', cursor:'pointer',
    fontSize:13, fontWeight:600, fontFamily:'inherit',
    boxShadow:'0 3px 10px rgba(185,28,28,0.3)',
  };

  const kpis = [
    { label: 'Ready to Dispatch', value: readyOrders.length, color: '#f59e0b' },
    { label: 'In Transit', value: 2, color: '#3b82f6' },
    { label: 'Delivered Today', value: 5, color: '#10b981' },
    { label: 'Available Vehicles', value: vehicles.filter(v => v.status === 'Available').length, color: '#8b5cf6' },
  ];

  return (
    <div>
      {/* Action Bar */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'flex-end', gap:10, marginBottom:20, flexWrap:'wrap' }}>
        {activeTab === 0 && <button onClick={() => setShowModal(true)} style={primaryBtn}>+ New Dispatch</button>}
        {activeTab === 1 && <button onClick={() => setShowModal(true)} style={primaryBtn}>+ Add Vehicle</button>}
        {activeTab === 5 && <button onClick={() => setShowModal(true)} style={primaryBtn}>+ New Shipment</button>}
      </div>
      {/* Tab 0: Dispatch Dashboard */}
      {activeTab === 0 && (
        <div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-5">
            {kpis.map((k, i) => (
              <div key={i} className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm hover:-translate-y-1 hover:shadow-lg transition-all">
                <div className="text-2xl font-black tracking-tight" style={{ color: k.color }}>{k.value}</div>
                <div className="text-xs text-gray-500 font-medium mt-1">{k.label}</div>
              </div>
            ))}
          </div>
          <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
            <div className="text-sm font-bold text-gray-800 mb-3.5">Orders Ready for Dispatch</div>
            <DataTable
              columns={[
                { key: 'id', label: 'Order ID', render: v => <span className="font-semibold text-red-700">{v}</span> },
                { key: 'customer', label: 'Customer' },
                { key: 'items', label: 'Items' },
                { key: 'value', label: 'Value', render: v => <span className="font-bold">{v}</span> },
                { key: 'warehouse', label: 'Warehouse' },
                { key: 'weight', label: 'Weight' },
                { key: 'id', label: 'Actions', render: () => (
                  <button onClick={() => alert('🚛 Assigning vehicle...')} className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg bg-gradient-to-br from-amber-300 to-amber-500 text-white font-semibold border-0 cursor-pointer font-[inherit]">
                    Assign Vehicle
                  </button>
                )},
              ]}
              data={readyOrders}
            />
          </div>
        </div>
      )}

      {/* Tab 1: Vehicle Allocation */}
      {activeTab === 1 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
            <div className="text-sm font-bold text-gray-800 mb-3.5">Fleet Status</div>
            {vehicles.map((v, i) => (
              <div key={i} className={`flex items-center justify-between py-3 ${i < vehicles.length - 1 ? 'border-b border-gray-200' : ''}`}>
                <div className="flex gap-3 items-center">
                  <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center text-lg">🚛</div>
                  <div>
                    <div className="font-bold text-sm">{v.number}</div>
                    <div className="text-[11px] text-gray-500">{v.type} · {v.capacity} · {v.driver}</div>
                  </div>
                </div>
                <StatusBadge status={v.status} />
              </div>
            ))}
          </div>
          <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
            <div className="text-sm font-bold text-gray-800 mb-3.5">Active Allocations</div>
            <DataTable
              columns={[
                { key: 'order', label: 'Order', render: v => <span className="font-semibold text-red-700">{v}</span> },
                { key: 'driver', label: 'Driver' },
                { key: 'destination', label: 'Destination' },
                { key: 'eta', label: 'ETA' },
                { key: 'status', label: 'Status', render: v => <StatusBadge status={v} /> },
              ]}
              data={allocations}
            />
          </div>
        </div>
      )}

      {/* Tab 2: Delivery Tracking */}
      {activeTab === 2 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
            <div className="text-sm font-bold text-gray-800">Tracking — ORD-2024-085</div>
            <div className="text-xs text-gray-400 mt-0.5 mb-5">TVS Motor · Chennai</div>
            <div className="relative pl-6">
              <div className="absolute left-2.5 top-1.5 bottom-1.5 w-0.5 bg-gray-200 rounded" />
              {deliveryTimeline.map((item, i) => (
                <div key={i} className="relative mb-5 last:mb-0">
                  <div className={`absolute -left-[17px] top-1 w-3 h-3 rounded-full ring-2 ring-offset-1 ${
                    item.status === 'success' ? 'bg-green-500 ring-green-500' :
                    item.status === 'warning' ? 'bg-amber-400 ring-amber-400' :
                    'bg-gray-300 ring-gray-300'
                  }`} />
                  <div className="text-sm font-semibold text-gray-800">{item.event}</div>
                  <div className="text-xs text-gray-400 mt-0.5">{item.time}</div>
                  {item.location && <div className="text-xs text-gray-400">{item.location}</div>}
                </div>
              ))}
            </div>
          </div>
          <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
            <div className="text-sm font-bold text-gray-800 mb-3.5">Delivery Summary</div>
            {[
              ['Order ID', 'ORD-2024-085'], ['Customer', 'TVS Motor'], ['Vehicle', 'MH-12-CD-5678'],
              ['Driver', 'Suresh Kumar'], ['Origin', 'Nashik Plant'], ['Destination', 'Chennai'],
              ['Dispatched', '14 Apr, 09:00 AM'], ['Expected Delivery', '15 Apr, 02:00 PM'], ['Status', 'In Transit'],
            ].map(([k, v]) => (
              <div key={k} className="flex justify-between py-2 border-b border-gray-50 text-sm last:border-0">
                <span className="text-gray-500">{k}</span>
                <span className="font-semibold">{v}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 3: DC Regularization */}
      {activeTab === 3 && (
        <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="text-sm font-bold text-gray-800">DC to Invoice Regularization</div>
              <div className="text-xs text-gray-400 mt-0.5">Match delivery challans with invoices</div>
            </div>
            <div className="flex gap-2 items-center">
              <StatusBadge status="2 Pending" type="warning" />
              <button onClick={() => alert('✓ Regularizing all pending DCs...')} className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg bg-gradient-to-br from-red-400 to-red-700 text-white font-semibold border-0 cursor-pointer font-[inherit]">
                Regularize All
              </button>
            </div>
          </div>
          <DataTable
            columns={[
              { key: 'id', label: 'DC No.', render: v => <span className="font-semibold text-red-700">{v}</span> },
              { key: 'order', label: 'Order Ref' },
              { key: 'customer', label: 'Customer', render: v => <span className="font-semibold">{v}</span> },
              { key: 'dcDate', label: 'DC Date' },
              { key: 'invoiceNo', label: 'Invoice No.', render: v => v ? <span className="font-semibold text-green-600">{v}</span> : <span className="text-red-500 italic">Not raised</span> },
              { key: 'invoiceDate', label: 'Invoice Date', render: v => v || '—' },
              { key: 'value', label: 'Value', render: v => <span className="font-bold">{v}</span> },
              { key: 'status', label: 'Status', render: v => <StatusBadge status={v} type={v === 'Regularized' ? 'success' : v === 'Overdue' ? 'danger' : 'warning'} /> },
              { key: 'id', label: 'Action', render: (_, row) => row.status !== 'Regularized' ? (
                <button onClick={() => alert(`📄 Raising invoice for ${row.id}...`)} className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg bg-gradient-to-br from-red-400 to-red-700 text-white font-semibold border-0 cursor-pointer font-[inherit]">Raise Invoice</button>
              ) : <span className="text-green-600 text-xs">✓ Done</span> },
            ]}
            data={dcEntries}
          />
        </div>
      )}

      {/* Tab 4: Pendency */}
      {activeTab === 4 && (
        <div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-5">
            {[
              { label: 'Total Pending Items', value: pendencyData.reduce((s, p) => s + p.pending, 0), color: '#ef4444' },
              { label: 'Orders with Pendency', value: pendencyData.length, color: '#f59e0b' },
              { label: 'Oldest Pendency', value: '7 days', color: '#8b5cf6' },
            ].map((k, i) => (
              <div key={i} className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm hover:-translate-y-1 hover:shadow-lg transition-all">
                <div className="text-2xl font-black tracking-tight" style={{ color: k.color }}>{k.value}</div>
                <div className="text-xs text-gray-500 font-medium mt-1">{k.label}</div>
              </div>
            ))}
          </div>
          <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
            <div className="text-sm font-bold text-gray-800 mb-3.5">Pendency Tracking</div>
            <DataTable
              columns={[
                { key: 'id', label: 'Order ID', render: v => <span className="font-semibold text-red-700">{v}</span> },
                { key: 'customer', label: 'Customer', render: v => <span className="font-semibold">{v}</span> },
                { key: 'items', label: 'Ordered' },
                { key: 'dispatched', label: 'Dispatched', render: v => <span className="text-green-600 font-bold">{v}</span> },
                { key: 'pending', label: 'Pending', render: v => <span className="text-red-500 font-extrabold">{v}</span> },
                { key: 'value', label: 'Pending Value', render: v => <span className="font-bold">{v}</span> },
                { key: 'daysOld', label: 'Age', render: v => <span className={`font-bold ${v > 5 ? 'text-red-500' : v > 2 ? 'text-amber-500' : 'text-gray-500'}`}>{v}d</span> },
                { key: 'reason', label: 'Reason', render: v => <span className="text-[11px] text-gray-500">{v}</span> },
                { key: 'id', label: 'Action', render: () => (
                  <button onClick={() => alert('🔧 Resolving pendency...')} className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg border border-red-600 text-red-700 bg-transparent font-semibold hover:bg-red-700 hover:text-white transition-all cursor-pointer font-[inherit]">Resolve</button>
                )},
              ]}
              data={pendencyData}
            />
          </div>
        </div>
      )}

      {/* Tab 5: Courier & POD */}
      {activeTab === 5 && (
        <div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-5">
            {[
              { label: 'Active Shipments', value: courierShipments.filter(s => s.status !== 'Delivered').length, color: '#3b82f6' },
              { label: 'Delivered', value: courierShipments.filter(s => s.status === 'Delivered').length, color: '#10b981' },
              { label: 'POD Pending', value: courierShipments.filter(s => !s.pod).length, color: '#f59e0b' },
            ].map((k, i) => (
              <div key={i} className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm hover:-translate-y-1 hover:shadow-lg transition-all">
                <div className="text-2xl font-black tracking-tight" style={{ color: k.color }}>{k.value}</div>
                <div className="text-xs text-gray-500 font-medium mt-1">{k.label}</div>
              </div>
            ))}
          </div>
          <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm mb-4">
            <div className="text-sm font-bold text-gray-800 mb-3.5">Courier Shipments</div>
            <DataTable
              columns={[
                { key: 'id', label: 'Shipment ID', render: v => <span className="font-semibold text-red-700">{v}</span> },
                { key: 'courier', label: 'Courier', render: v => <span className="font-bold">{v}</span> },
                { key: 'awb', label: 'AWB No.', render: v => <span className="font-mono text-[11px]">{v}</span> },
                { key: 'order', label: 'Order Ref' },
                { key: 'customer', label: 'Customer' },
                { key: 'destination', label: 'Destination' },
                { key: 'eta', label: 'ETA' },
                { key: 'status', label: 'Status', render: v => <StatusBadge status={v} type={v === 'Delivered' ? 'success' : v === 'Out for Delivery' ? 'warning' : 'info'} /> },
                { key: 'pod', label: 'POD', render: v => v ? (
                  <button onClick={() => alert('📄 Viewing POD...')} className="px-2 py-1 text-[11px] rounded bg-green-100 text-green-800 border-0 cursor-pointer font-[inherit]">📄 View POD</button>
                ) : (
                  <button onClick={() => alert('⬆ Upload POD image...')} className="px-2 py-1 text-[11px] rounded bg-amber-100 text-amber-800 border-0 cursor-pointer font-[inherit]">⬆ Upload</button>
                )},
              ]}
              data={courierShipments}
            />
          </div>

          {/* POD Upload Panel */}
          <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
            <div className="text-sm font-bold text-gray-800 mb-3.5">POD Upload — SHP-001</div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <div className="border-2 border-dashed border-gray-200 rounded-xl p-8 text-center mb-4 cursor-pointer bg-gray-50">
                  <div className="text-4xl mb-2">📷</div>
                  <div className="font-semibold text-sm mb-1">Upload POD Image / Signature</div>
                  <div className="text-[11px] text-gray-500">Drag & drop or click to browse</div>
                  <div className="text-[10px] text-gray-400 mt-1">JPG, PNG, PDF — Max 5MB</div>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => setShowModal(false)} className="flex-1 inline-flex items-center justify-center gap-1.5 px-4 py-2 border border-red-600 text-red-700 bg-transparent rounded-xl text-sm font-semibold hover:bg-red-700 hover:text-white transition-all cursor-pointer font-[inherit]">Cancel</button>
                  <button onClick={() => { alert('✓ POD submitted successfully'); setShowModal(false); }} className="flex-1 inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-gradient-to-br from-red-400 to-red-700 text-white rounded-xl text-sm font-semibold shadow-md hover:-translate-y-px transition-all border-0 cursor-pointer font-[inherit]">Submit POD</button>
                </div>
              </div>
              <div>
                <div className="font-semibold text-sm mb-3">Delivery Details</div>
                {[
                  ['Shipment', 'SHP-001'], ['AWB No.', 'BD123456789'], ['Courier', 'BlueDart'],
                  ['Customer', 'Tata Motors'], ['Destination', 'Mumbai'], ['Delivered On', '—'], ['Received By', '—'],
                ].map(([k, v]) => (
                  <div key={k} className="flex justify-between py-1.5 border-b border-gray-50 text-sm last:border-0">
                    <span className="text-gray-500">{k}</span>
                    <span className="font-semibold">{v}</span>
                  </div>
                ))}
                <div className="flex flex-col gap-1.5 mb-4 mt-3">
                  <label className="text-xs font-semibold text-gray-600">Receiver Name</label>
                  <input className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none bg-white text-gray-800 focus:border-red-500 focus:ring-2 focus:ring-red-100 placeholder:text-gray-400 font-[inherit]" placeholder="Name of person who received" />
                </div>
                <div className="flex flex-col gap-1.5 mb-4">
                  <label className="text-xs font-semibold text-gray-600">Delivery Date & Time</label>
                  <input type="datetime-local" className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none bg-white text-gray-800 focus:border-red-500 focus:ring-2 focus:ring-red-100 font-[inherit]" />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* New Dispatch Modal */}
      <Modal
        open={showModal}
        onClose={() => setShowModal(false)}
        title="Create New Dispatch"
        footer={
          <>
            <button className="inline-flex items-center gap-1.5 px-4 py-2 border border-red-600 text-red-700 bg-transparent rounded-xl text-sm font-semibold hover:bg-red-700 hover:text-white transition-all cursor-pointer font-[inherit]" onClick={() => setShowModal(false)}>Cancel</button>
            <button className="inline-flex items-center gap-1.5 px-4 py-2 bg-gradient-to-br from-red-400 to-red-700 text-white rounded-xl text-sm font-semibold shadow-md hover:-translate-y-px transition-all border-0 cursor-pointer font-[inherit]" onClick={handleSaveModal}>Create Dispatch</button>
          </>
        }
      >
        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5 mb-4"><label className="text-xs font-semibold text-gray-600">Order Reference *</label><input className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none bg-white text-gray-800 focus:border-red-500 focus:ring-2 focus:ring-red-100 placeholder:text-gray-400 font-[inherit]" placeholder="e.g. ORD-2024-089" /></div>
          <div className="flex flex-col gap-1.5 mb-4"><label className="text-xs font-semibold text-gray-600">Customer Name *</label><input className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none bg-white text-gray-800 focus:border-red-500 focus:ring-2 focus:ring-red-100 placeholder:text-gray-400 font-[inherit]" placeholder="Customer" /></div>
          <div className="flex flex-col gap-1.5 mb-4"><label className="text-xs font-semibold text-gray-600">Vehicle *</label><select className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none bg-white text-gray-800 focus:border-red-500 focus:ring-2 focus:ring-red-100 font-[inherit]"><option>MH-12-AB-1234 — Truck (5 Ton)</option><option>MH-14-EF-9012 — Tempo (1 Ton)</option></select></div>
          <div className="flex flex-col gap-1.5 mb-4"><label className="text-xs font-semibold text-gray-600">Driver *</label><select className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none bg-white text-gray-800 focus:border-red-500 focus:ring-2 focus:ring-red-100 font-[inherit]"><option>Ramesh Patil</option><option>Anil Rao</option></select></div>
          <div className="flex flex-col gap-1.5 mb-4"><label className="text-xs font-semibold text-gray-600">Destination *</label><input className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none bg-white text-gray-800 focus:border-red-500 focus:ring-2 focus:ring-red-100 placeholder:text-gray-400 font-[inherit]" placeholder="City / Address" /></div>
          <div className="flex flex-col gap-1.5 mb-4"><label className="text-xs font-semibold text-gray-600">Dispatch Date</label><input type="date" className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none bg-white text-gray-800 focus:border-red-500 focus:ring-2 focus:ring-red-100 font-[inherit]" /></div>
          <div className="flex flex-col gap-1.5 mb-4"><label className="text-xs font-semibold text-gray-600">Expected Delivery</label><input type="date" className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none bg-white text-gray-800 focus:border-red-500 focus:ring-2 focus:ring-red-100 font-[inherit]" /></div>
          <div className="flex flex-col gap-1.5 mb-4"><label className="text-xs font-semibold text-gray-600">Total Weight (kg)</label><input type="number" className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none bg-white text-gray-800 focus:border-red-500 focus:ring-2 focus:ring-red-100 placeholder:text-gray-400 font-[inherit]" placeholder="0" /></div>
          <div className="flex flex-col gap-1.5 mb-4"><label className="text-xs font-semibold text-gray-600">Delivery Instructions</label><textarea className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none bg-white text-gray-800 focus:border-red-500 focus:ring-2 focus:ring-red-100 placeholder:text-gray-400 font-[inherit]" placeholder="Special handling notes..." /></div>
        </div>
      </Modal>
    </div>
  );
}
