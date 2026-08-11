import React, { useState } from 'react';
import { Category, Product, AddOn, CafeTable } from '../types';
import { useLanguage } from '../context/LanguageContext';
import { ProductModal } from './ProductModal';
import { Search, Sparkles, Clock, Plus, AlertCircle, Bell, CheckCircle2, Loader2, X, UtensilsCrossed, HelpCircle } from 'lucide-react';

interface CustomerMenuProps {
  categories: Category[];
  products: Product[];
  addOns: AddOn[];
  onAddToCart: (
    product: Product,
    selectedVariation?: any,
    selectedAddOns?: any,
    quantity?: number,
    specialInstructions?: string
  ) => void;
  activeTable?: CafeTable | null;
}

export const CustomerMenu: React.FC<CustomerMenuProps> = ({
  categories,
  products,
  addOns,
  onAddToCart,
  activeTable,
}) => {
  const { t, language } = useLanguage();
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeProductForModal, setActiveProductForModal] = useState<Product | null>(null);

  // Call Waiter Modal state
  const [isCallWaiterOpen, setIsCallWaiterOpen] = useState<boolean>(false);
  const [customTableNumber, setCustomTableNumber] = useState<string>(
    activeTable?.tableNumber ? String(activeTable.tableNumber) : ''
  );
  const [selectedReason, setSelectedReason] = useState<string>('General Assistance');
  const [isCalling, setIsCalling] = useState<boolean>(false);
  const [callSuccessMessage, setCallSuccessMessage] = useState<string | null>(null);
  const [callErrorMessage, setCallErrorMessage] = useState<string | null>(null);

  const handleCallWaiter = async (e: React.FormEvent) => {
    e.preventDefault();
    const tableNum = activeTable?.tableNumber || customTableNumber.trim();

    if (!tableNum) {
      setCallErrorMessage(
        language === 'am' ? 'እባክዎን የጠረጴዛ ቁጥርዎን ያስገቡ' : 'Please enter your Table Number'
      );
      return;
    }

    setIsCalling(true);
    setCallErrorMessage(null);
    setCallSuccessMessage(null);

    try {
      const res = await fetch('/api/tables/call-waiter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tableNumber: tableNum,
          tableToken: activeTable?.token,
          reason: selectedReason,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to call waiter');
      }

      setCallSuccessMessage(
        language === 'am'
          ? `ጥሪዎ ለጠረጴዛ #${tableNum} ተልኳል! ሰራተኛችን በቅርቡ ወደ እርሶ ይመጣል።`
          : `Waiter notified for Table #${tableNum}! Staff will be with you shortly.`
      );

      setTimeout(() => {
        setIsCallWaiterOpen(false);
        setCallSuccessMessage(null);
      }, 3000);
    } catch (err: any) {
      setCallErrorMessage(err.message || 'Error sending request');
    } finally {
      setIsCalling(false);
    }
  };

  const filteredProducts = products.filter((p) => {
    const matchesCategory = selectedCategoryId === 'all' || p.categoryId === selectedCategoryId;
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !q ||
      p.nameEn.toLowerCase().includes(q) ||
      p.nameAm.includes(q) ||
      p.descriptionEn.toLowerCase().includes(q) ||
      p.descriptionAm.includes(q);
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Search & Categories Bar */}
      <div className="space-y-4">
        {/* Search input & Call Waiter button */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t('searchPlaceholder')}
              className="w-full pl-10 pr-4 py-3 bg-[#121215] border border-zinc-800 rounded-2xl text-sm text-slate-100 focus:outline-none focus:ring-1 focus:ring-amber-500/60 focus:border-amber-500/60 transition-all placeholder:text-zinc-500"
            />
          </div>

          <button
            type="button"
            onClick={() => {
              setCallErrorMessage(null);
              setCallSuccessMessage(null);
              setIsCallWaiterOpen(true);
            }}
            className="px-4 py-3 bg-amber-500/10 border border-amber-500/40 hover:bg-amber-500/20 text-amber-400 hover:text-amber-300 rounded-2xl font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shrink-0 shadow-sm"
          >
            <Bell className="w-4 h-4 text-amber-400 animate-pulse" />
            <span>{t('callWaiter')}</span>
          </button>
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          <button
            type="button"
            onClick={() => setSelectedCategoryId('all')}
            className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all border ${
              selectedCategoryId === 'all'
                ? 'bg-amber-500 text-stone-950 border-amber-400 shadow-lg shadow-amber-500/20 font-bold'
                : 'bg-[#141418] border-zinc-800 text-zinc-300 hover:border-zinc-700 hover:text-white'
            }`}
          >
            {t('allCategories')}
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setSelectedCategoryId(cat.id)}
              className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all border ${
                selectedCategoryId === cat.id
                  ? 'bg-amber-500 text-stone-950 border-amber-400 shadow-lg shadow-amber-500/20 font-bold'
                  : 'bg-[#141418] border-zinc-800 text-zinc-300 hover:border-zinc-700 hover:text-white'
              }`}
            >
              {language === 'am' ? cat.nameAm : cat.nameEn}
            </button>
          ))}
        </div>
      </div>

      {/* Menu Grid */}
      {filteredProducts.length === 0 ? (
        <div className="text-center py-16 bg-[#121215] border border-dashed border-zinc-800 rounded-2xl p-6">
          <AlertCircle className="w-10 h-10 text-zinc-600 mx-auto mb-2" />
          <h4 className="text-zinc-300 font-bold text-sm">
            {language === 'am' ? 'ምንም አይነት ምግብ አልተገኘም' : 'No menu items found'}
          </h4>
          <p className="text-zinc-500 text-xs mt-1">
            {language === 'am'
              ? 'እባክዎን ሌላ ፍለጋ ይሞክሩ ወይም ምድብ ይ ቀይሩ።'
              : 'Try searching with a different term or select another category.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredProducts.map((product) => {
            return (
              <div
                key={product.id}
                className={`group glass-card glass-card-hover rounded-2xl border border-zinc-800/80 transition-all flex flex-col overflow-hidden relative ${
                  !product.isAvailable ? 'opacity-65' : ''
                }`}
              >
                {/* Image */}
                <div className="relative h-48 w-full bg-zinc-900 overflow-hidden">
                  <img
                    src={product.imageUrl}
                    alt={product.nameEn}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    loading="lazy"
                  />
                  {product.isFeatured && (
                    <span className="absolute top-2.5 left-2.5 bg-amber-500 text-stone-950 text-[10px] font-black uppercase px-2.5 py-1 rounded-full flex items-center gap-1 shadow-md shadow-amber-500/20">
                      <Sparkles className="w-3 h-3 text-stone-950" />
                      {t('featured')}
                    </span>
                  )}
                  {!product.isAvailable && (
                    <div className="absolute inset-0 bg-stone-950/75 backdrop-blur-xs flex items-center justify-center p-3 text-center">
                      <span className="bg-red-950 border border-red-800 text-red-300 text-xs font-bold px-3 py-1.5 rounded-full shadow-md">
                        {t('unavailable')}
                      </span>
                    </div>
                  )}
                </div>

                {/* Info Body */}
                <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-serif-luxury font-bold text-white text-base leading-snug flex-1 min-w-0 pr-1">
                        {language === 'am' ? product.nameAm : product.nameEn}
                      </h3>
                      <span className="text-sm font-extrabold text-amber-400 shrink-0">
                        {product.priceEtb} {t('currencyEtb')}
                      </span>
                    </div>
                    <p className="text-zinc-400 text-xs mt-1.5 line-clamp-2 leading-relaxed">
                      {language === 'am' ? product.descriptionAm : product.descriptionEn}
                    </p>
                  </div>

                  {/* Footer Action */}
                  <div className="pt-3 border-t border-zinc-800/80 flex items-center justify-between">
                    <span className="text-[11px] text-zinc-500 font-medium flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-zinc-500" />
                      {product.prepTimeMins} {t('prepTime')}
                    </span>

                    <button
                      type="button"
                      disabled={!product.isAvailable}
                      onClick={() => setActiveProductForModal(product)}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
                        product.isAvailable
                          ? 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-stone-950 shadow-md shadow-amber-500/20'
                          : 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
                      }`}
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>{t('customize')}</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Product Customization Modal */}
      {activeProductForModal && (
        <ProductModal
          product={activeProductForModal}
          allAddOns={addOns}
          onClose={() => setActiveProductForModal(null)}
          onAddToCart={onAddToCart}
        />
      )}

      {/* Call Waiter Modal */}
      {isCallWaiterOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-[#141418] border border-amber-500/30 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-5 relative">
            <button
              type="button"
              onClick={() => setIsCallWaiterOpen(false)}
              className="absolute top-4 right-4 text-zinc-400 hover:text-white p-1.5 hover:bg-zinc-800 rounded-xl transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3">
              <div className="p-3 bg-amber-500/20 border border-amber-500/40 text-amber-400 rounded-2xl">
                <Bell className="w-6 h-6 animate-bounce" />
              </div>
              <div>
                <h3 className="font-serif-luxury font-bold text-lg text-white">
                  {t('callWaiter')}
                </h3>
                <p className="text-zinc-400 text-xs">{t('callWaiterDesc')}</p>
              </div>
            </div>

            {callSuccessMessage ? (
              <div className="p-4 bg-emerald-950/60 border border-emerald-500/40 rounded-2xl text-center space-y-2 text-emerald-300">
                <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto animate-bounce" />
                <p className="font-bold text-sm text-white">{t('waiterNotified')}</p>
                <p className="text-xs text-emerald-300">{callSuccessMessage}</p>
              </div>
            ) : (
              <form onSubmit={handleCallWaiter} className="space-y-4">
                {callErrorMessage && (
                  <div className="p-3 bg-red-950/60 border border-red-500/40 rounded-xl text-red-300 text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                    <span>{callErrorMessage}</span>
                  </div>
                )}

                {/* Table Number Selection / Confirmation */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-zinc-300 block">
                    {language === 'am' ? 'የጠረጴዛ ቁጥር' : 'Table Number'}
                  </label>
                  {activeTable?.tableNumber ? (
                    <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl text-amber-400 font-bold text-sm flex items-center gap-2">
                      <UtensilsCrossed className="w-4 h-4 text-amber-400" />
                      <span>
                        {language === 'am' ? 'ጠረጴዛ #' : 'Table #'}
                        {activeTable.tableNumber}
                      </span>
                    </div>
                  ) : (
                    <input
                      type="text"
                      required
                      value={customTableNumber}
                      onChange={(e) => setCustomTableNumber(e.target.value)}
                      placeholder="e.g. Table 5"
                      className="w-full px-4 py-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-sm text-slate-100 focus:outline-none focus:border-amber-500"
                    />
                  )}
                </div>

                {/* Reason Selection */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-zinc-300 block">
                    {t('selectReason')}
                  </label>
                  <div className="grid grid-cols-1 gap-2">
                    {[
                      { key: 'General Assistance', label: t('reasonGeneral') },
                      { key: 'Ordering Help', label: t('reasonMenu') },
                      { key: 'Water & Napkins', label: t('reasonWater') },
                      { key: 'Request Bill', label: t('reasonBill') },
                    ].map((opt) => (
                      <button
                        key={opt.key}
                        type="button"
                        onClick={() => setSelectedReason(opt.key)}
                        className={`p-3 rounded-xl border text-left text-xs font-semibold flex items-center justify-between transition-all ${
                          selectedReason === opt.key
                            ? 'bg-amber-500/20 border-amber-500 text-amber-300 font-bold'
                            : 'bg-zinc-900/80 border-zinc-800 text-zinc-400 hover:text-zinc-200'
                        }`}
                      >
                        <span>{opt.label}</span>
                        {selectedReason === opt.key && (
                          <CheckCircle2 className="w-4 h-4 text-amber-400" />
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Modal CTA */}
                <div className="pt-2 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsCallWaiterOpen(false)}
                    className="flex-1 py-3 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                  >
                    {t('cancel')}
                  </button>

                  <button
                    type="submit"
                    disabled={isCalling}
                    className="flex-1 py-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-stone-950 font-extrabold text-xs rounded-xl shadow-lg shadow-amber-500/20 flex items-center justify-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
                  >
                    {isCalling ? (
                      <Loader2 className="w-4 h-4 animate-spin text-stone-950" />
                    ) : (
                      <Bell className="w-4 h-4 text-stone-950" />
                    )}
                    <span>{t('callWaiter')}</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
