import React, { useEffect, useState, useRef } from 'react';
import { Order, OrderStatus } from '../types';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import {
  Bell,
  CheckCircle2,
  Clock,
  Volume2,
  VolumeX,
  RefreshCw,
  Utensils,
  Check,
  X,
  ChefHat,
  Banknote,
  Sparkles,
  Wifi,
  WifiOff,
  LogOut,
} from 'lucide-react';

export interface WaiterCall {
  id: string;
  tableNumber: string;
  reason: string;
  timestamp: string;
  acknowledged: boolean;
}

export const StaffDashboard: React.FC = () => {
  const { token, user, logout } = useAuth();
  const { t, language } = useLanguage();

  const [orders, setOrders] = useState<Order[]>([]);
  const [waiterCalls, setWaiterCalls] = useState<WaiterCall[]>([]);
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [isConnected, setIsConnected] = useState<boolean>(true);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Audio Ref for chime notification
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const fetchOrders = () => {
    fetch('/api/orders/staff/list', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setOrders(data);
        }
      })
      .catch((err) => console.error(err))
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    fetchOrders();

    // SSE Realtime Subscription
    const sse = new EventSource(`/api/realtime/sse?role=staff`);

    sse.onopen = () => setIsConnected(true);

    sse.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data);
        if (payload.type === 'NEW_ORDER') {
          const newOrder: Order = payload.data;
          setOrders((prev) => [newOrder, ...prev.filter((o) => o.id !== newOrder.id)]);

          // Play Sound Chime
          if (soundEnabled) {
            playNotificationSound();
          }
        } else if (payload.type === 'ORDER_UPDATED') {
          const updated: Order = payload.data;
          setOrders((prev) => prev.map((o) => (o.id === updated.id ? updated : o)));
        } else if (payload.type === 'CALL_WAITER') {
          const newCall: WaiterCall = {
            id: payload.data.id || `call_${Date.now()}`,
            tableNumber: String(payload.data.tableNumber),
            reason: payload.data.reason || 'General Assistance',
            timestamp: payload.data.timestamp || new Date().toISOString(),
            acknowledged: false,
          };
          setWaiterCalls((prev) => [newCall, ...prev.filter((c) => c.id !== newCall.id)]);

          if (soundEnabled) {
            playNotificationSound();
          }
        }
      } catch (e) {
        // ignore
      }
    };

    sse.onerror = () => {
      setIsConnected(false);
    };

    return () => {
      sse.close();
    };
  }, [token, soundEnabled]);

  const playNotificationSound = () => {
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
      osc.frequency.setValueAtTime(880, ctx.currentTime + 0.15); // A5
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.5);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.5);
    } catch (e) {
      // AudioContext fallback
    }
  };

  const handleUpdateStatus = async (
    orderId: string,
    orderStatus: OrderStatus,
    paymentStatus?: 'PAID' | 'UNPAID'
  ) => {
    try {
      const res = await fetch(`/api/orders/staff/${orderId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ orderStatus, paymentStatus }),
      });
      const updated = await res.json();
      if (updated.id) {
        setOrders((prev) => prev.map((o) => (o.id === updated.id ? updated : o)));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleAcknowledgeCall = (callId: string) => {
    setWaiterCalls((prev) =>
      prev.map((c) => (c.id === callId ? { ...c, acknowledged: true } : c))
    );
  };

  const handleDismissCall = (callId: string) => {
    setWaiterCalls((prev) => prev.filter((c) => c.id !== callId));
  };

  const filteredOrders = orders.filter((o) => {
    if (filterStatus === 'ALL') return true;
    return o.orderStatus === filterStatus;
  });

  const newOrdersCount = orders.filter((o) => o.orderStatus === 'NEW').length;

  return (
    <div className="min-h-screen bg-[#0A0A0C] text-slate-100 p-4 sm:p-6 space-y-6">
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-zinc-800/80">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-amber-500/10 border border-amber-500/30 text-amber-400 rounded-2xl shadow-md">
            <ChefHat className="w-6 h-6" />
          </div>
          <div>
            <h1 className="font-serif-luxury font-bold text-xl text-white">{t('staffDashboard')}</h1>
            <p className="text-zinc-400 text-xs">
              Meraf Cafe Kitchen & Staff Display System • Logged in as{' '}
              <span className="text-amber-400 font-bold">{user?.name}</span>
            </p>
          </div>
        </div>

        {/* Live Status Controls */}
        <div className="flex items-center gap-3">
          <div
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold ${
              isConnected
                ? 'bg-emerald-950/80 border border-emerald-500/40 text-emerald-300'
                : 'bg-red-950/80 border border-red-500/40 text-red-300 animate-pulse'
            }`}
          >
            {isConnected ? <Wifi className="w-3.5 h-3.5" /> : <WifiOff className="w-3.5 h-3.5" />}
            <span>{isConnected ? t('connected') : t('disconnected')}</span>
          </div>

          <button
            type="button"
            onClick={() => setSoundEnabled(!soundEnabled)}
            className={`p-2.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition-colors ${
              soundEnabled
                ? 'bg-zinc-900 border-amber-500/40 text-amber-400'
                : 'bg-zinc-900 border-zinc-800 text-zinc-500'
            }`}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            <span className="hidden sm:inline">{soundEnabled ? 'Chime ON' : 'Chime OFF'}</span>
          </button>

          <button
            type="button"
            onClick={fetchOrders}
            className="p-2.5 bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 text-zinc-200 rounded-xl transition-colors"
            title="Refresh Orders"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={logout}
            className="px-3.5 py-2.5 bg-red-950/70 border border-red-500/40 hover:bg-red-900 text-red-200 hover:text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-md cursor-pointer"
            title={t('logout')}
          >
            <LogOut className="w-4 h-4 text-red-400" />
            <span>{t('logout')}</span>
          </button>
        </div>
      </div>

      {/* Active Table Assistance Calls Panel */}
      {waiterCalls.length > 0 && (
        <div className="bg-[#181512] border border-amber-500/50 text-slate-100 rounded-3xl p-4 sm:p-5 shadow-xl space-y-3 animate-fade-in">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-amber-500/20 border border-amber-500/40 text-amber-400 rounded-xl animate-bounce">
                <Bell className="w-5 h-5 text-amber-400" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-serif-luxury font-bold text-sm sm:text-base text-amber-300">
                    Active Table Assistance Calls
                  </h3>
                  <span className="bg-amber-500 text-stone-950 font-black text-[10px] px-2 py-0.5 rounded-full">
                    {waiterCalls.filter((c) => !c.acknowledged).length} Pending
                  </span>
                </div>
                <p className="text-[11px] text-zinc-400">
                  Customers requesting waiter attendance at their tables in real time
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setWaiterCalls([])}
              className="text-xs text-zinc-400 hover:text-white underline cursor-pointer"
            >
              Clear All
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 pt-1">
            {waiterCalls.map((call) => (
              <div
                key={call.id}
                className={`p-3 rounded-2xl border transition-all flex flex-col justify-between gap-2.5 ${
                  call.acknowledged
                    ? 'bg-zinc-900/60 border-zinc-800 opacity-60'
                    : 'bg-amber-950/40 border-amber-500/60 shadow-md shadow-amber-500/10'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="bg-amber-500/20 text-amber-400 border border-amber-500/40 px-2.5 py-1 rounded-xl font-mono font-black text-xs">
                      Table #{call.tableNumber}
                    </span>
                    <span className="text-[10px] text-zinc-400 font-medium">
                      {new Date(call.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleDismissCall(call.id)}
                    className="text-zinc-500 hover:text-zinc-300 p-1 hover:bg-zinc-800 rounded-lg"
                    title="Dismiss"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>

                <p className="text-xs font-semibold text-zinc-200">{call.reason}</p>

                <div className="pt-1 border-t border-zinc-800/80 flex items-center justify-between">
                  <span className="text-[10px] font-bold text-amber-400/90">
                    {call.acknowledged ? '✓ Attended' : '⚡ Action Required'}
                  </span>

                  {!call.acknowledged ? (
                    <button
                      type="button"
                      onClick={() => handleAcknowledgeCall(call.id)}
                      className="px-3 py-1 bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-[11px] rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                    >
                      <Check className="w-3 h-3" />
                      <span>Acknowledge</span>
                    </button>
                  ) : (
                    <span className="text-[10px] text-emerald-400 font-bold flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" />
                      Acknowledged
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        {['ALL', 'NEW', 'ACCEPTED', 'PREPARING', 'READY', 'COMPLETED', 'CANCELLED'].map((st) => {
          const count = orders.filter((o) => (st === 'ALL' ? true : o.orderStatus === st)).length;
          const isActive = filterStatus === st;
          return (
            <button
              key={st}
              type="button"
              onClick={() => setFilterStatus(st)}
              className={`px-4 py-2 rounded-2xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-2 ${
                isActive
                  ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-stone-950 shadow-md shadow-amber-500/20 font-black'
                  : 'bg-zinc-900/80 border border-zinc-800 text-zinc-400 hover:border-zinc-700 hover:text-white'
              }`}
            >
              <span>{st === 'ALL' ? 'All Orders' : t(`status${st}`)}</span>
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                  isActive ? 'bg-stone-950 text-amber-400' : 'bg-zinc-800 text-zinc-400'
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Orders Grid */}
      {isLoading ? (
        <div className="text-center py-20">
          <RefreshCw className="w-8 h-8 text-amber-400 animate-spin mx-auto mb-2" />
          <p className="text-zinc-400 text-xs font-medium">Loading orders...</p>
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="text-center py-20 bg-[#121215] border border-dashed border-zinc-800 rounded-3xl p-8">
          <Utensils className="w-12 h-12 text-zinc-600 mx-auto mb-3" />
          <h3 className="text-zinc-300 font-bold text-base">No orders in this queue</h3>
          <p className="text-zinc-500 text-xs mt-1">
            New customer orders will appear here automatically in real time.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredOrders.map((ord) => {
            const created = new Date(ord.createdAt);
            const elapsedMins = Math.max(0, Math.floor((Date.now() - created.getTime()) / 60000));

            return (
              <div
                key={ord.id}
                className={`bg-[#121215] rounded-3xl border shadow-xl flex flex-col justify-between overflow-hidden transition-all ${
                  ord.orderStatus === 'NEW'
                    ? 'border-amber-500 ring-2 ring-amber-500/20 amber-glow'
                    : 'border-zinc-800'
                }`}
              >
                {/* Header Badge */}
                <div className="p-4 bg-[#16161a] border-b border-zinc-800/80 flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-serif-luxury font-extrabold text-white text-lg">
                        {ord.orderNumber}
                      </span>
                      <span className="bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-bold px-2.5 py-0.5 rounded-full">
                        {t('tableDetected')} #{ord.tableNumber}
                      </span>
                    </div>
                    <span className="text-[11px] text-zinc-400 font-medium flex items-center gap-1 mt-1">
                      <Clock className="w-3.5 h-3.5 text-amber-400" />
                      Elapsed: <strong className="text-slate-200">{elapsedMins} mins</strong>
                    </span>
                  </div>

                  <span
                    className={`text-xs font-black px-3 py-1 rounded-full uppercase tracking-wider ${
                      ord.orderStatus === 'NEW'
                        ? 'bg-amber-500 text-stone-950 shadow-md shadow-amber-500/20'
                        : ord.orderStatus === 'ACCEPTED'
                        ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                        : ord.orderStatus === 'PREPARING'
                        ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                        : ord.orderStatus === 'READY'
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        : 'bg-zinc-800 text-zinc-400 border border-zinc-700'
                    }`}
                  >
                    {ord.orderStatus}
                  </span>
                </div>

                {/* Items List */}
                <div className="p-4 space-y-3 flex-1">
                  {ord.items.map((item) => (
                    <div
                      key={item.id}
                      className="p-3 bg-zinc-900/80 rounded-2xl border border-zinc-800 space-y-1"
                    >
                      <div className="flex justify-between items-start">
                        <span className="font-bold text-slate-100 text-xs">
                          {item.quantity} × {language === 'am' ? item.productNameAm : item.productNameEn}
                        </span>
                        <span className="text-amber-400 font-extrabold text-xs">
                          {item.totalPrice} ETB
                        </span>
                      </div>

                      {item.variationNameEn && (
                        <span className="text-[10px] bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2 py-0.5 rounded-md inline-block">
                          {item.variationNameEn}
                        </span>
                      )}

                      {item.addOns && item.addOns.length > 0 && (
                        <div className="text-[10px] text-zinc-400 pl-2 border-l border-amber-500/80">
                          {item.addOns.map((a) => (
                            <span key={a.id} className="block">+ {a.nameEn}</span>
                          ))}
                        </div>
                      )}

                      {item.specialInstructions && (
                        <p className="text-[10px] italic text-amber-300/90 bg-zinc-950 p-1.5 rounded-lg border border-zinc-800">
                          Note: "{item.specialInstructions}"
                        </p>
                      )}
                    </div>
                  ))}

                  {ord.customerNote && (
                    <div className="p-2.5 bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs rounded-xl italic">
                      Kitchen Note: "{ord.customerNote}"
                    </div>
                  )}
                </div>

                {/* Footer Controls & Actions */}
                <div className="p-4 bg-[#16161a] border-t border-zinc-800/80 space-y-3">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-zinc-400">
                      Payment: <strong className="text-slate-200">{ord.paymentMethod}</strong>
                    </span>
                    <span
                      className={`font-bold px-2.5 py-0.5 rounded-md text-[10px] ${
                        ord.paymentStatus === 'PAID'
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                          : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                      }`}
                    >
                      {ord.paymentStatus}
                    </span>
                  </div>

                  {/* Actions according to state */}
                  <div className="grid grid-cols-2 gap-2 pt-1">
                    {ord.orderStatus === 'NEW' && (
                      <>
                        <button
                          type="button"
                          onClick={() => handleUpdateStatus(ord.id, 'ACCEPTED')}
                          className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2 px-3 rounded-xl text-xs flex items-center justify-center gap-1 shadow-sm transition-colors"
                        >
                          <Check className="w-4 h-4" />
                          <span>{t('acceptOrder')}</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleUpdateStatus(ord.id, 'CANCELLED')}
                          className="bg-red-900/80 hover:bg-red-800 border border-red-700 text-red-200 font-bold py-2 px-3 rounded-xl text-xs flex items-center justify-center gap-1 shadow-sm transition-colors"
                        >
                          <X className="w-4 h-4" />
                          <span>{t('rejectOrder')}</span>
                        </button>
                      </>
                    )}

                    {ord.orderStatus === 'ACCEPTED' && (
                      <button
                        type="button"
                        onClick={() => handleUpdateStatus(ord.id, 'PREPARING')}
                        className="col-span-2 bg-purple-600 hover:bg-purple-500 text-white font-bold py-2.5 px-3 rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-sm transition-colors"
                      >
                        <ChefHat className="w-4 h-4" />
                        <span>{t('markPreparing')}</span>
                      </button>
                    )}

                    {ord.orderStatus === 'PREPARING' && (
                      <button
                        type="button"
                        onClick={() => handleUpdateStatus(ord.id, 'READY')}
                        className="col-span-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2.5 px-3 rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-sm transition-colors"
                      >
                        <Sparkles className="w-4 h-4" />
                        <span>{t('markReady')}</span>
                      </button>
                    )}

                    {ord.orderStatus === 'READY' && (
                      <button
                        type="button"
                        onClick={() => handleUpdateStatus(ord.id, 'COMPLETED', 'PAID')}
                        className="col-span-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-stone-950 font-extrabold py-2.5 px-3 rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-md shadow-amber-500/20 transition-colors"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        <span>{t('markCompleted')} & Paid</span>
                      </button>
                    )}

                    {ord.paymentStatus === 'UNPAID' && ord.orderStatus !== 'CANCELLED' && (
                      <button
                        type="button"
                        onClick={() => handleUpdateStatus(ord.id, ord.orderStatus, 'PAID')}
                        className="col-span-2 bg-zinc-900 hover:bg-zinc-800 text-amber-400 font-bold py-1.5 px-3 rounded-xl text-[11px] flex items-center justify-center gap-1 border border-zinc-800 transition-colors mt-1"
                      >
                        <Banknote className="w-3.5 h-3.5" />
                        <span>{t('markPaid')}</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
