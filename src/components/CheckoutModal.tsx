import React, { useState } from 'react';
import { useCart } from '../context/CartContext';
import { useLanguage } from '../context/LanguageContext';
import { PaymentMethod } from '../types';
import { X, Utensils, Banknote, CreditCard, ShieldCheck, AlertTriangle, Loader2 } from 'lucide-react';

interface CheckoutModalProps {
  tableToken: string;
  tableNumber: string;
  onClose: () => void;
  onOrderSuccess: (trackingToken: string) => void;
}

export const CheckoutModal: React.FC<CheckoutModalProps> = ({
  tableToken,
  tableNumber,
  onClose,
  onOrderSuccess,
}) => {
  const { cartItems, subtotal, clearCart } = useCart();
  const { t, language } = useLanguage();

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('CASH');
  const [customerNote, setCustomerNote] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmitOrder = async () => {
    if (isSubmitting) return; // Prevent duplicate submission
    setIsSubmitting(true);
    setErrorMessage(null);

    const formattedItems = cartItems.map((item) => ({
      productId: item.product.id,
      variationId: item.selectedVariation?.id,
      selectedAddOnIds: item.selectedAddOns.map((a) => a.id),
      quantity: item.quantity,
      specialInstructions: item.specialInstructions,
    }));

    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tableToken,
          items: formattedItems,
          paymentMethod,
          customerNote,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setErrorMessage(
          language === 'am'
            ? data.messageAm || data.error || 'ትዕዛዙን መላክ አልተቻለም'
            : data.messageEn || data.error || 'Failed to submit order'
        );
        setIsSubmitting(false);
        return;
      }

      clearCart();
      onOrderSuccess(data.trackingToken);
    } catch (err) {
      setErrorMessage(
        language === 'am'
          ? 'የኢንተርኔት ግንኙነት ችግር። እባክዎን እንደገና ይሞክሩ።'
          : 'Network error submitting order. Please try again.'
      );
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950/80 backdrop-blur-md p-4 animate-fade-in overflow-y-auto">
      <div className="bg-[#121215] border border-zinc-800 text-slate-100 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden my-8">
        {/* Header */}
        <div className="bg-[#141418] text-white p-5 flex items-center justify-between border-b border-zinc-800">
          <div>
            <h3 className="font-serif-luxury font-bold text-lg text-white">{t('checkout')}</h3>
            <p className="text-amber-400 text-xs font-bold flex items-center gap-1.5 mt-0.5">
              <Utensils className="w-3.5 h-3.5 text-amber-400" />
              {t('tableDetected')} #{tableNumber}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <div className="p-5 space-y-5">
          {errorMessage && (
            <div className="p-3 bg-red-950/80 border border-red-800/80 rounded-xl text-red-200 text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Payment Method Selector */}
          <div className="space-y-2.5">
            <label className="block text-xs font-bold text-amber-400 uppercase tracking-wider">
              {t('paymentMethod')}
            </label>

            <div
              onClick={() => setPaymentMethod('CASH')}
              className={`p-3.5 rounded-xl border cursor-pointer transition-all flex items-start gap-3 ${
                paymentMethod === 'CASH'
                  ? 'border-amber-500 bg-amber-500/10 shadow-md shadow-amber-500/10'
                  : 'border-zinc-800 bg-zinc-900/60 hover:border-zinc-700'
              }`}
            >
              <div className="p-2 bg-amber-500/20 text-amber-400 rounded-lg shrink-0 mt-0.5 border border-amber-500/30">
                <Banknote className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-white text-xs">{t('payCash')}</h4>
                <p className="text-[11px] text-zinc-400 mt-0.5">{t('payCashDesc')}</p>
              </div>
            </div>

            <div
              onClick={() => setPaymentMethod('ONLINE_CHAPA')}
              className={`p-3.5 rounded-xl border cursor-pointer transition-all flex items-start gap-3 ${
                paymentMethod === 'ONLINE_CHAPA'
                  ? 'border-amber-500 bg-amber-500/10 shadow-md shadow-amber-500/10'
                  : 'border-zinc-800 bg-zinc-900/60 hover:border-zinc-700'
              }`}
            >
              <div className="p-2 bg-emerald-500/20 text-emerald-400 rounded-lg shrink-0 mt-0.5 border border-emerald-500/30">
                <CreditCard className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-white text-xs">{t('payOnline')}</h4>
                <p className="text-[11px] text-zinc-400 mt-0.5">{t('payOnlineDesc')}</p>
              </div>
            </div>
          </div>

          {/* Kitchen Note */}
          <div>
            <label className="block text-xs font-bold text-amber-400 uppercase tracking-wider mb-1">
              {t('customerNote')}
            </label>
            <textarea
              rows={2}
              value={customerNote}
              onChange={(e) => setCustomerNote(e.target.value)}
              placeholder={
                language === 'am'
                  ? 'ለማእደቤቱ ተጨማሪ አስተያየት ካለዎት እዚህ ይጻፉ...'
                  : 'Any general note for the kitchen or waiter...'
              }
              className="w-full p-3 text-xs rounded-xl bg-zinc-900 border border-zinc-800 text-slate-100 placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
            />
          </div>

          {/* Summary Breakdown */}
          <div className="p-3.5 bg-zinc-900/80 rounded-xl border border-zinc-800 text-xs space-y-2">
            <div className="flex justify-between text-zinc-400">
              <span>{t('subtotal')} ({cartItems.length} items)</span>
              <span>{subtotal} {t('currencyEtb')}</span>
            </div>
            <div className="flex justify-between text-white font-extrabold text-sm pt-2 border-t border-zinc-800">
              <span>{t('total')}</span>
              <span className="text-amber-400">{subtotal} {t('currencyEtb')}</span>
            </div>
          </div>

          <div className="flex items-center gap-1.5 text-[11px] text-zinc-500">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Prices & order total verified server-side.</span>
          </div>
        </div>

        {/* Submit Footer */}
        <div className="p-4 bg-[#0A0A0C] border-t border-zinc-800">
          <button
            type="button"
            disabled={isSubmitting}
            onClick={handleSubmitOrder}
            className="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 disabled:from-zinc-800 disabled:to-zinc-800 disabled:text-zinc-500 text-stone-950 py-3.5 px-4 rounded-xl font-bold text-sm shadow-lg shadow-amber-500/20 transition-all flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-stone-950" />
                <span>Processing Order...</span>
              </>
            ) : (
              <span>{t('confirmOrder')}</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
