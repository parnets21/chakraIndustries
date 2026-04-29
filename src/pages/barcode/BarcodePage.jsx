import { useState, useEffect, useRef, useCallback } from 'react';
import JsBarcode from 'jsbarcode';
import StatusBadge from '../../components/common/StatusBadge';
import { toast } from '../../components/common/Toast';

// ── Static mock data ──────────────────────────────────────────────────────────
const MOCK_ITEMS = {
  'SKU-1042': { name: 'Bearing 6205',      location: 'WH-01 / Rack A3', qty: 12, status: 'Active'   },
  'SKU-2187': { name: 'Oil Seal 35x52',    location: 'WH-01 / Rack B2', qty: 4,  status: 'Critical' },
  'SKU-3301': { name: 'Piston Ring 80mm',  location: 'WH-02 / Rack C1', qty: 340,status: 'Active'   },
  'SKU-4412': { name: 'Crankshaft Seal',   location: 'WH-03 / Rack A1', qty: 220,status: 'Active'   },
  'SKU-5523': { name: 'Valve Spring Set',  location: 'WH-02 / Rack B1', qty: 0,  status: 'Dead'     },
};

const movementLogs = [
  { id:'LOG-001', barcode:'BC-SKU1042-001', item:'Bearing 6205',      action:'Inward',   location:'WH-01 / Rack A3',   operator:'Ramesh', time:'14 Apr, 09:15 AM' },
  { id:'LOG-002', barcode:'BC-SKU4412-022', item:'Crankshaft Seal',   action:'Outward',  location:'Production Line 2', operator:'Suresh', time:'14 Apr, 10:30 AM' },
  { id:'LOG-003', barcode:'BC-SKU3301-045', item:'Piston Ring 80mm',  action:'Transfer', location:'WH-01 → WH-03',     operator:'Anil',   time:'13 Apr, 03:00 PM' },
  { id:'LOG-004', barcode:'BC-SKU5523-012', item:'Valve Spring Set',  action:'Inward',   location:'WH-02 / Rack B1',   operator:'Vijay',  time:'13 Apr, 11:00 AM' },
];

const thCls = 'bg-gray-50 px-4 py-2.5 text-left text-[10.5px] font-bold text-gray-400 uppercase tracking-wide border-b border-gray-200 whitespace-nowrap';
const tdCls = 'px-4 py-3 text-gray-800 align-middle text-sm';
const trCls = 'border-b border-gray-50 last:border-0 hover:bg-red-50/40 transition-colors';

