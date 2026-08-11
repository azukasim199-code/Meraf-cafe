import React, { useEffect, useState } from 'react';
import { useCart } from './context/CartContext';
import { useAuth } from './context/AuthContext';
import { useLanguage } from './context/LanguageContext';
import { Category, Product, AddOn, CafeTable } from './types';

import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { LandingPage } from './components/LandingPage';
import { CustomerMenu } from './components/CustomerMenu';
import { CartDrawer } from './components/CartDrawer';
import { CheckoutModal } from './components/CheckoutModal';
import { OrderTracker } from './components/OrderTracker';
import { StaffDashboard } from './components/StaffDashboard';
import { AdminDashboard } from './components/AdminDashboard';
import { LoginPage } from './components/LoginPage';
import { ToastContainer, ToastNotification } from './components/ToastContainer';

import { ShoppingBag, Utensils, AlertTriangle, X } from 'lucide-react';

export const App: React.FC = () => {
  const { cartItems, addToCart, totalItemCount, subtotal } = useCart();
  const { user } = useAuth();
  const { t, language } = useLanguage();

  // Toast Notification State
  const [toasts, setToasts] = useState<ToastNotification[]>([]);

  // Navigation State
  const [currentView, setCurrentView] = useState<
    'home' | 'menu' | 'track' | 'staff' | 'admin' | 'login'
  >('home');

  // Menu Data State
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [addOns, setAddOns] = useState<AddOn[]>([]);
  const [cafeInfo, setCafeInfo] = useState<any>(null);

  // Table Context State
  const [activeTable, setActiveTable] = useState<CafeTable | null>(null);
  const [activeTableError, setActiveTableError] = useState<string | null>(null);

  // Order Tracking Token State
  const [activeTrackingToken, setActiveTrackingToken] = useState<string | null>(null);

  // Modal / Drawer visibility
  const [isCartOpen, setIsCartOpen] = useState<boolean>(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState<boolean>(false);

  // Fetch initial public menu data
  useEffect(() => {
    fetch('/api/menu/public')
      .then((res) => res.json())
      .then((data) => {
        setCategories(data.categories || []);
        setProducts(data.products || []);
        setAddOns(data.addOns || []);
        setCafeInfo(data.cafeInfo || null);
      })
      .catch((err) => console.error(err));
  }, []);

  // Parse URL parameters or path for Table QR token or Order Tracking Token
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tableParam = params.get('table') || params.get('t');
    const trackParam = params.get('track');

    if (trackParam) {
      setActiveTrackingToken(trackParam);
      setCurrentView('track');
    }

    if (tableParam) {
      validateAndSetTable(tableParam);
    } else {
      // Check path format e.g. /table/xxx or /track/xxx
      const pathname = window.location.pathname;
      if (pathname.startsWith('/table/') || pathname.startsWith('/order/')) {
        const tokenFromPath = pathname.replace('/table/', '').replace('/order/', '');
        if (tokenFromPath) validateAndSetTable(tokenFromPath);
      } else if (pathname.startsWith('/track/')) {
        const trackTokenFromPath = pathname.replace('/track/', '');
        if (trackTokenFromPath) {
          setActiveTrackingToken(trackTokenFromPath);
          setCurrentView('track');
        }
      }
    }
  }, []);

  // Automatic View Redirect when logged in as Staff or Admin
  useEffect(() => {
    if (user) {
      if (user.role === 'OWNER' || user.role === 'MANAGER') {
        setCurrentView('admin');
      } else if (user.role === 'STAFF') {
        setCurrentView('staff');
      }
    }
  }, [user]);

  // Toast Helpers
  const addToast = (toast: Omit<ToastNotification, 'id' | 'createdAt'>) => {
    const newToast: ToastNotification = {
      ...toast,
      id: `toast_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      createdAt: new Date(),
    };
    setToasts((prev) => [newToast, ...prev].slice(0, 5));
  };

  const handleDismissToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const playChimeSound = () => {
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
      osc.frequency.setValueAtTime(880, ctx.currentTime + 0.15); // A5
      gain.gain.setValueAtTime(0.35, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.6);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.6);
    } catch (e) {
      // AudioContext fallback
    }
  };

  // Real-time SSE Toast Notification Listener for Staff / Owner / Manager
  useEffect(() => {
    if (!user || (user.role !== 'STAFF' && user.role !== 'OWNER' && user.role !== 'MANAGER')) {
      return;
    }

    const sse = new EventSource('/api/realtime/sse?role=staff');

    sse.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data);
        if (payload.type === 'NEW_ORDER') {
          const order = payload.data;
          playChimeSound();
          addToast({
            title: '🔔 New Order Received!',
            message: `Table #${order.tableNumber} placed an order for ${
              order.items?.length || 1
            } item(s)`,
            orderNumber: order.orderNumber,
            tableNumber: order.tableNumber,
            totalPrice: order.totalAmount,
            itemCount: order.items?.length,
            type: 'NEW_ORDER',
          });
        } else if (payload.type === 'CALL_WAITER') {
          const waiterData = payload.data;
          playChimeSound();
          addToast({
            title: '👋 Waiter Assistance Requested!',
            message: `Table #${waiterData.tableNumber} is requesting help (${waiterData.reason || 'General Assistance'})`,
            tableNumber: waiterData.tableNumber,
            type: 'ALERT',
          });
        }
      } catch (e) {
        // ignore
      }
    };

    return () => {
      sse.close();
    };
  }, [user]);

  const validateAndSetTable = async (tableToken: string) => {
    try {
      const res = await fetch(`/api/tables/validate/${tableToken}`);
      const data = await res.json();

      if (!res.ok) {
        setActiveTableError(
          language === 'am'
            ? data.messageAm || 'የጠረጴዛ ቁጥር አልተገኘም'
            : data.messageEn || 'Invalid table QR code'
        );
        setActiveTable(null);
        return;
      }

      setActiveTable(data.table);
      setActiveTableError(null);
      setCurrentView('menu');
    } catch (err) {
      setActiveTableError('Network error validating table QR code');
    }
  };

  const handleAddToCart = (
    product: Product,
    selectedVariation?: any,
    selectedAddOns?: any,
    quantity?: number,
    specialInstructions?: string
  ) => {
    addToCart(product, selectedVariation, selectedAddOns, quantity, specialInstructions);
  };

  const handleOrderSuccess = (trackingToken: string) => {
    setIsCheckoutOpen(false);
    setActiveTrackingToken(trackingToken);
    setCurrentView('track');
    // Update window URL gracefully without full page reload
    window.history.pushState({}, '', `?track=${trackingToken}`);
  };

  return (
    <div className="min-h-screen bg-[#0A0A0A] bg-ambient-radial font-sans text-slate-100 flex flex-col justify-between selection:bg-amber-500/30 selection:text-amber-300">
      <div>
        {/* Navigation Bar */}
        <Navbar
          activeTableNumber={activeTable?.tableNumber}
          currentView={currentView}
          onNavigate={(view) => setCurrentView(view as any)}
          onOpenCart={() => setIsCartOpen(true)}
        />

        {/* Global Cafe Closed Banner if applicable */}
        {cafeInfo?.isClosed && (
          <div className="bg-red-950/90 border-b border-red-800/80 text-red-200 p-3 text-center text-xs font-bold shadow-lg flex items-center justify-center gap-2">
            <AlertTriangle className="w-4 h-4 text-red-400" />
            <span>{t('closedMessage')}</span>
          </div>
        )}

        {/* Invalid Table QR Code Alert Banner */}
        {activeTableError && (
          <div className="bg-amber-950/80 border-b border-amber-800/80 text-amber-200 p-3 text-xs font-bold flex items-center justify-between px-4 max-w-7xl mx-auto my-2 rounded-xl">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
              <span>{activeTableError}</span>
            </div>
            <button
              type="button"
              onClick={() => setActiveTableError(null)}
              className="p-1 hover:bg-amber-900/60 rounded-md transition-colors text-amber-300"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* View Router Render */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {currentView === 'home' && (
            <LandingPage
              onSelectTable={(tableToken) => validateAndSetTable(tableToken)}
              onNavigate={(view) => setCurrentView(view as any)}
            />
          )}

          {currentView === 'menu' && (
            <div className="space-y-6">
              {/* Active Table Badge Banner */}
              {activeTable && (
                <div className="bg-[#141418] border border-amber-500/30 text-slate-100 p-4 rounded-2xl shadow-xl flex items-center justify-between backdrop-blur-md">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded-xl">
                      <Utensils className="w-5 h-5" />
                    </div>
                    <div>
                      <h2 className="font-serif-luxury font-bold text-sm text-amber-300">
                        {t('tableDetected')} #{activeTable.tableNumber}
                      </h2>
                      <p className="text-[11px] text-zinc-400">
                        Select items, customize, and submit order directly to kitchen.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <CustomerMenu
                categories={categories}
                products={products}
                addOns={addOns}
                onAddToCart={handleAddToCart}
                activeTable={activeTable}
              />
            </div>
          )}

          {currentView === 'track' && activeTrackingToken && (
            <OrderTracker
              trackingToken={activeTrackingToken}
              onOrderMore={() => setCurrentView('menu')}
            />
          )}

          {currentView === 'staff' && <StaffDashboard />}

          {currentView === 'admin' && <AdminDashboard />}

          {currentView === 'login' && <LoginPage />}
        </div>
      </div>

      {/* Floating Bottom Cart Bar for Customers */}
      {cartItems.length > 0 && currentView === 'menu' && (
        <div className="fixed bottom-6 inset-x-4 max-w-md mx-auto z-40 animate-slide-up">
          <button
            type="button"
            onClick={() => setIsCartOpen(true)}
            className="w-full bg-[#121215] hover:bg-[#18181C] text-white p-4 rounded-2xl shadow-2xl border border-amber-500/40 amber-glow flex items-center justify-between transition-all transform hover:scale-[1.01]"
          >
            <div className="flex items-center gap-3">
              <div className="relative">
                <ShoppingBag className="w-6 h-6 text-amber-400" />
                <span className="absolute -top-2 -right-2 bg-amber-500 text-stone-950 font-black text-[10px] w-5 h-5 rounded-full flex items-center justify-center">
                  {totalItemCount}
                </span>
              </div>
              <div className="text-left">
                <div className="font-serif-luxury font-bold text-sm text-white">{t('cartTitle')}</div>
                <div className="text-[11px] text-amber-400 font-bold">
                  {subtotal} {t('currencyEtb')}
                </div>
              </div>
            </div>

            <span className="bg-amber-500 hover:bg-amber-400 text-stone-950 text-xs font-bold px-4 py-2 rounded-xl transition-colors shadow-md shadow-amber-500/20">
              {t('checkout')}
            </span>
          </button>
        </div>
      )}

      {/* Slide-over Cart Drawer */}
      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        onProceedToCheckout={() => setIsCheckoutOpen(true)}
      />

      {/* Checkout Modal */}
      {isCheckoutOpen && activeTable && (
        <CheckoutModal
          tableToken={activeTable.token}
          tableNumber={activeTable.tableNumber}
          onClose={() => setIsCheckoutOpen(false)}
          onOrderSuccess={handleOrderSuccess}
        />
      )}

      {/* Global Toast Notifications Container for Staff/Admin */}
      <ToastContainer
        toasts={toasts}
        onDismiss={handleDismissToast}
        onNavigateToStaff={() => setCurrentView('staff')}
      />

      {/* Footer */}
      <Footer />
    </div>
  );
};

export default App;
