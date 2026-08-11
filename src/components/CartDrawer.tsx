import React from 'react';
import { useCart } from '../context/CartContext';
import { useLanguage } from '../context/LanguageContext';
import { X, Trash2, Plus, Minus, ShoppingBag, ArrowRight } from 'lucide-react';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onProceedToCheckout: () => void;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({
  isOpen,
  onClose,
  onProceedToCheckout,
}) => {
  const { cartItems, updateQuantity, removeFromCart, subtotal, totalItemCount } = useCart();
  const { t, language } = useLanguage();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden animate-fade-in">
      <div className="absolute inset-0 bg-stone-950/80 backdrop-blur-md" onClick={onClose} />

      <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-[#0F0F12] border-l border-zinc-800 text-slate-100 shadow-2xl flex flex-col">
          {/* Header */}
          <div className="p-4 sm:p-5 bg-[#141418] text-white flex items-center justify-between border-b border-zinc-800">
            <div className="flex items-center gap-2.5">
              <div className="p-1.5 bg-amber-500/20 text-amber-400 rounded-lg border border-amber-500/30">
                <ShoppingBag className="w-4 h-4" />
              </div>
              <h3 className="font-serif-luxury font-bold text-lg text-white">{t('cartTitle')}</h3>
              <span className="bg-amber-500 text-stone-950 text-xs font-black px-2 py-0.5 rounded-full shadow-sm">
                {totalItemCount}
              </span>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Cart Items List */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
            {cartItems.length === 0 ? (
              <div className="text-center py-16 space-y-3">
                <div className="w-16 h-16 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center mx-auto text-zinc-500">
                  <ShoppingBag className="w-8 h-8 text-zinc-500" />
                </div>
                <h4 className="font-bold text-zinc-200 text-base">{t('cartEmpty')}</h4>
                <p className="text-zinc-500 text-xs max-w-xs mx-auto">{t('cartEmptyDesc')}</p>
              </div>
            ) : (
              cartItems.map((item) => {
                const pName = language === 'am' ? item.product.nameAm : item.product.nameEn;
                const vName = item.selectedVariation
                  ? language === 'am'
                    ? item.selectedVariation.nameAm
                    : item.selectedVariation.nameEn
                  : null;

                return (
                  <div
                    key={item.id}
                    className="p-4 rounded-2xl border border-zinc-800 bg-[#141418] space-y-3"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h4 className="font-bold text-white text-sm">{pName}</h4>
                        {vName && (
                          <span className="text-[11px] font-bold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-md inline-block mt-1">
                            {vName}
                          </span>
                        )}
                      </div>
                      <span className="font-extrabold text-amber-400 text-sm shrink-0">
                        {item.calculatedPrice} {t('currencyEtb')}
                      </span>
                    </div>

                    {/* Add-ons list */}
                    {item.selectedAddOns.length > 0 && (
                      <div className="text-xs text-zinc-400 space-y-1 pl-2 border-l-2 border-amber-500/80">
                        {item.selectedAddOns.map((addOn) => (
                          <div key={addOn.id} className="flex justify-between text-[11px]">
                            <span>+ {language === 'am' ? addOn.nameAm : addOn.nameEn}</span>
                            <span className="text-amber-400">+{addOn.priceEtb} {t('currencyEtb')}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Special Instructions */}
                    {item.specialInstructions && (
                      <p className="text-[11px] italic text-zinc-400 bg-zinc-900 p-2 rounded-lg border border-zinc-800">
                        "{item.specialInstructions}"
                      </p>
                    )}

                    {/* Actions */}
                    <div className="flex items-center justify-between pt-1">
                      <button
                        type="button"
                        onClick={() => removeFromCart(item.id)}
                        className="text-zinc-500 hover:text-red-400 text-xs font-semibold flex items-center gap-1 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>{t('delete')}</span>
                      </button>

                      <div className="flex items-center gap-2 bg-zinc-900 px-2 py-1 rounded-xl border border-zinc-800">
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.id, -1)}
                          className="w-5 h-5 rounded-md bg-zinc-800 flex items-center justify-center text-zinc-300 hover:bg-zinc-700 hover:text-white"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="text-xs font-bold text-white w-4 text-center">{item.quantity}</span>
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.id, 1)}
                          className="w-5 h-5 rounded-md bg-zinc-800 flex items-center justify-center text-zinc-300 hover:bg-zinc-700 hover:text-white"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer Checkout */}
          {cartItems.length > 0 && (
            <div className="p-4 sm:p-5 bg-[#0A0A0C] border-t border-zinc-800 space-y-3">
              <div className="flex justify-between items-center text-sm font-bold text-white">
                <span>{t('subtotal')}</span>
                <span className="text-amber-400 text-base font-black">{subtotal} {t('currencyEtb')}</span>
              </div>

              <button
                type="button"
                onClick={() => {
                  onClose();
                  onProceedToCheckout();
                }}
                className="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-stone-950 py-3.5 px-4 rounded-xl font-bold text-sm shadow-lg shadow-amber-500/20 transition-all flex items-center justify-center gap-2"
              >
                <span>{t('checkout')}</span>
                <ArrowRight className="w-4 h-4 stroke-[3]" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
