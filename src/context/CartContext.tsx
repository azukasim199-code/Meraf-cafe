import React, { createContext, useContext, useState, useEffect } from 'react';
import { Product, ProductVariation, AddOn, CartItem } from '../types';

interface CartContextType {
  cartItems: CartItem[];
  addToCart: (
    product: Product,
    selectedVariation?: ProductVariation,
    selectedAddOns?: AddOn[],
    quantity?: number,
    specialInstructions?: string
  ) => void;
  updateQuantity: (cartItemId: string, delta: number) => void;
  removeFromCart: (cartItemId: string) => void;
  clearCart: () => void;
  subtotal: number;
  totalItemCount: number;
  setTableToken: (token: string) => void;
  activeTableToken: string | null;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeTableToken, setActiveTableToken] = useState<string | null>(() => {
    return localStorage.getItem('meraf_active_table_token');
  });

  const [cartItems, setCartItems] = useState<CartItem[]>(() => {
    if (activeTableToken) {
      const saved = localStorage.getItem(`meraf_cart_${activeTableToken}`);
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch (e) {
          return [];
        }
      }
    }
    return [];
  });

  const setTableToken = (token: string) => {
    setActiveTableToken(token);
    localStorage.setItem('meraf_active_table_token', token);
  };

  useEffect(() => {
    if (activeTableToken) {
      localStorage.setItem(`meraf_cart_${activeTableToken}`, JSON.stringify(cartItems));
    }
  }, [cartItems, activeTableToken]);

  const addToCart = (
    product: Product,
    selectedVariation?: ProductVariation,
    selectedAddOns: AddOn[] = [],
    quantity = 1,
    specialInstructions?: string
  ) => {
    let unitPrice = selectedVariation ? selectedVariation.priceEtb : product.priceEtb;
    const addOnsTotal = selectedAddOns.reduce((sum, a) => sum + a.priceEtb, 0);
    const calculatedPrice = (unitPrice + addOnsTotal) * quantity;

    const newItem: CartItem = {
      id: `cart_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      product,
      selectedVariation,
      selectedAddOns,
      quantity,
      specialInstructions,
      calculatedPrice,
    };

    setCartItems((prev) => [...prev, newItem]);
  };

  const updateQuantity = (cartItemId: string, delta: number) => {
    setCartItems((prev) =>
      prev
        .map((item) => {
          if (item.id === cartItemId) {
            const newQty = item.quantity + delta;
            if (newQty <= 0) return null;
            let unitPrice = item.selectedVariation ? item.selectedVariation.priceEtb : item.product.priceEtb;
            const addOnsTotal = item.selectedAddOns.reduce((sum, a) => sum + a.priceEtb, 0);
            return {
              ...item,
              quantity: newQty,
              calculatedPrice: (unitPrice + addOnsTotal) * newQty,
            };
          }
          return item;
        })
        .filter((item): item is CartItem => item !== null)
    );
  };

  const removeFromCart = (cartItemId: string) => {
    setCartItems((prev) => prev.filter((item) => item.id !== cartItemId));
  };

  const clearCart = () => {
    setCartItems([]);
    if (activeTableToken) {
      localStorage.removeItem(`meraf_cart_${activeTableToken}`);
    }
  };

  const subtotal = cartItems.reduce((sum, item) => sum + item.calculatedPrice, 0);
  const totalItemCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        cartItems,
        addToCart,
        updateQuantity,
        removeFromCart,
        clearCart,
        subtotal,
        totalItemCount,
        setTableToken,
        activeTableToken,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = (): CartContextType => {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
};
