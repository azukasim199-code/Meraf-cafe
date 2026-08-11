import React, { useEffect, useState } from 'react';
import { CafeSettings } from '../types';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import {
  Settings,
  Save,
  Download,
  AlertCircle,
  ToggleLeft,
  ToggleRight,
  Database,
  Check,
  RefreshCw,
} from 'lucide-react';

export const AdminSettings: React.FC = () => {
  const { token } = useAuth();
  const { t } = useLanguage();

  const [settings, setSettings] = useState<CafeSettings | null>(null);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [savedMessage, setSavedMessage] = useState<string | null>(null);

  const fetchSettings = () => {
    fetch('/api/admin/settings', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => setSettings(data))
      .catch((err) => console.error(err));
  };

  useEffect(() => {
    fetchSettings();
  }, [token]);

  const handleSave = async () => {
    if (!settings) return;
    setIsSaving(true);
    setSavedMessage(null);

    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(settings),
      });

      if (res.ok) {
        setSavedMessage('Settings saved successfully!');
        setTimeout(() => setSavedMessage(null), 3000);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDownloadSqlSchema = () => {
    window.open('/api/admin/export-sql', '_blank');
  };

  if (!settings) {
    return (
      <div className="py-20 text-center">
        <RefreshCw className="w-8 h-8 text-amber-600 animate-spin mx-auto" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-[#121215] p-5 rounded-2xl border border-zinc-800 shadow-xl flex items-center justify-between flex-wrap gap-4">
        <div>
          <h3 className="font-serif-luxury font-bold text-white text-lg">{t('settings')}</h3>
          <p className="text-zinc-400 text-xs mt-0.5">
            Configure cafe identity, operating status, tax/service charge, and export database migrations.
          </p>
        </div>

        <button
          type="button"
          onClick={handleSave}
          disabled={isSaving}
          className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-stone-950 font-black px-5 py-2.5 rounded-xl text-xs flex items-center gap-2 shadow-md shadow-amber-500/20 transition-all"
        >
          <Save className="w-4 h-4" />
          <span>{isSaving ? 'Saving...' : t('save')}</span>
        </button>
      </div>

      {savedMessage && (
        <div className="p-3 bg-emerald-950/80 border border-emerald-500/40 rounded-xl text-emerald-300 text-xs font-bold flex items-center gap-2">
          <Check className="w-4 h-4" />
          <span>{savedMessage}</span>
        </div>
      )}

      {/* Closed Mode Toggle & Reason Customization */}
      <div
        className={`p-5 rounded-2xl border transition-all space-y-4 ${
          settings.isClosed
            ? 'bg-red-950/40 border-red-500/40 text-red-200'
            : 'bg-emerald-950/40 border-emerald-500/40 text-emerald-200'
        }`}
      >
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h4 className="font-bold text-white text-sm flex items-center gap-2">
              <span>Cafe Status:</span>
              <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-black tracking-wider uppercase ${
                settings.isClosed ? 'bg-red-500/20 text-red-400 border border-red-500/40' : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
              }`}>
                {settings.isClosed ? 'CLOSED MODE ACTIVE' : 'OPEN FOR ORDERS'}
              </span>
            </h4>
            <p className="text-xs text-zinc-400 mt-1">
              {settings.isClosed
                ? 'Server-side enforcement is active. New customer order submissions are strictly blocked.'
                : 'Cafe is open for incoming QR orders from table scanners.'}
            </p>
          </div>

          <button
            type="button"
            onClick={async () => {
              const updatedSettings = { ...settings, isClosed: !settings.isClosed };
              setSettings(updatedSettings);
              setIsSaving(true);
              try {
                const res = await fetch('/api/admin/settings', {
                  method: 'PUT',
                  headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                  },
                  body: JSON.stringify(updatedSettings),
                });
                if (res.ok) {
                  setSavedMessage(updatedSettings.isClosed ? 'Cafe Closed mode enabled! New orders blocked.' : 'Cafe re-opened! Taking new orders.');
                  setTimeout(() => setSavedMessage(null), 3500);
                }
              } catch (e) {
                console.error(e);
              } finally {
                setIsSaving(false);
              }
            }}
            className={`px-4 py-2.5 rounded-xl text-xs font-black shadow-lg transition-all flex items-center gap-1.5 ${
              settings.isClosed
                ? 'bg-emerald-400 hover:bg-emerald-300 text-stone-950 shadow-emerald-500/20'
                : 'bg-red-500 hover:bg-red-400 text-white shadow-red-500/20'
            }`}
          >
            {settings.isClosed ? (
              <>
                <ToggleRight className="w-4 h-4" />
                <span>Reopen Cafe Now</span>
              </>
            ) : (
              <>
                <ToggleLeft className="w-4 h-4" />
                <span>Close Cafe Now</span>
              </>
            )}
          </button>
        </div>

        {/* Closed Reason Customization */}
        <div className="pt-3 border-t border-zinc-800/80 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div>
            <label className="block font-bold text-zinc-300 mb-1">
              Closure Notice (English)
            </label>
            <input
              type="text"
              value={settings.closedReasonEn || ''}
              onChange={(e) => setSettings({ ...settings, closedReasonEn: e.target.value })}
              placeholder="e.g. Meraf Cafe is currently closed for kitchen restocking."
              className="w-full p-2.5 bg-zinc-900 border border-zinc-800 text-slate-100 rounded-xl focus:outline-none focus:ring-1 focus:ring-amber-500"
            />
          </div>

          <div>
            <label className="block font-bold text-zinc-300 mb-1">
              Closure Notice (Amharic - አማርኛ)
            </label>
            <input
              type="text"
              value={settings.closedReasonAm || ''}
              onChange={(e) => setSettings({ ...settings, closedReasonAm: e.target.value })}
              placeholder="ምሳሌ፡ መራፍ ካፌ በዕቃ ማዘጋጀት ምክንያት ለጊዜው ዝግ ነው።"
              className="w-full p-2.5 bg-zinc-900 border border-zinc-800 text-slate-100 rounded-xl focus:outline-none focus:ring-1 focus:ring-amber-500"
            />
          </div>
        </div>
      </div>

      {/* Main Settings Form */}
      <div className="bg-[#121215] p-6 rounded-2xl border border-zinc-800 shadow-xl space-y-4 text-xs">
        <h4 className="font-serif-luxury font-bold text-amber-400 text-sm uppercase tracking-wider border-b border-zinc-800/80 pb-2">
          General Cafe Info
        </h4>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block font-bold text-slate-200 mb-1">Cafe Name</label>
            <input
              type="text"
              value={settings.cafeName}
              onChange={(e) => setSettings({ ...settings, cafeName: e.target.value })}
              className="w-full p-2.5 bg-zinc-900 border border-zinc-800 text-slate-100 rounded-xl focus:outline-none focus:ring-1 focus:ring-amber-500"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-200 mb-1">Phone Number</label>
            <input
              type="text"
              value={settings.phone}
              onChange={(e) => setSettings({ ...settings, phone: e.target.value })}
              className="w-full p-2.5 bg-zinc-900 border border-zinc-800 text-slate-100 rounded-xl focus:outline-none focus:ring-1 focus:ring-amber-500"
            />
          </div>
        </div>

        <div>
          <label className="block font-bold text-slate-200 mb-1">Address in Addis Ababa</label>
          <input
            type="text"
            value={settings.address}
            onChange={(e) => setSettings({ ...settings, address: e.target.value })}
            className="w-full p-2.5 bg-zinc-900 border border-zinc-800 text-slate-100 rounded-xl focus:outline-none focus:ring-1 focus:ring-amber-500"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block font-bold text-slate-200 mb-1">Opening Hours (English)</label>
            <input
              type="text"
              value={settings.openingHoursEn}
              onChange={(e) => setSettings({ ...settings, openingHoursEn: e.target.value })}
              className="w-full p-2.5 bg-zinc-900 border border-zinc-800 text-slate-100 rounded-xl focus:outline-none focus:ring-1 focus:ring-amber-500"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-200 mb-1">Opening Hours (Amharic)</label>
            <input
              type="text"
              value={settings.openingHoursAm}
              onChange={(e) => setSettings({ ...settings, openingHoursAm: e.target.value })}
              className="w-full p-2.5 bg-zinc-900 border border-zinc-800 text-slate-100 rounded-xl focus:outline-none focus:ring-1 focus:ring-amber-500"
            />
          </div>
        </div>

        <h4 className="font-serif-luxury font-bold text-amber-400 text-sm uppercase tracking-wider border-b border-zinc-800/80 pb-2 pt-4">
          Taxes & Charges
        </h4>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block font-bold text-slate-200 mb-1">Tax Rate (%)</label>
            <input
              type="number"
              value={settings.taxRatePercent}
              onChange={(e) => setSettings({ ...settings, taxRatePercent: parseFloat(e.target.value) || 0 })}
              className="w-full p-2.5 bg-zinc-900 border border-zinc-800 text-slate-100 rounded-xl focus:outline-none focus:ring-1 focus:ring-amber-500"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-200 mb-1">Service Charge (%)</label>
            <input
              type="number"
              value={settings.serviceChargePercent}
              onChange={(e) => setSettings({ ...settings, serviceChargePercent: parseFloat(e.target.value) || 0 })}
              className="w-full p-2.5 bg-zinc-900 border border-zinc-800 text-slate-100 rounded-xl focus:outline-none focus:ring-1 focus:ring-amber-500"
            />
          </div>
        </div>
      </div>

      {/* SQL Migration Export Section */}
      <div className="bg-[#121215] text-slate-100 p-6 rounded-2xl border border-zinc-800 shadow-xl space-y-3">
        <div className="flex items-center gap-2 text-amber-400 font-serif-luxury font-bold text-base">
          <Database className="w-5 h-5" />
          <span>Export PostgreSQL / Supabase Schema SQL</span>
        </div>
        <p className="text-zinc-400 text-xs leading-relaxed">
          Need to deploy or migrate this system to a standalone PostgreSQL or Supabase cloud instance?
          Download the production SQL script with tables, constraints, foreign keys, and indexes ready.
        </p>

        <button
          type="button"
          onClick={handleDownloadSqlSchema}
          className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-stone-950 font-black px-4 py-2.5 rounded-xl text-xs inline-flex items-center gap-2 shadow-md shadow-amber-500/20 transition-colors"
        >
          <Download className="w-4 h-4" />
          <span>Download meraf_cafe_schema.sql</span>
        </button>
      </div>
    </div>
  );
};
