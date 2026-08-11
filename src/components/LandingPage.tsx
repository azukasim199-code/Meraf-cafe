import React, { useEffect, useState } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { Coffee, Utensils, MapPin, Clock, Phone, Sparkles, ArrowRight, QrCode } from 'lucide-react';

interface LandingPageProps {
  onSelectTable: (tableToken: string) => void;
  onNavigate: (view: string) => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onSelectTable, onNavigate }) => {
  const { t, language } = useLanguage();
  const [tables, setTables] = useState<any[]>([]);

  useEffect(() => {
    fetch('/api/menu/public')
      .then((res) => res.json())
      .then(() => {
        return fetch('/api/tables/validate/tbl_meraf_tok_01_sample');
      })
      .catch((e) => console.error(e));

    fetch('/api/tables/admin/list')
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setTables(data);
      })
      .catch((e) => console.error(e));
  }, []);

  return (
    <div className="space-y-12 pb-16">
      {/* Hero Section */}
      <div className="relative rounded-3xl overflow-hidden bg-[#0F0F12] text-slate-100 shadow-2xl border border-zinc-800/80">
        <div className="absolute inset-0 z-0 opacity-40">
          <img
            src="https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&q=80&w=1600"
            alt="Meraf Cafe Atmosphere"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0A] via-[#0F0F12]/80 to-transparent" />
        </div>

        <div className="relative z-10 p-8 sm:p-12 lg:p-16 max-w-3xl space-y-6">
          <span className="bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-bold uppercase tracking-wider px-3.5 py-1.5 rounded-full inline-flex items-center gap-1.5 backdrop-blur-md">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            Rafael shegole • Addis Ababa
          </span>

          <h1 className="font-serif-luxury text-3xl sm:text-5xl font-extrabold tracking-tight leading-tight text-white drop-shadow-md">
            {t('welcomeTitle')}
          </h1>

          <p className="text-zinc-300 text-sm sm:text-base leading-relaxed max-w-2xl">
            {t('welcomeSubtitle')}
          </p>

          {/* Physical Table QR Notice & Fallback Selector */}
          <div className="pt-4 space-y-3 border-t border-zinc-800/80">
            <div className="p-4 bg-amber-950/40 border border-amber-500/30 rounded-2xl flex items-start gap-3">
              <QrCode className="w-6 h-6 text-amber-400 shrink-0 mt-0.5" />
              <div className="space-y-1 text-left">
                <h4 className="text-xs font-bold text-amber-300 uppercase tracking-wider">
                  How Ordering Works at Meraf Cafe
                </h4>
                <p className="text-xs text-zinc-300 leading-relaxed">
                  Every table in the cafe has its own <strong className="text-white">unique physical QR code sticker</strong>.
                  Simply open your phone camera, scan the QR code on your table, and the menu opens automatically with your table attached! <span className="text-amber-400 font-medium">No app download needed.</span>
                </p>
              </div>
            </div>

            <div className="space-y-2 pt-1">
              <label className="block text-xs font-bold uppercase tracking-wider text-amber-400/90">
                Or Select Table Manually (Web Demo & Testing):
              </label>

              <div className="flex flex-wrap gap-2.5">
                {tables.length > 0 ? (
                  tables.slice(0, 8).map((tbl) => (
                    <button
                      key={tbl.id}
                      type="button"
                      onClick={() => onSelectTable(tbl.token)}
                      className="px-4 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-stone-950 font-bold text-xs rounded-xl shadow-lg shadow-amber-500/20 transition-all flex items-center gap-1.5 border border-amber-400/40 transform hover:-translate-y-0.5 cursor-pointer"
                    >
                      <Utensils className="w-3.5 h-3.5" />
                      <span>Table #{tbl.tableNumber}</span>
                    </button>
                  ))
                ) : (
                  <button
                    type="button"
                    onClick={() => onSelectTable('tbl_meraf_tok_01_sample')}
                    className="px-5 py-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-stone-950 font-bold text-xs rounded-xl shadow-lg shadow-amber-500/20 transition-all flex items-center gap-2 transform hover:-translate-y-0.5 cursor-pointer"
                  >
                    <QrCode className="w-4 h-4" />
                    <span>Start Order on Table #01</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Specialty Highlights */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="glass-card glass-card-hover p-6 rounded-2xl space-y-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/30 text-amber-400 flex items-center justify-center">
            <Coffee className="w-5 h-5" />
          </div>
          <h3 className="font-serif-luxury font-bold text-lg text-white">Ethiopian Coffee & Jebena</h3>
          <p className="text-zinc-400 text-xs leading-relaxed">
            Freshly roasted organic Ethiopian coffee beans brewed ceremonially in traditional Jebena or espresso.
          </p>
        </div>

        <div className="glass-card glass-card-hover p-6 rounded-2xl space-y-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/30 text-amber-400 flex items-center justify-center">
            <Utensils className="w-5 h-5" />
          </div>
          <h3 className="font-serif-luxury font-bold text-lg text-white">Traditional & Modern Dishes</h3>
          <p className="text-zinc-400 text-xs leading-relaxed">
            From Chechebsa with Kibe & Honey to Bole Special Club Sandwiches and fresh Mango Spris.
          </p>
        </div>

        <div className="glass-card glass-card-hover p-6 rounded-2xl space-y-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/30 text-amber-400 flex items-center justify-center">
            <QrCode className="w-5 h-5" />
          </div>
          <h3 className="font-serif-luxury font-bold text-lg text-white">Instant Table QR Ordering</h3>
          <p className="text-zinc-400 text-xs leading-relaxed">
            No app download required. Scan the table code, customize your items, and track live kitchen updates.
          </p>
        </div>
      </div>
    </div>
  );
};
