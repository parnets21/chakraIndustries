import { useState, useEffect, useRef, useCallback } from 'react';
import JsBarcode from 'jsbarcode';
import StatusBadge from '../../components/common/StatusBadge';
import { toast } from '../../components/common/Toast';
import { inventoryApi } from '../../api/inventoryApi';
import { itemMasterApi } from '../../api/itemMasterApi';

const thCls = 'bg-gray-50 px-4 py-2.5 text-left text-[10.5px] font-bold text-gray-400 uppercase tracking-wide border-b border-gray-200 whitespace-nowrap';
const tdCls = 'px-4 py-3 text-gray-800 align-middle text-sm';
const trCls = 'border-b border-gray-50 last:border-0 hover:bg-red-50/40 transition-colors';

function Spinner() {
  return (
    <div style={{ display:'flex', justifyContent:'center', padding:32 }}>
      <div style={{ width:28, height:28, border:'3px solid #f1f5f9', borderTop:'3px solid #c0392b', borderRadius:'50%', animation:'spin 0.7s linear infinite' }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}

// ── Barcode Generator ─────────────────────────────────────────────────────────
function BarcodeGenerator({ inventoryItems }) {
  const svgRef = useRef(null);
  const [sku, setSku]           = useState('');
  const [batch, setBatch]       = useState('');
  const [qty, setQty]           = useState('100');
  const [format, setFormat]     = useState('CODE128');
  const [generated, setGenerated] = useState(false);
  const [barcodeValue, setBarcodeValue] = useState('');

  const selectedItem = inventoryItems.find(i => i.sku === sku);

  const generateBarcode = useCallback(() => {
    if (!sku) { toast('Select a SKU first', 'error'); return; }
    const value = `${sku}${batch ? '-' + batch : ''}`.replace(/[^A-Za-z0-9\-]/g, '');
    if (!value) { toast('Invalid barcode value', 'error'); return; }
    try {
      JsBarcode(svgRef.current, value, {
        format, lineColor:'#1e293b', width:1.5, height:60,
        displayValue:true, fontSize:11, margin:8, background:'#ffffff',
      });
      if (svgRef.current) {
        svgRef.current.setAttribute('width', '100%');
        svgRef.current.style.maxWidth = '100%';
        svgRef.current.style.height = 'auto';
        svgRef.current.style.display = 'block';
      }
      setBarcodeValue(value);
      setGenerated(true);
      toast(`Barcode generated for ${sku}`);
    } catch (e) { toast('Failed to generate barcode: ' + e.message, 'error'); }
  }, [sku, batch, format]);

  const downloadBarcode = () => {
    if (!generated || !svgRef.current) { toast('Generate a barcode first', 'error'); return; }
    const svg = svgRef.current;
    const serializer = new XMLSerializer();
    const svgStr = serializer.serializeToString(svg);
    const canvas = document.createElement('canvas');
    const img = new Image();
    const svgBlob = new Blob([svgStr], { type:'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(svgBlob);
    img.onload = () => {
      canvas.width = img.width || 300; canvas.height = img.height || 150;
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);
      URL.revokeObjectURL(url);
      const a = document.createElement('a');
      a.download = `barcode-${sku}${batch ? '-' + batch : ''}.png`;
      a.href = canvas.toDataURL('image/png'); a.click();
      toast('Barcode downloaded');
    };
    img.src = url;
  };

  const printBarcode = () => {
    if (!generated || !svgRef.current) { toast('Generate a barcode first', 'error'); return; }
    const svg = svgRef.current.outerHTML;
    const win = window.open('', '_blank');
    win.document.write(`<html><head><title>Print Barcode</title><style>body{display:flex;justify-content:center;align-items:center;min-height:100vh;margin:0;background:#fff;}</style></head><body>${svg}<script>window.onload=()=>{window.print();window.close();}<\/script></body></html>`);
    win.document.close();
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
      <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
        <div className="text-sm font-bold text-gray-800 mb-5">Generate Barcode</div>
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-gray-600">SKU *</label>
            <select className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none bg-white text-gray-800 focus:border-red-500 focus:ring-2 focus:ring-red-100 font-[inherit]"
              value={sku} onChange={e => { setSku(e.target.value); setGenerated(false); }}>
              <option value="">— Select SKU —</option>
              {inventoryItems.map(item => <option key={item._id} value={item.sku}>{item.sku} — {item.name}</option>)}
            </select>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-gray-600">Batch Number</label>
            <input className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none bg-white text-gray-800 focus:border-red-500 focus:ring-2 focus:ring-red-100 font-[inherit]"
              value={batch} onChange={e => { setBatch(e.target.value); setGenerated(false); }} placeholder="e.g. B-2024-04" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-gray-600">Quantity</label>
              <input type="number" className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none bg-white text-gray-800 focus:border-red-500 focus:ring-2 focus:ring-red-100 font-[inherit]"
                value={qty} onChange={e => setQty(e.target.value)} />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-gray-600">Format</label>
              <select className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none bg-white text-gray-800 focus:border-red-500 focus:ring-2 focus:ring-red-100 font-[inherit]"
                value={format} onChange={e => { setFormat(e.target.value); setGenerated(false); }}>
                <option value="CODE128">CODE128</option>
                <option value="CODE39">CODE39</option>
                <option value="EAN13">EAN-13</option>
                <option value="UPC">UPC</option>
              </select>
            </div>
          </div>
          <button onClick={generateBarcode}
            className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-br from-red-500 to-red-700 text-white rounded-xl text-sm font-semibold shadow-md hover:-translate-y-px transition-all border-0 cursor-pointer font-[inherit]">
            ⚡ Generate Barcode
          </button>
          {generated && (
            <div className="grid grid-cols-2 gap-2">
              <button onClick={downloadBarcode}
                className="inline-flex items-center justify-center gap-1.5 px-3 py-2 border border-gray-300 text-gray-700 bg-white rounded-xl text-xs font-semibold hover:bg-gray-50 transition-all cursor-pointer font-[inherit]">
                ⬇ Download PNG
              </button>
              <button onClick={printBarcode}
                className="inline-flex items-center justify-center gap-1.5 px-3 py-2 border border-red-600 text-red-700 bg-transparent rounded-xl text-xs font-semibold hover:bg-red-700 hover:text-white transition-all cursor-pointer font-[inherit]">
                🖨 Print Label
              </button>
            </div>
          )}
        </div>
      </div>
      <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm flex flex-col items-center justify-center gap-4 min-h-[280px]">
        {!generated && (
          <div className="text-center">
            <div className="text-5xl mb-3">🏷️</div>
            <div className="text-sm text-gray-400 font-medium">Fill the form and click<br /><strong className="text-gray-600">Generate Barcode</strong></div>
          </div>
        )}
        <div className={`w-full p-4 bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden ${!generated ? 'hidden' : ''}`}>
          <svg ref={svgRef} style={{ width:'100%', height:'auto', display:'block', maxWidth:'100%' }} />
        </div>
        {generated && selectedItem && (
          <div className="text-center">
            <div className="text-xs font-bold text-gray-700">{sku} — {selectedItem.name}</div>
            <div className="text-xs text-gray-400 mt-1">
              Batch: {batch || 'N/A'} · Qty: {qty} · Format: {format}
            </div>
            <div className="text-xs text-gray-400 mt-1">
              Stock: {selectedItem.availableQuantity || selectedItem.totalQuantity || 0} {selectedItem.unit}
            </div>
            <div className="font-mono text-[10px] text-gray-400 mt-1">{barcodeValue}</div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Barcode Scanner ───────────────────────────────────────────────────────────
function BarcodeScanner({ inventoryItems }) {
  const videoRef    = useRef(null);
  const streamRef   = useRef(null);
  const rafRef      = useRef(null);
  const detectorRef = useRef(null);

  const [cameraOn,    setCameraOn]    = useState(false);
  const [cameraErr,   setCameraErr]   = useState('');
  const [scanInput,   setScanInput]   = useState('');
  const [scanned,     setScanned]     = useState(null);
  const [scanning,    setScanning]    = useState(false);
  const [hasDetector, setHasDetector] = useState(false);
  const [actionLoading, setActionLoading] = useState('');

  useEffect(() => {
    setHasDetector('BarcodeDetector' in window);
    return () => stopCamera();
  }, []);

  const stopCamera = useCallback(() => {
    if (rafRef.current) { cancelAnimationFrame(rafRef.current); rafRef.current = null; }
    if (streamRef.current) { streamRef.current.getTracks().forEach(t => t.stop()); streamRef.current = null; }
    if (videoRef.current) videoRef.current.srcObject = null;
    setCameraOn(false); setScanning(false);
  }, []);

  const startCamera = useCallback(async () => {
    setCameraErr('');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode:'environment', width:{ ideal:1280 }, height:{ ideal:720 } } });
      streamRef.current = stream;
      if (videoRef.current) { videoRef.current.srcObject = stream; await videoRef.current.play(); }
      setCameraOn(true);
      if ('BarcodeDetector' in window) {
        if (!detectorRef.current) detectorRef.current = new window.BarcodeDetector({ formats:['code_128','code_39','ean_13','ean_8','upc_a','upc_e','qr_code'] });
        setScanning(true);
        const detect = async () => {
          if (!videoRef.current || videoRef.current.readyState < 2) { rafRef.current = requestAnimationFrame(detect); return; }
          try {
            const barcodes = await detectorRef.current.detect(videoRef.current);
            if (barcodes.length > 0) { handleScannedCode(barcodes[0].rawValue); stopCamera(); return; }
          } catch (_) {}
          rafRef.current = requestAnimationFrame(detect);
        };
        rafRef.current = requestAnimationFrame(detect);
      }
    } catch (err) {
      const msg = err.name === 'NotAllowedError' ? 'Camera permission denied.' : err.name === 'NotFoundError' ? 'No camera found.' : `Camera error: ${err.message}`;
      setCameraErr(msg); toast(msg, 'error');
    }
  }, [stopCamera]);

  const handleScannedCode = (code) => {
    const trimmed = code.trim().toUpperCase();
    const item = inventoryItems.find(i => i.sku === trimmed || trimmed.includes(i.sku));
    setScanned({
      barcode: trimmed,
      sku: item?.sku || trimmed,
      name: item?.name || 'Unknown Item',
      location: item?.location ? `${item.location.zone || ''} ${item.location.rack || ''}`.trim() || '—' : '—',
      qty: item?.availableQuantity ?? item?.totalQuantity ?? '—',
      unit: item?.unit || '',
      status: item?.status || 'Unknown',
      found: !!item,
      _id: item?._id,
    });
    setScanInput(trimmed);
    toast(item ? `✓ Found: ${item.name}` : `Barcode scanned: ${trimmed}`);
  };

  const handleManualLookup = () => {
    if (!scanInput.trim()) { toast('Enter a barcode or SKU', 'error'); return; }
    handleScannedCode(scanInput.trim());
  };

  const handleStockAction = async (action) => {
    if (!scanned?._id) { toast('Item not found in inventory', 'error'); return; }
    setActionLoading(action);
    try {
      if (action === 'Inward') {
        await inventoryApi.createMovement({ type:'Inward', inventoryId: scanned._id, quantity:1, from:'Receiving Dock', to:'Warehouse', reference:`SCAN-${Date.now()}` });
        toast(`Inward movement recorded for ${scanned.sku}`);
      } else if (action === 'Outward') {
        await inventoryApi.createMovement({ type:'Outward', inventoryId: scanned._id, quantity:1, from:'Warehouse', to:'Production/Dispatch', reference:`SCAN-${Date.now()}` });
        toast(`Outward movement recorded for ${scanned.sku}`);
      } else {
        toast(`${action} action for ${scanned.sku}`);
      }
    } catch (e) { toast(e.message || 'Action failed', 'error'); }
    finally { setActionLoading(''); }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
      <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm flex flex-col gap-4">
        <div className="text-sm font-bold text-gray-800">Barcode Scanner</div>
        <div>
          <label className="text-xs font-semibold text-gray-600 block mb-1.5">Select SKU</label>
          <select className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none bg-white text-gray-800 focus:border-red-500 focus:ring-2 focus:ring-red-100 font-[inherit]"
            onChange={e => { if (e.target.value) handleScannedCode(e.target.value); }}>
            <option value="">— Select a SKU to lookup —</option>
            {inventoryItems.map(item => <option key={item._id} value={item.sku}>{item.sku} — {item.name}</option>)}
          </select>
        </div>
        <div>
          <label className="text-xs font-semibold text-gray-600 block mb-1.5">Manual Entry / USB Scanner</label>
          <div className="flex gap-2">
            <input className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none bg-white text-gray-800 focus:border-red-500 focus:ring-2 focus:ring-red-100 placeholder:text-gray-400 font-[inherit]"
              placeholder="Type barcode or SKU, press Enter…"
              value={scanInput} onChange={e => setScanInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleManualLookup()} />
            <button onClick={handleManualLookup}
              className="px-4 py-2 bg-gradient-to-br from-red-500 to-red-700 text-white rounded-lg text-sm font-semibold border-0 cursor-pointer font-[inherit] whitespace-nowrap">
              Lookup
            </button>
          </div>
        </div>
        <div>
          <label className="text-xs font-semibold text-gray-600 block mb-1.5">
            Camera Scanner
            {!hasDetector && <span className="ml-2 text-amber-600 font-normal">(auto-detect not supported)</span>}
          </label>
          <div className="relative rounded-xl overflow-hidden bg-gray-900" style={{ aspectRatio:'16/9' }}>
            <video ref={videoRef} className="w-full h-full object-cover" playsInline muted style={{ display:cameraOn?'block':'none' }} />
            {!cameraOn && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-white">
                <div className="text-4xl">📷</div>
                <div className="text-sm font-medium text-gray-300">Camera is off</div>
                {cameraErr && <div className="text-xs text-red-400 text-center px-4">{cameraErr}</div>}
              </div>
            )}
            {cameraOn && scanning && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="border-2 border-red-400 rounded-lg" style={{ width:'60%', height:'40%', boxShadow:'0 0 0 9999px rgba(0,0,0,0.45)' }} />
                <div className="absolute bottom-3 text-xs text-white bg-black/50 px-3 py-1 rounded-full">Scanning…</div>
              </div>
            )}
          </div>
          <div className="flex gap-2 mt-3">
            {!cameraOn ? (
              <button onClick={startCamera} className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-br from-slate-700 to-slate-900 text-white rounded-xl text-sm font-semibold border-0 cursor-pointer font-[inherit]">
                📷 Start Camera
              </button>
            ) : (
              <button onClick={stopCamera} className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-red-100 text-red-700 rounded-xl text-sm font-semibold border-0 cursor-pointer font-[inherit]">
                ⏹ Stop Camera
              </button>
            )}
            {scanned && <button onClick={() => { setScanned(null); setScanInput(''); }} className="px-4 py-2.5 bg-gray-100 text-gray-600 rounded-xl text-sm font-semibold border-0 cursor-pointer font-[inherit]">Clear</button>}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
        {!scanned ? (
          <div className="flex flex-col items-center justify-center h-full gap-3 py-10">
            <div className="text-5xl">🔍</div>
            <div className="text-sm font-semibold text-gray-400">No barcode scanned yet</div>
            <div className="text-xs text-gray-400 text-center">Start the camera or type a barcode<br />in the manual entry field</div>
          </div>
        ) : (
          <>
            <div className={`flex items-center gap-2 mb-4 text-sm font-bold ${scanned.found ? 'text-green-600' : 'text-amber-600'}`}>
              {scanned.found ? '✓ Item Found in Inventory' : '⚠ Unknown Barcode'}
            </div>
            <div className="space-y-0 mb-4">
              {[
                ['Barcode',  <span className="font-mono text-xs">{scanned.barcode}</span>],
                ['SKU',      scanned.sku],
                ['Item Name',scanned.name],
                ['Location', scanned.location],
                ['Available Qty', `${scanned.qty} ${scanned.unit}`],
                ['Status',   <StatusBadge status={scanned.status} />],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between items-center py-2.5 border-b border-gray-100 text-[13px]">
                  <span className="text-gray-400 font-medium">{k}</span>
                  <span className="font-semibold text-gray-800">{v}</span>
                </div>
              ))}
            </div>
            {scanned.found && (
              <>
                <div className="flex gap-2 mb-3">
                  {[
                    { label:'Inward',   cls:'bg-gradient-to-br from-green-500 to-green-700 text-white' },
                    { label:'Outward',  cls:'border border-red-600 text-red-700 bg-transparent' },
                    { label:'Transfer', cls:'bg-gray-100 text-gray-700' },
                  ].map(b => (
                    <button key={b.label} onClick={() => handleStockAction(b.label)} disabled={!!actionLoading}
                      className={`flex-1 py-2 text-xs rounded-lg font-semibold border-0 cursor-pointer font-[inherit] disabled:opacity-60 ${b.cls}`}>
                      {actionLoading === b.label ? '...' : b.label}
                    </button>
                  ))}
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { label:'📦 GRN Receipt',   cls:'bg-green-50 text-green-800'   },
                    { label:'🔍 Picking',        cls:'bg-blue-50 text-blue-800'    },
                    { label:'🚚 Dispatch',       cls:'bg-amber-50 text-amber-800'  },
                    { label:'↔ Stock Transfer', cls:'bg-purple-50 text-purple-800' },
                  ].map((a, i) => (
                    <button key={i} onClick={() => toast(`${a.label} for ${scanned.sku}`)}
                      className={`px-3 py-2 text-xs rounded-lg font-semibold border-0 cursor-pointer font-[inherit] ${a.cls}`}>
                      {a.label}
                    </button>
                  ))}
                </div>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function BarcodePage({ initialTab = 0 }) {
  const [activeTab, setActiveTab]         = useState(initialTab);
  const [inventoryItems, setInventoryItems] = useState([]);
  const [movements, setMovements]         = useState([]);
  const [loading, setLoading]             = useState(false);

  const loadInventory = useCallback(async () => {
    try {
      const r = await inventoryApi.getAll();
      setInventoryItems(r.data || []);
    } catch (_) {}
  }, []);

  const loadMovements = useCallback(async () => {
    setLoading(true);
    try {
      const r = await inventoryApi.getMovements({ limit: 50 });
      setMovements(r.data || []);
    } catch (_) {}
    finally { setLoading(false); }
  }, []);

  useEffect(() => { loadInventory(); }, [loadInventory]);
  useEffect(() => { if (activeTab === 2) loadMovements(); }, [activeTab, loadMovements]);

  return (
    <div>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'flex-end', gap:10, marginBottom:20 }}>
        {activeTab === 2 && (
          <button onClick={loadMovements} style={{ display:'inline-flex', alignItems:'center', gap:6, padding:'8px 16px', borderRadius:10, background:'transparent', color:'#c0392b', border:'1.5px solid #c0392b', cursor:'pointer', fontSize:13, fontWeight:600, fontFamily:'inherit' }}>
            ↻ Refresh Logs
          </button>
        )}
      </div>

      {activeTab === 0 && <BarcodeGenerator inventoryItems={inventoryItems} />}
      {activeTab === 1 && <BarcodeScanner inventoryItems={inventoryItems} />}

      {activeTab === 2 && (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100">
            <div className="text-sm font-bold text-gray-800">Movement Logs</div>
            <div className="text-xs text-gray-400 mt-0.5">{movements.length} recent scan events</div>
          </div>
          {loading ? <Spinner /> : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr>{['Movement ID','SKU','Item','Type','From','To','Qty','Operator','Time'].map(h => <th key={h} className={thCls}>{h}</th>)}</tr>
                </thead>
                <tbody>
                  {movements.length === 0 ? (
                    <tr><td colSpan={9} className="px-4 py-8 text-center text-gray-400 text-sm">No movement logs yet. Use the scanner to record stock movements.</td></tr>
                  ) : movements.map((m, i) => (
                    <tr key={i} className={trCls}>
                      <td className={`${tdCls} font-semibold text-red-700 font-mono text-xs`}>{m.movementId}</td>
                      <td className={`${tdCls} font-mono text-xs`}>{m.sku}</td>
                      <td className={`${tdCls} font-semibold`}>{m.itemName || m.name || '—'}</td>
                      <td className={tdCls}><StatusBadge status={m.type} type={m.type==='Inward'?'success':m.type==='Outward'?'danger':'info'} /></td>
                      <td className={tdCls}>{m.from}</td>
                      <td className={tdCls}>{m.to}</td>
                      <td className={`${tdCls} font-bold`}>{m.quantity || m.qty}</td>
                      <td className={tdCls}>{m.performedBy?.name || '—'}</td>
                      <td className={`${tdCls} text-gray-400 text-xs`}>{new Date(m.createdAt).toLocaleString('en-IN',{day:'2-digit',month:'short',hour:'2-digit',minute:'2-digit'})}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
