import React from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { LanguageSwitcher } from './LanguageSwitcher';
import { Coffee, ShoppingBag, UserCheck, Utensils, LayoutDashboard, LogOut } from 'lucide-react';

interface NavbarProps {
  onOpenCart?: () => void;
  tableNumber?: string;
  activeTableNumber?: string;
  currentView?: string;
  onNavigate?: (view: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  onOpenCart,
  tableNumber,
  activeTableNumber,
  currentView,
  onNavigate,
}) => {
  const { t } = useLanguage();
  const { totalItemCount } = useCart();
  const { user, logout } = useAuth();

  const displayTableNumber = tableNumber || activeTableNumber;

  return (
    <header className="sticky top-0 z-40 bg-[#0C0C0E]/95 backdrop-blur-xl text-slate-100 border-b border-zinc-800/80 shadow-2xl">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-16 sm:h-20 flex items-center justify-between gap-3">
        {/* Logo / Brand */}
        <div
          onClick={() => onNavigate && onNavigate('home')}
          className="flex items-center gap-2.5 sm:gap-3.5 cursor-pointer group shrink-0 py-1"
        >
          <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-gradient-to-br from-amber-500 to-amber-700 flex items-center justify-center text-stone-950 shadow-lg group-hover:from-amber-400 group-hover:to-amber-600 transition-all amber-glow shrink-0">
            <Coffee className="w-5 h-5 sm:w-6 sm:h-6 font-bold" />
          </div>
          <div className="flex flex-col justify-center pr-1 overflow-visible">
            <span className="font-serif-luxury text-lg sm:text-2xl font-black tracking-tight text-white block leading-tight group-hover:text-amber-400 transition-colors whitespace-nowrap">
              {t('cafeName')}
            </span>
            <span className="text-[10px] sm:text-xs text-amber-500/90 font-semibold tracking-wider uppercase block leading-none whitespace-nowrap mt-0.5">
              Addis Ababa • Ethiopia
            </span>
          </div>
        </div>

        {/* Table Number Badge (if scanned) */}
        {displayTableNumber && (
          <div className="hidden lg:flex items-center gap-1.5 bg-amber-950/60 border border-amber-500/30 px-3.5 py-1.5 rounded-full text-xs font-semibold text-amber-300 backdrop-blur-md shrink-0">
            <Utensils className="w-3.5 h-3.5 text-amber-400" />
            <span>
              {t('tableDetected')} #{displayTableNumber}
            </span>
          </div>
        )}

        {/* Controls */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <LanguageSwitcher />

          {/* Cart Icon (if customer view) */}
          {onOpenCart && (
            <button
              type="button"
              onClick={onOpenCart}
              className="relative p-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-200 hover:text-white hover:border-amber-500/50 hover:bg-zinc-800/80 transition-all"
              aria-label="View Cart"
            >
              <ShoppingBag className="w-5 h-5 text-amber-400" />
              {totalItemCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 bg-amber-500 text-stone-950 text-[11px] font-black w-5 h-5 rounded-full flex items-center justify-center shadow-lg shadow-amber-500/30">
                  {totalItemCount}
                </span>
              )}
            </button>
          )}

          {/* Staff/Admin Nav Link & Logout */}
          {user ? (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => onNavigate && onNavigate(user.role === 'STAFF' ? 'staff' : 'admin')}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-stone-950 text-xs font-bold transition-all shadow-md shadow-amber-500/20"
              >
                <LayoutDashboard className="w-4 h-4" />
                <span className="hidden md:inline">{user.role}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  logout();
                  if (onNavigate) onNavigate('home');
                }}
                className="flex items-center gap-1.5 text-zinc-300 hover:text-red-400 bg-zinc-900 border border-zinc-800 hover:border-red-500/40 text-xs font-semibold px-3 py-2 transition-colors rounded-xl hover:bg-red-950/30 cursor-pointer"
                title={t('logout')}
              >
                <LogOut className="w-4 h-4 text-red-400" />
                <span className="hidden md:inline">{t('logout')}</span>
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => onNavigate && onNavigate('login')}
              className="flex items-center gap-1.5 text-zinc-400 hover:text-amber-400 text-xs font-semibold px-2.5 py-2 transition-colors rounded-lg hover:bg-zinc-900"
            >
              <UserCheck className="w-4 h-4" />
              <span className="hidden md:inline">{t('login')}</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};

