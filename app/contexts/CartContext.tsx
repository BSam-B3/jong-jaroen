"use client";

import { createContext, useContext, useState, useEffect, ReactNode, useMemo } from 'react';
import { Product } from '@/app/services/shopService';

export interface CartItem extends Product {
  quantity: number;
}

interface CartContextType {
  cart: CartItem[];
  addToCart: (product: Product) => void;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, amount: number) => void;
  clearCart: () => void;
  subtotalPrice: number;    // ราคาสินค้าทั้งหมด
  deliveryFee: number;      // ค่าส่งที่คำนวณตามจำนวนร้าน
  totalPrice: number;       // ราคารวมสุทธิ
  totalItems: number;
  uniqueShopsCount: number; // จำนวนร้านค้าในตะกร้า
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const [cart, setCart] = useState<CartItem[]>([]);

  useEffect(() => {
    const savedCart = localStorage.getItem('jong_jaroen_cart');
    if (savedCart) {
      try {
        setCart(JSON.parse(savedCart));
      } catch (e) {
        console.error("Failed to parse cart", e);
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('jong_jaroen_cart', JSON.stringify(cart));
  }, [cart]);

  const addToCart = (product: Product) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        return prev.map(item => 
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, { ...product, quantity: 1 }];
    });
  };

  const updateQuantity = (productId: string, amount: number) => {
    setCart(prev => prev.map(item => {
      if (item.id === productId) {
        const newQty = Math.max(1, item.quantity + amount);
        return { ...item, quantity: newQty };
      }
      return item;
    }));
  };

  const removeFromCart = (productId: string) => {
    setCart(prev => prev.filter(item => item.id !== productId));
  };

  const clearCart = () => setCart([]);

  // --- Logic คำนวณราคายุคใหม่ (Multi-Shop Logic) ---

  // 1. นับจำนวนร้านค้าที่ไม่ซ้ำกัน
  const uniqueShopsCount = useMemo(() => {
    const shopIds = cart.map(item => item.shop_id);
    return new Set(shopIds).size;
  }, [cart]);

  // 2. ราคาสินค้ารวม
  const subtotalPrice = useMemo(() => {
    return cart.reduce((sum, item) => sum + (item.base_price * item.quantity), 0);
  }, [cart]);

  // 3. คำนวณค่าส่ง (เริ่มต้น 20 + ร้านที่เพิ่มมาจุดละ 10)
  // หมายเหตุ: ตรงนี้ในอนาคตจะบวก Distance Fee จาก GPS เพิ่มได้เลยค่ะ
  const deliveryFee = useMemo(() => {
    if (cart.length === 0) return 0;
    const BASE_FEE = 20;
    const MULTI_STOP_FEE = 10;
    const extraStops = uniqueShopsCount > 1 ? (uniqueShopsCount - 1) * MULTI_STOP_FEE : 0;
    return BASE_FEE + extraStops;
  }, [cart, uniqueShopsCount]);

  const totalPrice = subtotalPrice + deliveryFee;
  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <CartContext.Provider value={{ 
      cart, 
      addToCart, 
      removeFromCart, 
      updateQuantity,
      clearCart, 
      subtotalPrice,
      deliveryFee,
      totalPrice, 
      totalItems,
      uniqueShopsCount
    }}>
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) throw new Error('useCart must be used within a CartProvider');
  return context;
};