// ── Real Barcode Generator Component ─────────────────────────────────────────
function BarcodeGenerator() {
  const svgRef = useRef(null);
  const [sku, setSku]       = useState('SKU-1042');
  const [batch, setBatch]   = useState('B-2024-04');
  const [qty, setQty]       = useState('100');
  const [format, setFormat] = useState('CODE128');
  const [generated, setGenerated] = useState(false);
  const [barcodeValue, setBarcodeValue] = useState('');

  const generateBarcode = useCallback(() => {
    const value = `${sku}-${batch}`.replace(/[^A-Za-z0-9\-]/g, '');
    if (!value) { toast('Invalid barcode value', 'error'); return; }
    try {
      JsBarcode(svgRef.current, value, {
        format,
        lineColor: '#1e293b',
        width: 1.5,
        height: 60,
        displayValue: true,
        fontSize: 11,
        margin: 8,
        background: '#ffffff',
      });
      // Make SVG scale responsively inside its container
      if (svgRef.current) {
        svgRef.current.setAttribute('width', '100%');
        svgRef.current.style.maxWidth = '100%';
        svgRef.current.style.height = 'auto';
        svgRef.current.style.display = 'block';
      }
      setBarcodeValue(value);
      setGenerated(true);
      toast(`Barcode generated for ${sku}`);
    } catch (e) {
      toast('Failed to generate barcode: ' + e.message, 'error');
    }
  }, [sku, batch, format]);

  const downloadBarcode = () => {
    if (!generated || !svgRef.current) { toast('Generate a barcode first', 'error'); return; }
    const svg = svgRef.current;
    const serializer = new XMLSerializer();
    const svgStr = serializer.serializeToString(svg);
    const canvas = document.createElement('canvas');
    const img = new Image();
    const svgBlob = new Blob([svgStr], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(svgBlob);
    img.onload = () => {
      canvas.width = img.width || 300;
      canvas.height = img.height || 150;
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = '#fff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);
      URL.revokeObjectURL(url);
      const a = document.createElement('a');
      a.download = `barcode-${sku}-${batch}.png`;
      a.href = canvas.toDataURL('image/png');
      a.click();
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
      {/* Form */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
        <div className="text-sm font-bold text-gray-800 mb-5">Generate Barcode</div>

        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-gray-600">SKU *</label>
            <select className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none bg-white text-gray-800 focus:border-red-500 focus:ring-2 focus:ring-red-100 font-[inherit]"
              value={sku} onChange={e => { setSku(e.target.value); setGenerated(false); }}>
              {Object.keys(MOCK_ITEMS).map(s => <option key={s} value={s}>{s} — {MOCK_ITEMS[s].name}</option>)}
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

      {/* Preview — SVG is ALWAYS mounted so the ref stays stable */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm flex flex-col items-center justify-center gap-4 min-h-[280px]">
        {/* Placeholder — shown only before first generate */}
        {!generated && (
          <div className="text-center">
            <div className="text-5xl mb-3">🏷️</div>
            <div className="text-sm text-gray-400 font-medium">Fill the form and click<br /><strong className="text-gray-600">Generate Barcode</strong></div>
          </div>
        )}

        {/* SVG always in DOM — JsBarcode writes into it directly */}
        <div className={`w-full p-4 bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden ${!generated ? 'hidden' : ''}`}>
          <svg ref={svgRef} style={{ width: '100%', height: 'auto', display: 'block', maxWidth: '100%' }} />
        </div>

        {generated && (
          <div className="text-center">
            <div className="text-xs font-bold text-gray-700">{sku} — {MOCK_ITEMS[sku]?.name}</div>
            <div className="text-xs text-gray-400 mt-1">Batch: {batch} · Qty: {qty} · Format: {format}</div>
            <div className="font-mono text-[10px] text-gray-400 mt-1">{barcodeValue}</div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Camera Scanner Component ──────────────────────────────────────────────────
function BarcodeScanner() {
  const videoRef   = useRef(null);
  const streamRef  = useRef(null);
  const rafRef     = useRef(null);
  const detectorRef = useRef(null);

  const [cameraOn,   setCameraOn]   = useState(false);
  const [cameraErr,  setCameraErr]  = useState('');
  const [scanInput,  setScanInput]  = useState('');
  const [selectedSKU, setSelectedSKU] = useState('');
  const [scanned,    setScanned]    = useState(null);
  const [scanning,   setScanning]   = useState(false);
  const [hasDetector, setHasDetector] = useState(false);

  useEffect(() => {
    setHasDetector('BarcodeDetector' in window);
    return () => stopCamera();
  }, []);

  const stopCamera = useCallback(() => {
    if (rafRef.current) { cancelAnimationFrame(rafRef.current); rafRef.current = null; }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    if (videoRef.current) videoRef.current.srcObject = null;
    setCameraOn(false);
    setScanning(false);
  }, []);

  const startCamera = useCallback(async () => {
    setCameraErr('');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } }
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setCameraOn(true);

      // Start BarcodeDetector loop if supported
      if ('BarcodeDetector' in window) {
        if (!detectorRef.current) {
          detectorRef.current = new window.BarcodeDetector({
            formats: ['code_128', 'code_39', 'ean_13', 'ean_8', 'upc_a', 'upc_e', 'qr_code', 'data_matrix'],
          });
        }
        setScanning(true);
        const detect = async () => {
          if (!videoRef.current || videoRef.current.readyState < 2) {
            rafRef.current = requestAnimationFrame(detect);
            return;
          }
          try {
            const barcodes = await detectorRef.current.detect(videoRef.current);
            if (barcodes.length > 0) {
              const code = barcodes[0].rawValue;
              handleScannedCode(code);
              stopCamera();
              return;
            }
          } catch (_) {}
          rafRef.current = requestAnimationFrame(detect);
        };
        rafRef.current = requestAnimationFrame(detect);
      }
    } catch (err) {
      const msg = err.name === 'NotAllowedError'
        ? 'Camera permission denied. Please allow camera access in your browser settings.'
        : err.name === 'NotFoundError'
        ? 'No camera found on this device.'
        : `Camera error: ${err.message}`;
      setCameraErr(msg);
      toast(msg, 'error');
    }
  }, [stopCamera]);

  const handleScannedCode = (code) => {
    const trimmed = code.trim();
    // Try to match against known SKUs
    const matchedSKU = Object.keys(MOCK_ITEMS).find(s =>
      trimmed.toUpperCase().includes(s.replace('-', '')) ||
      trimmed.toUpperCase() === s.toUpperCase()
    );
    const item = matchedSKU ? MOCK_ITEMS[matchedSKU] : null;
    setScanned({
      barcode: trimmed,
      sku: matchedSKU || trimmed,
      name: item?.name || 'Unknown Item',
      location: item?.location || '—',
      qty: item?.qty ?? '—',
      status: item?.status || 'Unknown',
      found: !!item,
    });
    setScanInput(trimmed);
    toast(item ? `✓ Found: ${item.name}` : `Barcode scanned: ${trimmed}`);
  };

  const handleManualLookup = () => {
    if (!scanInput.trim()) { toast('Enter a barcode or SKU', 'error'); return; }
    handleScannedCode(scanInput.trim());
  };

  const handleSKUSelect = (sku) => {
    setSelectedSKU(sku);
    if (sku) handleScannedCode(sku);
  };

  const clearScan = () => { setScanned(null); setScanInput(''); setSelectedSKU(''); };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
      {/* Scanner panel */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm flex flex-col gap-4">
        <div className="text-sm font-bold text-gray-800">Barcode Scanner</div>

        {/* SKU dropdown — quick select */}
        <div>
          <label className="text-xs font-semibold text-gray-600 block mb-1.5">Select SKU</label>
          <select
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none bg-white text-gray-800 focus:border-red-500 focus:ring-2 focus:ring-red-100 font-[inherit]"
            value={selectedSKU}
            onChange={e => handleSKUSelect(e.target.value)}
          >
            <option value="">— Select a SKU to lookup —</option>
            {Object.entries(MOCK_ITEMS).map(([sku, item]) => (
              <option key={sku} value={sku}>{sku} — {item.name}</option>
            ))}
          </select>
        </div>

        {/* Manual entry */}
        <div>
          <label className="text-xs font-semibold text-gray-600 block mb-1.5">Manual Entry / USB Scanner</label>
          <div className="flex gap-2">
            <input
              className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none bg-white text-gray-800 focus:border-red-500 focus:ring-2 focus:ring-red-100 placeholder:text-gray-400 font-[inherit]"
              placeholder="Type barcode or SKU, press Enter…"
              value={scanInput}
              onChange={e => setScanInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleManualLookup()}
            />
            <button onClick={handleManualLookup}
              className="px-4 py-2 bg-gradient-to-br from-red-500 to-red-700 text-white rounded-lg text-sm font-semibold border-0 cursor-pointer font-[inherit] whitespace-nowrap">
              Lookup
            </button>
          </div>
        </div>

        {/* Camera section */}
        <div>
          <label className="text-xs font-semibold text-gray-600 block mb-1.5">
            Camera Scanner
            {!hasDetector && <span className="ml-2 text-amber-600 font-normal">(auto-detect not supported — use manual entry)</span>}
          </label>

          {/* Video feed */}
          <div className="relative rounded-xl overflow-hidden bg-gray-900" style={{ aspectRatio: '16/9' }}>
            <video
              ref={videoRef}
              className="w-full h-full object-cover"
              playsInline
              muted
              style={{ display: cameraOn ? 'block' : 'none' }}
            />
            {!cameraOn && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-white">
                <div className="text-4xl">📷</div>
                <div className="text-sm font-medium text-gray-300">Camera is off</div>
                {cameraErr && <div className="text-xs text-red-400 text-center px-4">{cameraErr}</div>}
              </div>
            )}
            {cameraOn && scanning && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="border-2 border-red-400 rounded-lg" style={{ width: '60%', height: '40%', boxShadow: '0 0 0 9999px rgba(0,0,0,0.45)' }}>
                  <div className="absolute top-0 left-0 w-5 h-5 border-t-2 border-l-2 border-red-400 rounded-tl" />
                  <div className="absolute top-0 right-0 w-5 h-5 border-t-2 border-r-2 border-red-400 rounded-tr" />
                  <div className="absolute bottom-0 left-0 w-5 h-5 border-b-2 border-l-2 border-red-400 rounded-bl" />
                  <div className="absolute bottom-0 right-0 w-5 h-5 border-b-2 border-r-2 border-red-400 rounded-br" />
                </div>
                <div className="absolute bottom-3 text-xs text-white bg-black/50 px-3 py-1 rounded-full">Scanning…</div>
              </div>
            )}
          </div>

          {/* Camera controls */}
          <div className="flex gap-2 mt-3">
            {!cameraOn ? (
              <button onClick={startCamera}
                className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-br from-slate-700 to-slate-900 text-white rounded-xl text-sm font-semibold border-0 cursor-pointer font-[inherit]">
                📷 Start Camera
              </button>
            ) : (
              <button onClick={stopCamera}
                className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-red-100 text-red-700 rounded-xl text-sm font-semibold border-0 cursor-pointer font-[inherit]">
                ⏹ Stop Camera
              </button>
            )}
            {scanned && (
              <button onClick={clearScan}
                className="px-4 py-2.5 bg-gray-100 text-gray-600 rounded-xl text-sm font-semibold border-0 cursor-pointer font-[inherit]">
                Clear
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Result panel */}
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
              {scanned.found ? '✓ Item Found' : '⚠ Unknown Barcode'}
            </div>

            <div className="space-y-0 mb-4">
              {[
                ['Barcode', <span className="font-mono text-xs">{scanned.barcode}</span>],
                ['SKU', scanned.sku],
                ['Item Name', scanned.name],
                ['Location', scanned.location],
                ['Current Qty', scanned.qty],
                ['Status', <StatusBadge status={scanned.status} />],
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
                    { label: 'Inward',   cls: 'bg-gradient-to-br from-green-500 to-green-700 text-white' },
                    { label: 'Outward',  cls: 'border border-red-600 text-red-700 bg-transparent' },
                    { label: 'Transfer', cls: 'bg-gray-100 text-gray-700' },
                  ].map(b => (
                    <button key={b.label} onClick={() => toast(`${b.label} action for ${scanned.sku}`)}
                      className={`flex-1 py-2 text-xs rounded-lg font-semibold border-0 cursor-pointer font-[inherit] ${b.cls}`}>
                      {b.label}
                    </button>
                  ))}
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { label: '📦 GRN Receipt',    cls: 'bg-green-50 text-green-800'  },
                    { label: '🔍 Picking',         cls: 'bg-blue-50 text-blue-800'   },
                    { label: '🚚 Dispatch',        cls: 'bg-amber-50 text-amber-800' },
                    { label: '↔ Stock Transfer',  cls: 'bg-purple-50 text-purple-800'},
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
  const [activeTab, setActiveTab] = useState(initialTab);

  return (
    <div>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'flex-end', gap:10, marginBottom:20 }}>
        {activeTab === 2 && (
          <button onClick={() => toast('Exporting logs…')} style={{
            display:'inline-flex', alignItems:'center', gap:6,
            padding:'8px 16px', borderRadius:10,
            background:'transparent', color:'#c0392b',
            border:'1.5px solid #c0392b', cursor:'pointer',
            fontSize:13, fontWeight:600, fontFamily:'inherit',
          }}>⬇ Export Logs</button>
        )}
      </div>

      {activeTab === 0 && <BarcodeGenerator />}
      {activeTab === 1 && <BarcodeScanner />}

      {activeTab === 2 && (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100">
            <div className="text-sm font-bold text-gray-800">Movement Logs</div>
            <div className="text-xs text-gray-400 mt-0.5">{movementLogs.length} recent scan events</div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr>{['Log ID','Barcode','Item','Action','Location','Operator','Time'].map(h => <th key={h} className={thCls}>{h}</th>)}</tr>
              </thead>
              <tbody>
                {movementLogs.map((l, i) => (
                  <tr key={i} className={trCls}>
                    <td className={`${tdCls} font-semibold text-red-700`}>{l.id}</td>
                    <td className={`${tdCls} font-mono text-xs`}>{l.barcode}</td>
                    <td className={`${tdCls} font-semibold`}>{l.item}</td>
                    <td className={tdCls}><StatusBadge status={l.action} /></td>
                    <td className={tdCls}>{l.location}</td>
                    <td className={tdCls}>{l.operator}</td>
                    <td className={`${tdCls} text-gray-400 text-xs`}>{l.time}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
