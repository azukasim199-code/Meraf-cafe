import React, { useEffect, useState } from 'react';
import { Order } from '../types';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import {
  Search,
  Calendar,
  Eye,
  Printer,
  RefreshCw,
  ShoppingBag,
  Filter,
} from 'lucide-react';

export const AdminOrderHistory: React.FC = () => {
  const { token } = useAuth();
  const { t } = useLanguage();

  const [orders, setOrders] = useState<Order[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedOrderForModal, setSelectedOrderForModal] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const fetchOrders = () => {
    setIsLoading(true);
    fetch('/api/orders/staff/list', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setOrders(data);
      })
      .catch((err) => console.error(err))
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    fetchOrders();
  }, [token]);

  const filteredOrders = orders.filter((o) => {
    const q = searchQuery.toLowerCase().trim();
    return (
      !q ||
      o.orderNumber.toLowerCase().includes(q) ||
      o.tableNumber.includes(q) ||
      o.paymentMethod.toLowerCase().includes(q) ||
      o.orderStatus.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      {/* Header & Search */}
      <div className="bg-[#121215] p-4 rounded-2xl border border-zinc-800 shadow-xl flex items-center justify-between flex-wrap gap-4">
        <div>
          <h3 className="font-serif-luxury font-bold text-white text-lg">{t('orderHistoryAdmin')}</h3>
          <p className="text-zinc-400 text-xs mt-0.5">
            Search and view full historic order logs and print receipts.
          </p>
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search order #, table #..."
            className="w-full pl-9 pr-3 py-2 text-xs bg-zinc-900 border border-zinc-800 text-slate-100 rounded-xl focus:outline-none focus:ring-1 focus:ring-amber-500"
          />
        </div>
      </div>

      {/* Orders Table */}
      {isLoading ? (
        <div className="py-20 text-center">
          <RefreshCw className="w-8 h-8 text-amber-400 animate-spin mx-auto" />
        </div>
      ) : (
        <div className="bg-[#121215] rounded-2xl border border-zinc-800 overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-100">
              <thead className="bg-[#16161a] border-b border-zinc-800 text-amber-400 font-bold uppercase tracking-wider">
                <tr>
                  <th className="p-3.5">Order #</th>
                  <th className="p-3.5">Table</th>
                  <th className="p-3.5">Date & Time</th>
                  <th className="p-3.5">Total (ETB)</th>
                  <th className="p-3.5">Payment</th>
                  <th className="p-3.5">Order Status</th>
                  <th className="p-3.5 text-right">View</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/80">
                {filteredOrders.map((ord) => (
                  <tr key={ord.id} className="hover:bg-zinc-900/60 transition-colors">
                    <td className="p-3.5 font-bold font-serif-luxury text-white">
                      {ord.orderNumber}
                    </td>
                    <td className="p-3.5 text-zinc-300 font-semibold">
                      Table #{ord.tableNumber}
                    </td>
                    <td className="p-3.5 text-zinc-400">
                      {new Date(ord.createdAt).toLocaleString()}
                    </td>
                    <td className="p-3.5 font-extrabold text-amber-400">
                      {ord.total} ETB
                    </td>
                    <td className="p-3.5">
                      <span className="font-semibold text-zinc-200 block">{ord.paymentMethod}</span>
                      <span
                        className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md inline-block mt-0.5 ${
                          ord.paymentStatus === 'PAID'
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                            : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                        }`}
                      >
                        {ord.paymentStatus}
                      </span>
                    </td>
                    <td className="p-3.5 font-bold uppercase text-[11px] text-zinc-300">
                      {ord.orderStatus}
                    </td>
                    <td className="p-3.5 text-right">
                      <button
                        type="button"
                        onClick={() => setSelectedOrderForModal(ord)}
                        className="p-1.5 bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 text-zinc-200 rounded-lg text-xs font-semibold inline-flex items-center gap-1 transition-colors"
                      >
                        <Eye className="w-3.5 h-3.5 text-amber-400" />
                        <span>Details</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Details Modal */}
      {selectedOrderForModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950/80 backdrop-blur-md p-4">
          <div className="bg-[#121215] text-slate-100 rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl relative border border-zinc-800">
            <div className="flex justify-between items-center border-b border-zinc-800 pb-3">
              <div>
                <h4 className="font-serif-luxury font-bold text-lg text-white">
                  {selectedOrderForModal.orderNumber}
                </h4>
                <p className="text-zinc-400 text-xs">
                  Table #{selectedOrderForModal.tableNumber} • {new Date(selectedOrderForModal.createdAt).toLocaleString()}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedOrderForModal(null)}
                className="text-zinc-400 hover:text-white font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2 text-xs divide-y divide-zinc-800/80">
              {selectedOrderForModal.items.map((item) => (
                <div key={item.id} className="pt-2 flex justify-between">
                  <div>
                    <span className="font-bold text-white">
                      {item.quantity} × {item.productNameEn}
                    </span>
                    {item.variationNameEn && (
                      <span className="block text-[10px] text-amber-400 font-semibold">
                        {item.variationNameEn}
                      </span>
                    )}
                  </div>
                  <span className="font-bold text-white">{item.totalPrice} ETB</span>
                </div>
              ))}
            </div>

            <div className="bg-zinc-900 p-3 rounded-xl border border-zinc-800 text-xs space-y-1">
              <div className="flex justify-between text-zinc-400">
                <span>Subtotal:</span>
                <span>{selectedOrderForModal.subtotal} ETB</span>
              </div>
              <div className="flex justify-between font-bold text-white text-sm pt-1 border-t border-zinc-800">
                <span>Total:</span>
                <span className="text-amber-400">{selectedOrderForModal.total} ETB</span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => window.print()}
              className="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-stone-950 font-black py-2.5 rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-md shadow-amber-500/20"
            >
              <Printer className="w-4 h-4" />
              <span>Print Order Receipt</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
