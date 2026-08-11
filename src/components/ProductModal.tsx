import React, { useState } from 'react';
import { Product, ProductVariation, AddOn } from '../types';
import { useLanguage } from '../context/LanguageContext';
import { X, Plus, Minus, Check, Clock } from 'lucide-react';

interface ProductModalProps {
  product: Product;
  allAddOns: AddOn[];
  onClose: () => void;
  onAddToCart: (
    product: Product,
    selectedVariation?: ProductVariation,
    selectedAddOns?: AddOn[],
    quantity?: number,
    specialInstructions?: string
  ) => void;
}

export const ProductModal: React.FC<ProductModalProps> = ({
  product,
  allAddOns,
  onClose,
  onAddToCart,
}) => {
  const { t, language } = useLanguage();

  const [selectedVariation, setSelectedVariation] = useState<ProductVariation | undefined>(
    product.variations && product.variations.length > 0 ? product.variations[0] : undefined
  );

  const [selectedAddOnIds, setSelectedAddOnIds] = useState<string[]>([]);
  const [quantity, setQuantity] = useState<number>(1);
  const [specialInstructions, setSpecialInstructions] = useState<string>('');

  // Available add-ons for this product
  const availableAddOns = allAddOns.filter((a) =>
    product.addOnIds ? product.addOnIds.includes(a.id) : true
  );

  const toggleAddOn = (addOnId: string) => {
    setSelectedAddOnIds((prev) =>
      prev.includes(addOnId) ? prev.filter((id) => id !== addOnId) : [...prev, addOnId]
    );
  };

  const basePrice = selectedVariation ? selectedVariation.priceEtb : product.priceEtb;
  const addOnsTotal = selectedAddOnIds.reduce((sum, id) => {
    const addon = allAddOns.find((a) => a.id === id);
    return sum + (addon ? addon.priceEtb : 0);
  }, 0);

  const totalCalculated = (basePrice + addOnsTotal) * quantity;

  const handleConfirm = () => {
    const chosenAddOns = allAddOns.filter((a) => selectedAddOnIds.includes(a.id));
    onAddToCart(product, selectedVariation, chosenAddOns, quantity, specialInstructions);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-stone-950/80 backdrop-blur-md p-0 sm:p-4 animate-fade-in">
      <div className="bg-[#121215] border border-zinc-800 text-slate-100 rounded-t-2xl sm:rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl flex flex-col">
        {/* Image & Header */}
        <div className="relative h-48 sm:h-56 w-full bg-zinc-900 shrink-0">
          <img
            src={product.imageUrl}
            alt={product.nameEn}
            className="w-full h-full object-cover"
          />
          <button
            type="button"
            onClick={onClose}
            className="absolute top-3 right-3 w-8 h-8 rounded-full bg-stone-950/80 text-white flex items-center justify-center hover:bg-stone-900 transition-colors border border-zinc-700"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="absolute bottom-3 left-3 bg-stone-950/90 text-amber-400 px-2.5 py-1 rounded-full text-xs font-semibold flex items-center gap-1 backdrop-blur-xs border border-amber-500/30">
            <Clock className="w-3.5 h-3.5 text-amber-400" />
            <span>{product.prepTimeMins} {t('prepTime')}</span>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-5 space-y-5 flex-1">
          <div>
            <h3 className="text-xl font-bold font-serif-luxury text-white">
              {language === 'am' ? product.nameAm : product.nameEn}
            </h3>
            <p className="text-zinc-400 text-sm mt-1 leading-relaxed">
              {language === 'am' ? product.descriptionAm : product.descriptionEn}
            </p>
          </div>

          {/* Variations Selector */}
          {product.variations && product.variations.length > 0 && (
            <div>
              <label className="block text-xs font-bold text-amber-400 uppercase tracking-wider mb-2">
                {t('selectVariation')}
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {product.variations.map((v) => {
                  const isSelected = selectedVariation?.id === v.id;
                  return (
                    <button
                      key={v.id}
                      type="button"
                      onClick={() => setSelectedVariation(v)}
                      className={`p-3 rounded-xl border text-left transition-all flex flex-col justify-between ${
                        isSelected
                          ? 'border-amber-500 bg-amber-500/10 text-white shadow-md shadow-amber-500/10'
                          : 'border-zinc-800 bg-zinc-900/60 hover:border-zinc-700 text-zinc-400'
                      }`}
                    >
                      <span className="text-xs font-semibold block">
                        {language === 'am' ? v.nameAm : v.nameEn}
                      </span>
                      <span className="text-sm font-extrabold text-amber-400 mt-1">
                        {v.priceEtb} {t('currencyEtb')}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Add-ons Selector */}
          {availableAddOns.length > 0 && (
            <div>
              <label className="block text-xs font-bold text-amber-400 uppercase tracking-wider mb-2">
                {t('selectAddOns')}
              </label>
              <div className="space-y-2">
                {availableAddOns.map((addOn) => {
                  const isChecked = selectedAddOnIds.includes(addOn.id);
                  return (
                    <div
                      key={addOn.id}
                      onClick={() => toggleAddOn(addOn.id)}
                      className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all ${
                        isChecked
                          ? 'border-amber-500 bg-amber-500/10 text-white'
                          : 'border-zinc-800 bg-zinc-900/60 hover:border-zinc-700 text-zinc-400'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-5 h-5 rounded-md border flex items-center justify-center transition-colors ${
                            isChecked
                              ? 'bg-amber-500 border-amber-500 text-stone-950 font-black'
                              : 'border-zinc-700 bg-zinc-800'
                          }`}
                        >
                          {isChecked && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                        </div>
                        <span className="text-xs font-medium text-zinc-200">
                          {language === 'am' ? addOn.nameAm : addOn.nameEn}
                        </span>
                      </div>
                      <span className="text-xs font-bold text-amber-400">
                        +{addOn.priceEtb} {t('currencyEtb')}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Special Instructions */}
          <div>
            <label className="block text-xs font-bold text-amber-400 uppercase tracking-wider mb-1">
              {t('specialInstructions')}
            </label>
            <input
              type="text"
              value={specialInstructions}
              onChange={(e) => setSpecialInstructions(e.target.value)}
              placeholder={t('specialInstructionsPlaceholder')}
              className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-zinc-900 border border-zinc-800 text-slate-100 placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
              maxLength={150}
            />
          </div>

          {/* Quantity Controls */}
          <div className="flex items-center justify-between pt-2">
            <span className="text-xs font-bold text-zinc-300 uppercase tracking-wider">
              Quantity
            </span>
            <div className="flex items-center gap-3 bg-zinc-900 p-1.5 rounded-xl border border-zinc-800">
              <button
                type="button"
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                className="w-7 h-7 rounded-lg bg-zinc-800 text-zinc-200 flex items-center justify-center hover:bg-zinc-700 hover:text-white transition-colors"
              >
                <Minus className="w-4 h-4" />
              </button>
              <span className="text-sm font-bold text-white w-6 text-center">
                {quantity}
              </span>
              <button
                type="button"
                onClick={() => setQuantity((q) => q + 1)}
                className="w-7 h-7 rounded-lg bg-zinc-800 text-zinc-200 flex items-center justify-center hover:bg-zinc-700 hover:text-white transition-colors"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Footer Button */}
        <div className="p-4 bg-[#0A0A0C] border-t border-zinc-800">
          <button
            type="button"
            onClick={handleConfirm}
            className="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-stone-950 py-3.5 px-4 rounded-xl font-bold text-sm shadow-lg shadow-amber-500/20 transition-all flex items-center justify-between"
          >
            <span>{t('addToCart')}</span>
            <span className="bg-stone-950/30 px-3 py-1 rounded-lg text-stone-950 font-black border border-stone-950/20">
              {totalCalculated} {t('currencyEtb')}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};
