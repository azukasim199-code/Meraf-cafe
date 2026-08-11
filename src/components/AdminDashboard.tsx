import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { AdminAnalytics } from './AdminAnalytics';
import { AdminMenuManager } from './AdminMenuManager';
import { AdminTableManager } from './AdminTableManager';
import { AdminOrderHistory } from './AdminOrderHistory';
import { AdminSettings } from './AdminSettings';
import { AdminAuditLogs } from './AdminAuditLogs';
import {
  TrendingUp,
  Utensils,
  QrCode,
  ShoppingBag,
  Settings,
  ShieldCheck,
  LogOut,
  Coffee,
} from 'lucide-react';

export const AdminDashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState<
    'analytics' | 'menu' | 'tables' | 'orders' | 'settings' | 'audit'
  >('analytics');

  return (
    <div className="min-h-screen bg-[#0A0A0C] text-slate-100 pb-12">
      {/* Admin Top Header Bar */}
      <header className="bg-[#121215] text-white border-b border-zinc-800/80 sticky top-0 z-30 shadow-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-600 to-amber-500 flex items-center justify-center text-stone-950 font-serif-luxury font-black shadow-md shadow-amber-500/20">
              MC
            </div>
            <div>
              <h1 className="font-serif-luxury font-bold text-base text-white">{t('adminDashboard')}</h1>
              <span className="text-[10px] text-amber-400 font-bold">
                Logged in as {user?.name} ({user?.role})
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={logout}
            className="px-3.5 py-2 rounded-xl bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 text-zinc-300 hover:text-white text-xs font-semibold flex items-center gap-1.5 transition-colors"
          >
            <LogOut className="w-4 h-4 text-amber-400" />
            <span>{t('logout')}</span>
          </button>
        </div>

        {/* Tab Bar */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center gap-1 overflow-x-auto border-t border-zinc-800/80 scrollbar-none">
          {[
            { id: 'analytics', label: t('analytics'), icon: TrendingUp },
            { id: 'menu', label: t('menuManagement'), icon: Utensils },
            { id: 'tables', label: t('tableManagement'), icon: QrCode },
            { id: 'orders', label: t('orderHistoryAdmin'), icon: ShoppingBag },
            { id: 'settings', label: t('settings'), icon: Settings },
            { id: 'audit', label: t('auditLogs'), icon: ShieldCheck },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id as any)}
                className={`py-3 px-4 text-xs font-bold whitespace-nowrap flex items-center gap-2 border-b-2 transition-all ${
                  isActive
                    ? 'border-amber-500 text-amber-400 bg-amber-500/10'
                    : 'border-transparent text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </header>

      {/* Main Tab Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
        <div className={activeTab === 'analytics' ? 'block' : 'hidden'}>
          <AdminAnalytics />
        </div>
        <div className={activeTab === 'menu' ? 'block' : 'hidden'}>
          <AdminMenuManager />
        </div>
        <div className={activeTab === 'tables' ? 'block' : 'hidden'}>
          <AdminTableManager />
        </div>
        <div className={activeTab === 'orders' ? 'block' : 'hidden'}>
          <AdminOrderHistory />
        </div>
        <div className={activeTab === 'settings' ? 'block' : 'hidden'}>
          <AdminSettings />
        </div>
        <div className={activeTab === 'audit' ? 'block' : 'hidden'}>
          <AdminAuditLogs />
        </div>
      </main>
    </div>
  );
};
