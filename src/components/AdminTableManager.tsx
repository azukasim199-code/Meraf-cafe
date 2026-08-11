import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { CafeTable } from '../types';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import {
  QrCode,
  Plus,
  RefreshCw,
  Printer,
  Download,
  Trash2,
  Check,
  X,
  Utensils,
  Sliders,
  Sparkles,
  Wifi,
  ExternalLink,
  Copy,
} from 'lucide-react';

export const AdminTableManager: React.FC = () => {
  const { token } = useAuth();
  const { t } = useLanguage();

  const [tables, setTables] = useState<CafeTable[]>([]);
  const [newTableNum, setNewTableNum] = useState<string>('');
  const [selectedTableForQr, setSelectedTableForQr] = useState<CafeTable | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [qrTargetUrl, setQrTargetUrl] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // QR Customizer Controls State
  const [customTitle, setCustomTitle] = useState<string>('MERAF CAFE • RAFAEL SHEGOLE');
  const [customSubtitle, setCustomSubtitle] = useState<string>('Scan phone camera to view menu & place order');
  const [customWifi, setCustomWifi] = useState<string>('Wi-Fi: MerafGuest | Pass: Coffee2026');
  const [qrTheme, setQrTheme] = useState<'dark' | 'light' | 'amber'>('dark');
  const [qrWidth, setQrWidth] = useState<number>(600);
  const [copiedTokenId, setCopiedTokenId] = useState<string | null>(null);

  const handleCopyLink = (tbl: CafeTable) => {
    const url = `${window.location.origin}/order/${tbl.token}`;
    navigator.clipboard.writeText(url);
    setCopiedTokenId(tbl.id);
    setTimeout(() => setCopiedTokenId(null), 2000);
  };

  const fetchTables = () => {
    setIsLoading(true);
    fetch('/api/tables/admin/list', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setTables(data);
      })
      .catch((err) => console.error(err))
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    fetchTables();
  }, [token]);

  // Generate client-side QR code with qrcode library
  const generateQrData = async (tbl: CafeTable, width: number = qrWidth, theme: 'dark' | 'light' | 'amber' = qrTheme) => {
    const origin = window.location.origin;
    const targetUrl = `${origin}/order/${tbl.token}`;
    setQrTargetUrl(targetUrl);

    try {
      const darkColor = theme === 'light' ? '#000000' : theme === 'amber' ? '#b45309' : '#18181b';
      const lightColor = '#FFFFFF';

      const dataUrl = await QRCode.toDataURL(targetUrl, {
        errorCorrectionLevel: 'H',
        margin: 2,
        width,
        color: {
          dark: darkColor,
          light: lightColor,
        },
      });
      setQrDataUrl(dataUrl);
    } catch (err) {
      console.error('Failed client-side QRCode generation:', err);
      // Fallback to server endpoint
      try {
        const res = await fetch(`/api/tables/qr/${tbl.token}`);
        const data = await res.json();
        if (data.qrDataUrl) {
          setQrDataUrl(data.qrDataUrl);
          setQrTargetUrl(data.qrTargetUrl);
        }
      } catch (e) {
        console.error(e);
      }
    }
  };

  useEffect(() => {
    if (selectedTableForQr) {
      generateQrData(selectedTableForQr, qrWidth, qrTheme);
    }
  }, [selectedTableForQr, qrWidth, qrTheme]);

  const handleCreateTable = async () => {
    if (!newTableNum.trim()) return;
    try {
      const res = await fetch('/api/tables/admin/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ tableNumber: newTableNum }),
      });
      if (res.ok) {
        setNewTableNum('');
        fetchTables();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleToggleTable = async (tbl: CafeTable) => {
    try {
      const res = await fetch(`/api/tables/admin/${tbl.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ isActive: !tbl.isActive }),
      });
      if (res.ok) fetchTables();
    } catch (e) {
      console.error(e);
    }
  };

  const handleRegenerateToken = async (tbl: CafeTable) => {
    if (!confirm(`Regenerate QR token for Table ${tbl.tableNumber}? Old printed QR codes will stop working.`)) return;
    try {
      const res = await fetch(`/api/tables/admin/${tbl.id}/regenerate`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) fetchTables();
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteTable = async (tbl: CafeTable) => {
    if (!confirm(`Delete Table ${tbl.tableNumber}?`)) return;
    try {
      const res = await fetch(`/api/tables/admin/${tbl.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) fetchTables();
    } catch (e) {
      console.error(e);
    }
  };

  const handleGenerateQrModal = (tbl: CafeTable) => {
    setSelectedTableForQr(tbl);
  };

  const [batchQrList, setBatchQrList] = useState<{ tableNumber: string; qrDataUrl: string; targetUrl: string }[]>([]);
  const [isGeneratingBatch, setIsGeneratingBatch] = useState<boolean>(false);
  const [showBatchModal, setShowBatchModal] = useState<boolean>(false);

  const handleGenerateBatchQrs = async () => {
    setIsGeneratingBatch(true);
    setShowBatchModal(true);
    const origin = window.location.origin;
    const results: { tableNumber: string; qrDataUrl: string; targetUrl: string }[] = [];

    try {
      for (const tbl of tables) {
        if (!tbl.isActive) continue;
        const targetUrl = `${origin}/order/${tbl.token}`;
        const dataUrl = await QRCode.toDataURL(targetUrl, {
          errorCorrectionLevel: 'H',
          margin: 2,
          width: qrWidth,
          color: { dark: '#18181b', light: '#FFFFFF' },
        });
        results.push({
          tableNumber: tbl.tableNumber,
          qrDataUrl: dataUrl,
          targetUrl,
        });
      }
      setBatchQrList(results);
    } catch (e) {
      console.error('Batch QR generation error:', e);
    } finally {
      setIsGeneratingBatch(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & New Table Form */}
      <div className="bg-[#121215] p-5 rounded-2xl border border-zinc-800 shadow-xl flex items-center justify-between flex-wrap gap-4">
        <div>
          <h3 className="font-serif-luxury font-bold text-white text-lg">{t('tableManagement')}</h3>
          <p className="text-zinc-400 text-xs mt-0.5">
            Manage table QR tokens, generate high-resolution print codes, and enable/disable tables.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={handleGenerateBatchQrs}
            disabled={tables.length === 0}
            className="bg-zinc-900 border border-amber-500/30 hover:border-amber-500 text-amber-400 font-bold px-3.5 py-2 rounded-xl text-xs flex items-center gap-1.5 shadow-md transition-all disabled:opacity-50"
          >
            <Printer className="w-4 h-4" />
            <span>Print All Table QRs</span>
          </button>

          <div className="flex items-center gap-1.5 bg-zinc-900 p-1 rounded-xl border border-zinc-800">
            <input
              type="text"
              value={newTableNum}
              onChange={(e) => setNewTableNum(e.target.value)}
              placeholder="e.g. 11"
              className="w-20 px-2.5 py-1.5 text-xs bg-transparent text-slate-100 focus:outline-none"
            />
            <button
              type="button"
              onClick={handleCreateTable}
              className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-stone-950 font-black px-3.5 py-1.5 rounded-lg text-xs flex items-center gap-1 shadow-md shadow-amber-500/20 transition-all"
            >
              <Plus className="w-3.5 h-3.5 stroke-[3]" />
              <span>Add Table</span>
            </button>
          </div>
        </div>
      </div>

      {/* Table Cards Grid */}
      {isLoading ? (
        <div className="py-20 text-center">
          <RefreshCw className="w-8 h-8 text-amber-400 animate-spin mx-auto" />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {tables.map((tbl) => (
            <div
              key={tbl.id}
              className={`bg-[#121215] p-5 rounded-2xl border shadow-xl space-y-4 transition-all flex flex-col justify-between ${
                tbl.isActive ? 'border-zinc-800' : 'border-red-900/50 bg-red-950/20 opacity-80'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="p-2 bg-amber-500/10 text-amber-400 rounded-xl border border-amber-500/20">
                      <Utensils className="w-5 h-5" />
                    </div>
                    <h4 className="font-serif-luxury font-bold text-lg text-white">
                      Table #{tbl.tableNumber}
                    </h4>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleToggleTable(tbl)}
                    className={`px-2.5 py-1 rounded-full text-[10px] font-bold flex items-center gap-1 ${
                      tbl.isActive
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        : 'bg-red-500/20 text-red-400 border border-red-500/30'
                    }`}
                  >
                    {tbl.isActive ? <Check className="w-3 h-3 stroke-[3]" /> : <X className="w-3 h-3 stroke-[3]" />}
                    <span>{tbl.isActive ? 'Active' : 'Disabled'}</span>
                  </button>
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-[11px] text-zinc-400 font-mono bg-zinc-900 p-2 rounded-lg border border-zinc-800">
                    <span className="truncate pr-2">{tbl.token}</span>
                    <button
                      type="button"
                      onClick={() => handleCopyLink(tbl)}
                      title="Copy Direct Order Link"
                      className="text-amber-400 hover:text-amber-300 transition-colors p-0.5 rounded"
                    >
                      {copiedTokenId === tbl.id ? (
                        <span className="text-[9px] font-sans font-bold text-emerald-400">Copied!</span>
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>

                  <a
                    href={`/order/${tbl.token}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-400/90 hover:text-amber-400 hover:underline pt-0.5"
                  >
                    <ExternalLink className="w-3 h-3" />
                    <span>Test Customer Link</span>
                  </a>
                </div>
              </div>

              <div className="pt-3 border-t border-zinc-800 flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => handleGenerateQrModal(tbl)}
                  className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-stone-950 px-3 py-1.5 rounded-xl text-xs font-black flex items-center gap-1.5 shadow-md shadow-amber-500/20 transition-colors"
                >
                  <QrCode className="w-3.5 h-3.5" />
                  <span>Customize & QR</span>
                </button>

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => handleCopyLink(tbl)}
                    title="Copy Link"
                    className="p-1.5 text-zinc-400 hover:text-amber-400 hover:bg-zinc-900 rounded-lg transition-colors"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>

                  <button
                    type="button"
                    onClick={() => handleRegenerateToken(tbl)}
                    title="Regenerate Token"
                    className="p-1.5 text-zinc-400 hover:text-amber-400 hover:bg-zinc-900 rounded-lg transition-colors"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDeleteTable(tbl)}
                    title="Delete Table"
                    className="p-1.5 text-zinc-500 hover:text-red-400 hover:bg-zinc-900 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Interactive QR Code Generator Utility Modal */}
      {selectedTableForQr && qrDataUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950/80 backdrop-blur-md p-4 overflow-y-auto">
          <div className="bg-[#121215] rounded-3xl max-w-2xl w-full p-6 space-y-6 shadow-2xl relative border border-zinc-800 my-6 print:max-w-full print:shadow-none print:p-0 print:border-none print:bg-white">
            <div className="flex justify-between items-center border-b border-zinc-800 pb-3 print:hidden">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-amber-400" />
                <h3 className="font-serif-luxury font-bold text-lg text-white">
                  Table #{selectedTableForQr.tableNumber} QR Code Generator
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedTableForQr(null)}
                className="p-1.5 rounded-full bg-zinc-900 text-zinc-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
              {/* QR Customizer Settings Form */}
              <div className="space-y-4 print:hidden bg-stone-950 p-4 rounded-2xl border border-zinc-800">
                <div className="flex items-center gap-1.5 text-amber-400 font-bold text-xs">
                  <Sliders className="w-4 h-4" />
                  <span>Label Customization Settings</span>
                </div>

                <div>
                  <label className="block text-zinc-400 text-[11px] font-semibold mb-1">
                    Header Banner
                  </label>
                  <input
                    type="text"
                    value={customTitle}
                    onChange={(e) => setCustomTitle(e.target.value)}
                    className="w-full px-3 py-1.5 bg-zinc-900 border border-zinc-800 rounded-xl text-white text-xs focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-zinc-400 text-[11px] font-semibold mb-1">
                    Call to Action Message
                  </label>
                  <input
                    type="text"
                    value={customSubtitle}
                    onChange={(e) => setCustomSubtitle(e.target.value)}
                    className="w-full px-3 py-1.5 bg-zinc-900 border border-zinc-800 rounded-xl text-white text-xs focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-zinc-400 text-[11px] font-semibold mb-1">
                    Wi-Fi Instructions (Optional)
                  </label>
                  <input
                    type="text"
                    value={customWifi}
                    onChange={(e) => setCustomWifi(e.target.value)}
                    className="w-full px-3 py-1.5 bg-zinc-900 border border-zinc-800 rounded-xl text-white text-xs focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-zinc-400 text-[11px] font-semibold mb-1">
                      Theme Style
                    </label>
                    <select
                      value={qrTheme}
                      onChange={(e) => setQrTheme(e.target.value as any)}
                      className="w-full px-2.5 py-1.5 bg-zinc-900 border border-zinc-800 rounded-xl text-white text-xs focus:outline-none focus:border-amber-500"
                    >
                      <option value="dark">Luxury Dark</option>
                      <option value="light">Print Light</option>
                      <option value="amber">Amber Gold</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-zinc-400 text-[11px] font-semibold mb-1">
                      Resolution
                    </label>
                    <select
                      value={qrWidth}
                      onChange={(e) => setQrWidth(Number(e.target.value))}
                      className="w-full px-2.5 py-1.5 bg-zinc-900 border border-zinc-800 rounded-xl text-white text-xs focus:outline-none focus:border-amber-500"
                    >
                      <option value={400}>400px (Fast)</option>
                      <option value={600}>600px (Standard)</option>
                      <option value={1000}>1000px (High-Res)</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Printable Poster Preview */}
              <div
                className={`p-6 rounded-2xl text-center space-y-4 shadow-2xl transition-colors border ${
                  qrTheme === 'light'
                    ? 'bg-white text-slate-900 border-slate-300'
                    : qrTheme === 'amber'
                    ? 'bg-gradient-to-b from-stone-950 to-amber-950 text-white border-amber-500/50'
                    : 'bg-stone-950 text-white border-zinc-800'
                }`}
              >
                <div>
                  <p
                    className={`font-serif-luxury font-extrabold tracking-widest uppercase text-[11px] ${
                      qrTheme === 'light' ? 'text-amber-700' : 'text-amber-400'
                    }`}
                  >
                    {customTitle}
                  </p>
                  <h2
                    className={`font-serif-luxury font-black text-2xl mt-1 ${
                      qrTheme === 'light' ? 'text-slate-900' : 'text-white'
                    }`}
                  >
                    TABLE #{selectedTableForQr.tableNumber}
                  </h2>
                </div>

                <div className="bg-white p-3 rounded-2xl inline-block shadow-lg mx-auto border border-zinc-200">
                  <img src={qrDataUrl} alt="Table QR Code" className="w-48 h-48 mx-auto" />
                </div>

                <p
                  className={`text-xs font-semibold max-w-xs mx-auto leading-relaxed ${
                    qrTheme === 'light' ? 'text-slate-700' : 'text-zinc-300'
                  }`}
                >
                  {customSubtitle}
                </p>

                {customWifi && (
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-500/10 border border-amber-500/30 text-amber-500 rounded-full text-[10px] font-bold">
                    <Wifi className="w-3 h-3" />
                    <span>{customWifi}</span>
                  </div>
                )}

                <div
                  className={`text-[9px] font-mono break-all px-2 ${
                    qrTheme === 'light' ? 'text-slate-500' : 'text-amber-400/80'
                  }`}
                >
                  {qrTargetUrl}
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex gap-3 justify-end pt-3 border-t border-zinc-800 print:hidden">
              <a
                href={qrDataUrl}
                download={`meraf_cafe_table_${selectedTableForQr.tableNumber}_qr.png`}
                className="px-4 py-2 bg-zinc-900 hover:bg-zinc-800 text-zinc-200 border border-zinc-800 rounded-xl font-bold text-xs inline-flex items-center gap-1.5"
              >
                <Download className="w-4 h-4" />
                <span>Download PNG ({qrWidth}px)</span>
              </a>

              <button
                type="button"
                onClick={() => window.print()}
                className="px-5 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-stone-950 font-black rounded-xl text-xs inline-flex items-center gap-2 shadow-md shadow-amber-500/20"
              >
                <Printer className="w-4 h-4" />
                <span>Print Table Label</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Batch QR Posters Modal */}
      {showBatchModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950/80 backdrop-blur-md p-4 overflow-y-auto">
          <div className="bg-[#121215] rounded-3xl max-w-4xl w-full p-6 text-center space-y-6 shadow-2xl relative border border-zinc-800 my-8">
            <div className="flex justify-between items-center border-b border-zinc-800 pb-3 print:hidden">
              <div className="flex items-center gap-2">
                <Printer className="w-5 h-5 text-amber-400" />
                <h3 className="font-serif-luxury font-bold text-lg text-white">
                  Batch Table QR Code Posters ({batchQrList.length} Active Tables)
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowBatchModal(false)}
                className="p-1 rounded-full bg-zinc-900 text-zinc-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {isGeneratingBatch ? (
              <div className="py-12">
                <RefreshCw className="w-8 h-8 text-amber-400 animate-spin mx-auto mb-2" />
                <p className="text-zinc-400 text-xs font-semibold">Generating high-res QR codes for all cafe tables...</p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 max-h-[60vh] overflow-y-auto p-2">
                  {batchQrList.map((item) => (
                    <div
                      key={item.tableNumber}
                      className="p-5 bg-stone-950 text-white rounded-2xl space-y-3 border border-zinc-800 shadow-xl flex flex-col justify-between"
                    >
                      <div>
                        <div className="text-amber-400 font-serif-luxury font-extrabold tracking-widest uppercase text-[10px]">
                          MERAF CAFE
                        </div>
                        <h4 className="font-serif-luxury font-extrabold text-xl text-white">
                          TABLE #{item.tableNumber}
                        </h4>
                      </div>

                      <div className="bg-white p-3 rounded-xl inline-block mx-auto shadow-inner">
                        <img src={item.qrDataUrl} alt={`Table ${item.tableNumber} QR`} className="w-36 h-36 mx-auto" />
                      </div>

                      <p className="text-zinc-400 text-[10px] font-medium leading-tight">
                        Scan to order directly from Table #{item.tableNumber}
                      </p>

                      <a
                        href={item.qrDataUrl}
                        download={`meraf_cafe_table_${item.tableNumber}_qr.png`}
                        className="px-3 py-1.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-amber-400 rounded-lg font-bold text-[11px] inline-flex items-center justify-center gap-1 mt-1 print:hidden"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Download PNG</span>
                      </a>
                    </div>
                  ))}
                </div>

                <div className="flex gap-3 justify-end pt-3 border-t border-zinc-800 print:hidden">
                  <button
                    type="button"
                    onClick={() => setShowBatchModal(false)}
                    className="px-4 py-2 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 rounded-xl font-bold text-xs"
                  >
                    Close
                  </button>
                  <button
                    type="button"
                    onClick={() => window.print()}
                    className="px-5 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-stone-950 font-black rounded-xl text-xs inline-flex items-center gap-2 shadow-md shadow-amber-500/20"
                  >
                    <Printer className="w-4 h-4" />
                    <span>Print All Posters</span>
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
