import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import {
  TrendingUp,
  ShoppingBag,
  Banknote,
  Calendar,
  Sparkles,
  PieChart,
  RefreshCw,
  BarChart2,
  LineChart as LineChartIcon,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';

export const AdminAnalytics: React.FC = () => {
  const { token } = useAuth();
  const { t } = useLanguage();

  const [period, setPeriod] = useState<string>('7days');
  const [chartType, setChartType] = useState<'area' | 'bar'>('area');
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const fetchAnalytics = () => {
    setIsLoading(true);
    fetch(`/api/admin/analytics?period=${period}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((resData) => setData(resData))
      .catch((err) => console.error(err))
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    fetchAnalytics();
  }, [period, token]);

  if (isLoading || !data) {
    return (
      <div className="py-20 text-center">
        <RefreshCw className="w-8 h-8 text-amber-500 animate-spin mx-auto mb-2" />
        <p className="text-zinc-400 text-xs font-medium">Fetching real sales data...</p>
      </div>
    );
  }

  const trends = data.dailyTrends || [];

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-[#18181b] p-3 rounded-xl border border-amber-500/30 shadow-2xl text-xs space-y-1">
          <p className="font-serif-luxury font-bold text-amber-400">{label}</p>
          <div className="text-white font-extrabold flex justify-between gap-4">
            <span className="text-zinc-400">Revenue:</span>
            <span className="text-amber-400">{payload[0].value} ETB</span>
          </div>
          {payload[1] && (
            <div className="text-white font-extrabold flex justify-between gap-4">
              <span className="text-zinc-400">Orders:</span>
              <span className="text-emerald-400">{payload[1].value}</span>
            </div>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6">
      {/* Date Filter Pills */}
      <div className="flex items-center justify-between flex-wrap gap-4 bg-[#121215] p-4 rounded-2xl border border-zinc-800 shadow-xl">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-amber-500/10 text-amber-400 rounded-xl border border-amber-500/20">
            <Calendar className="w-5 h-5" />
          </div>
          <h3 className="font-serif-luxury font-bold text-white text-base">{t('analytics')}</h3>
        </div>

        <div className="flex items-center gap-1.5 bg-zinc-900 p-1.5 rounded-xl border border-zinc-800">
          {[
            { id: 'today', label: 'Today' },
            { id: 'yesterday', label: 'Yesterday' },
            { id: '7days', label: 'Last 7 Days' },
            { id: '30days', label: 'Last 30 Days' },
            { id: 'all', label: 'All Time' },
          ].map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setPeriod(item.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                period === item.id
                  ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-stone-950 font-black shadow-md shadow-amber-500/20'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-[#121215] p-5 rounded-2xl border border-zinc-800 shadow-xl space-y-2">
          <div className="flex items-center justify-between text-zinc-400">
            <span className="text-xs font-bold uppercase tracking-wider">{t('todayRevenue')}</span>
            <div className="p-2 bg-amber-500/10 text-amber-400 rounded-xl border border-amber-500/20">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="font-serif-luxury font-extrabold text-2xl text-white">
            {data.totalRevenue} <span className="text-sm font-bold text-amber-400">ETB</span>
          </div>
        </div>

        <div className="bg-[#121215] p-5 rounded-2xl border border-zinc-800 shadow-xl space-y-2">
          <div className="flex items-center justify-between text-zinc-400">
            <span className="text-xs font-bold uppercase tracking-wider">{t('todayOrders')}</span>
            <div className="p-2 bg-blue-500/10 text-blue-400 rounded-xl border border-blue-500/20">
              <ShoppingBag className="w-5 h-5" />
            </div>
          </div>
          <div className="font-serif-luxury font-extrabold text-2xl text-white">
            {data.totalOrdersCount} <span className="text-sm font-bold text-zinc-400">orders</span>
          </div>
        </div>

        <div className="bg-[#121215] p-5 rounded-2xl border border-zinc-800 shadow-xl space-y-2">
          <div className="flex items-center justify-between text-zinc-400">
            <span className="text-xs font-bold uppercase tracking-wider">{t('avgOrderValue')}</span>
            <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-xl border border-emerald-500/20">
              <Banknote className="w-5 h-5" />
            </div>
          </div>
          <div className="font-serif-luxury font-extrabold text-2xl text-white">
            {data.avgOrderValue} <span className="text-sm font-bold text-amber-400">ETB</span>
          </div>
        </div>

        <div className="bg-[#121215] p-5 rounded-2xl border border-zinc-800 shadow-xl space-y-2">
          <div className="flex items-center justify-between text-zinc-400">
            <span className="text-xs font-bold uppercase tracking-wider">Cash vs Online</span>
            <div className="p-2 bg-purple-500/10 text-purple-400 rounded-xl border border-purple-500/20">
              <PieChart className="w-5 h-5" />
            </div>
          </div>
          <div className="text-xs space-y-1 font-semibold text-zinc-300">
            <div className="flex justify-between">
              <span>Cash:</span>
              <span className="font-extrabold text-white">{data.cashSales} ETB</span>
            </div>
            <div className="flex justify-between">
              <span>Online:</span>
              <span className="font-extrabold text-emerald-400">{data.onlineSales} ETB</span>
            </div>
          </div>
        </div>
      </div>

      {/* Recharts Daily Sales Trends Widget */}
      <div className="bg-[#121215] p-6 rounded-2xl border border-zinc-800 shadow-xl space-y-5">
        <div className="flex items-center justify-between flex-wrap gap-4 border-b border-zinc-800/80 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-amber-400" />
              <h4 className="font-serif-luxury font-bold text-white text-base">
                Daily Sales & Order Trend
              </h4>
            </div>
            <p className="text-zinc-400 text-xs mt-0.5">
              Interactive sales revenue and volume timeline for Meraf Cafe ({period})
            </p>
          </div>

          <div className="flex items-center gap-1 bg-zinc-900 p-1 rounded-xl border border-zinc-800">
            <button
              type="button"
              onClick={() => setChartType('area')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
                chartType === 'area'
                  ? 'bg-amber-500 text-stone-950 font-extrabold shadow-sm'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              <LineChartIcon className="w-3.5 h-3.5" />
              <span>Revenue Area</span>
            </button>
            <button
              type="button"
              onClick={() => setChartType('bar')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
                chartType === 'bar'
                  ? 'bg-amber-500 text-stone-950 font-extrabold shadow-sm'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              <BarChart2 className="w-3.5 h-3.5" />
              <span>Order Bars</span>
            </button>
          </div>
        </div>

        <div className="w-full h-72 pt-2">
          {trends.length === 0 ? (
            <div className="h-full flex items-center justify-center text-zinc-500 text-xs">
              No trend data available for this range.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              {chartType === 'area' ? (
                <AreaChart data={trends} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="amberRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                  <XAxis dataKey="label" stroke="#71717a" fontSize={11} tickLine={false} />
                  <YAxis stroke="#71717a" fontSize={11} tickLine={false} unit=" ETB" />
                  <Tooltip content={<CustomTooltip />} />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    name="Revenue (ETB)"
                    stroke="#f59e0b"
                    strokeWidth={3}
                    fillOpacity={1}
                    fill="url(#amberRevenue)"
                  />
                </AreaChart>
              ) : (
                <BarChart data={trends} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                  <XAxis dataKey="label" stroke="#71717a" fontSize={11} tickLine={false} />
                  <YAxis stroke="#71717a" fontSize={11} tickLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="revenue" name="Revenue (ETB)" fill="#f59e0b" radius={[6, 6, 0, 0]} />
                  <Bar dataKey="orders" name="Orders Count" fill="#10b981" radius={[6, 6, 0, 0]} />
                </BarChart>
              )}
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Top Products Table */}
      <div className="bg-[#121215] p-6 rounded-2xl border border-zinc-800 shadow-xl space-y-4">
        <div className="flex items-center justify-between border-b border-zinc-800/80 pb-3">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-400" />
            <h4 className="font-serif-luxury font-bold text-white text-base">{t('popularItems')}</h4>
          </div>
        </div>

        {data.topProducts.length === 0 ? (
          <p className="text-zinc-500 text-xs py-4">No product sales recorded for this period.</p>
        ) : (
          <div className="divide-y divide-zinc-800/80">
            {data.topProducts.map((p: any, idx: number) => (
              <div key={p.nameEn} className="py-3 flex items-center justify-between text-xs">
                <div className="flex items-center gap-3">
                  <span className="w-6 h-6 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/30 font-black text-[11px] flex items-center justify-center">
                    #{idx + 1}
                  </span>
                  <div>
                    <h5 className="font-bold text-white text-xs">{p.nameEn}</h5>
                    <span className="text-[11px] text-zinc-400">{p.nameAm}</span>
                  </div>
                </div>

                <div className="text-right">
                  <div className="font-extrabold text-white text-xs">{p.count} sold</div>
                  <div className="text-amber-400 font-bold text-[11px]">{p.totalEtb} ETB revenue</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

