import React, { useEffect, useState } from 'react';
import { Order, OrderStatus } from '../types';
import { useLanguage } from '../context/LanguageContext';
import {
  CheckCircle2,
  Clock,
  Printer,
  ChefHat,
  Utensils,
  Sparkles,
  CreditCard,
  RefreshCw,
  AlertCircle,
  ShoppingBag,
} from 'lucide-react';

interface OrderTrackerProps {
  trackingToken: string;
  onOrderMore: () => void;
}

export const OrderTracker: React.FC<OrderTrackerProps> = ({
  trackingToken,
  onOrderMore,
}) => {
  const { t, language } = useLanguage();
  const [order, setOrder] = useState<Order | null>(null);
  const [cafeInfo, setCafeInfo] = useState<any>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [demoPaying, setDemoPaying] = useState<boolean>(false);

  const fetchOrder = () => {
    fetch(`/api/orders/track/${trackingToken}`)
      .then((res) => {
        if (!res.ok) throw new Error('Order not found');
        return res.json();
      })
      .then((data) => {
        setOrder(data.order);
        setCafeInfo(data.cafeInfo);
      })
      .catch((err) => setError(err.message))
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    fetchOrder();

    // Subscribe to SSE real-time stream
    const sse = new EventSource(`/api/realtime/sse?role=customer&trackingToken=${trackingToken}`);

    sse.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data);
        if (payload.type === 'STATUS_UPDATE' && payload.data) {
          setOrder(payload.data);
        }
      } catch (e) {
        // ignore JSON parse error
      }
    };

    return () => {
      sse.close();
    };
  }, [trackingToken]);

  // Handle Demo Online Payment Trigger
  const handleSimulatePayment = async () => {
    setDemoPaying(true);
    try {
      const res = await fetch('/api/payments/confirm-demo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          trackingToken,
          provider: 'CHAPA_TELEBIRR_TEST',
          txRef: `DEMO_TX_${Date.now()}`,
        }),
      });

      const data = await res.json();
      if (data.order) {
        setOrder(data.order);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setDemoPaying(false);
    }
  };

  const handlePrintReceipt = () => {
    window.print();
  };

  if (isLoading) {
    return (
      <div className="max-w-xl mx-auto py-20 px-4 text-center space-y-3">
        <RefreshCw className="w-8 h-8 text-amber-600 animate-spin mx-auto" />
        <p className="text-stone-500 text-sm font-medium">{t('scanPrompt')}</p>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="max-w-xl mx-auto py-16 px-4 text-center space-y-4">
        <AlertCircle className="w-12 h-12 text-red-500 mx-auto" />
        <h3 className="font-bold text-stone-800 text-lg">Order Not Found</h3>
        <p className="text-stone-500 text-xs">The tracking link may be invalid or expired.</p>
        <button
          type="button"
          onClick={onOrderMore}
          className="bg-amber-800 text-white px-4 py-2 rounded-xl font-bold text-xs shadow-xs"
        >
          {t('orderMore')}
        </button>
      </div>
    );
  }

  // Status step index logic
  const statuses: OrderStatus[] = ['NEW', 'ACCEPTED', 'PREPARING', 'READY', 'COMPLETED'];
  const currentIndex = statuses.indexOf(order.orderStatus);

  const getStatusLabel = (s: OrderStatus) => {
    return t(`status${s}`);
  };

  // Time elapsed
  const createdTime = new Date(order.createdAt);
  const elapsedMins = Math.max(0, Math.floor((Date.now() - createdTime.getTime()) / 60000));

  return (
    <div className="max-w-2xl mx-auto py-8 px-4 sm:px-6 space-y-8 animate-fade-in print:p-0 print:m-0 print:max-w-full">
      {/* Top Banner */}
      <div className="bg-[#121215] text-slate-100 p-6 sm:p-8 rounded-3xl shadow-2xl border border-amber-500/30 text-center relative overflow-hidden print:hidden amber-glow">
        <div className="absolute -right-6 -bottom-6 opacity-10 text-amber-500">
          <Utensils className="w-40 h-40" />
        </div>

        <span className="bg-amber-500/10 border border-amber-500/30 text-amber-400 px-3.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider inline-block mb-3">
          {t('liveTracking')}
        </span>

        <h2 className="font-serif-luxury font-extrabold text-3xl text-white">
          {order.orderNumber}
        </h2>

        <p className="text-amber-400 text-sm font-bold mt-1">
          {t('tableDetected')} #{order.tableNumber}
        </p>

        <div className="mt-4 flex items-center justify-center gap-2 text-zinc-400 text-xs">
          <Clock className="w-4 h-4 text-amber-400" />
          <span>
            {t('waitingTime')}: <strong className="text-slate-200">{elapsedMins} mins ago</strong>
          </span>
        </div>
      </div>

      {/* Online Payment Simulator Alert if unpaid online */}
      {order.paymentStatus === 'UNPAID' && order.paymentMethod !== 'CASH' && (
        <div className="bg-amber-950/60 border border-amber-500/40 p-4 rounded-2xl text-slate-100 text-xs space-y-2 print:hidden">
          <div className="flex items-center gap-2 font-bold text-amber-300">
            <CreditCard className="w-4 h-4 text-amber-400" />
            <span>Complete Ethiopian Online Payment (Chapa / Telebirr Test)</span>
          </div>
          <p className="text-zinc-300 text-[11px]">
            Your order is created! Click below to simulate instant payment verification.
          </p>
          <button
            type="button"
            disabled={demoPaying}
            onClick={handleSimulatePayment}
            className="bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-stone-950 font-bold px-4 py-2 rounded-xl text-xs shadow-md shadow-emerald-500/20 transition-all"
          >
            {demoPaying ? 'Verifying...' : 'Simulate Successful Chapa/Telebirr Payment'}
          </button>
        </div>
      )}

      {/* Status Progress Timeline */}
      <div className="bg-[#121215] p-6 rounded-3xl border border-zinc-800 shadow-xl space-y-6 print:hidden">
        <h3 className="font-serif-luxury font-bold text-white text-base">Order Progress</h3>

        {order.orderStatus === 'CANCELLED' ? (
          <div className="p-4 bg-red-950/80 border border-red-800/80 rounded-2xl text-red-300 text-xs font-bold text-center">
            ❌ {t('statusCANCELLED')}
          </div>
        ) : (
          <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2.5 before:bottom-2.5 before:w-0.5 before:bg-zinc-800">
            {statuses.map((statusStep, idx) => {
              const isPassed = currentIndex >= idx;
              const isCurrent = currentIndex === idx;

              return (
                <div key={statusStep} className="relative flex items-center gap-4">
                  <div
                    className={`absolute -left-6 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                      isPassed
                        ? 'bg-amber-500 border-amber-400 text-stone-950 shadow-md shadow-amber-500/30'
                        : 'bg-[#121215] border-zinc-700 text-transparent'
                    }`}
                  >
                    {isPassed && <CheckCircle2 className="w-3.5 h-3.5 stroke-[3]" />}
                  </div>

                  <div>
                    <h4
                      className={`text-xs font-bold ${
                        isCurrent
                          ? 'text-amber-400 text-sm font-extrabold'
                          : isPassed
                          ? 'text-slate-100'
                          : 'text-zinc-600'
                      }`}
                    >
                      {getStatusLabel(statusStep)}
                    </h4>
                    {isCurrent && (
                      <p className="text-[11px] text-amber-400 font-semibold animate-pulse mt-0.5">
                        • In progress...
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Digital Receipt Card */}
      <div className="bg-[#121215] p-6 rounded-3xl border border-zinc-800 shadow-xl space-y-5 print:shadow-none print:border-none print:bg-white print:text-black">
        <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
          <div>
            <h3 className="font-serif-luxury font-bold text-white text-lg">{t('digitalReceipt')}</h3>
            <p className="text-zinc-400 text-xs">MERAF CAFE • Bole Medhaniallem</p>
          </div>
          <button
            type="button"
            onClick={handlePrintReceipt}
            className="p-2.5 bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 rounded-xl text-zinc-200 text-xs font-bold flex items-center gap-1.5 transition-colors print:hidden"
          >
            <Printer className="w-4 h-4 text-amber-400" />
            <span>{t('printReceipt')}</span>
          </button>
        </div>

        {/* Item Rows */}
        <div className="space-y-3">
          {order.items.map((item) => (
            <div key={item.id} className="flex justify-between items-start text-xs border-b border-zinc-800/80 pb-2.5">
              <div>
                <div className="font-bold text-white text-xs">
                  {item.quantity} × {language === 'am' ? item.productNameAm : item.productNameEn}
                </div>
                {item.variationNameEn && (
                  <span className="text-[10px] text-amber-400 bg-amber-500/10 border border-amber-500/20 px-1.5 py-0.5 rounded-md inline-block mt-0.5">
                    {language === 'am' ? item.variationNameAm : item.variationNameEn}
                  </span>
                )}
                {item.addOns && item.addOns.length > 0 && (
                  <div className="text-[10px] text-zinc-400 mt-0.5">
                    {item.addOns.map((a) => (
                      <span key={a.id} className="block">
                        + {language === 'am' ? a.nameAm : a.nameEn}
                      </span>
                    ))}
                  </div>
                )}
                {item.specialInstructions && (
                  <p className="text-[10px] italic text-zinc-500 mt-0.5">
                    Note: "{item.specialInstructions}"
                  </p>
                )}
              </div>
              <span className="font-bold text-amber-400 shrink-0">
                {item.totalPrice} {t('currencyEtb')}
              </span>
            </div>
          ))}
        </div>

        {/* Calculation Totals */}
        <div className="bg-zinc-900/80 p-4 rounded-2xl border border-zinc-800 space-y-1.5 text-xs">
          <div className="flex justify-between text-zinc-400">
            <span>{t('subtotal')}</span>
            <span>{order.subtotal} {t('currencyEtb')}</span>
          </div>
          {order.taxAmount > 0 && (
            <div className="flex justify-between text-zinc-400">
              <span>{t('tax')}</span>
              <span>{order.taxAmount} {t('currencyEtb')}</span>
            </div>
          )}
          {order.serviceCharge > 0 && (
            <div className="flex justify-between text-zinc-400">
              <span>{t('serviceCharge')}</span>
              <span>{order.serviceCharge} {t('currencyEtb')}</span>
            </div>
          )}
          <div className="flex justify-between font-extrabold text-sm text-white pt-2 border-t border-zinc-800">
            <span>{t('total')}</span>
            <span className="text-amber-400">{order.total} {t('currencyEtb')}</span>
          </div>
          <div className="flex justify-between text-[11px] text-zinc-400 pt-1">
            <span>{t('paymentMethod')}: {order.paymentMethod}</span>
            <span className={`font-bold ${order.paymentStatus === 'PAID' ? 'text-emerald-400' : 'text-amber-400'}`}>
              {order.paymentStatus}
            </span>
          </div>
        </div>
      </div>

      {/* Action to Order More */}
      <div className="text-center print:hidden">
        <button
          type="button"
          onClick={onOrderMore}
          className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-stone-950 font-bold py-3.5 px-6 rounded-2xl text-xs shadow-lg shadow-amber-500/20 transition-all inline-flex items-center gap-2"
        >
          <ShoppingBag className="w-4 h-4" />
          <span>{t('orderMore')}</span>
        </button>
      </div>
    </div>
  );
};
