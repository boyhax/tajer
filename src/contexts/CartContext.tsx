import React, { createContext, useState, useEffect, useContext } from 'react';
import { Product, CartItem } from '../types';

interface CartContextType {
  cart: CartItem[];
  addToCart: (product: Product) => void;
  removeFromCart: (productId: string) => void;
  clearCart: () => void;
  total: number;
}

export const CartContext = createContext<CartContextType>({
  cart: [],
  addToCart: () => {},
  removeFromCart: () => {},
  clearCart: () => {},
  total: 0
});

export const CartProvider = ({ children }: { children: React.ReactNode }) => {
  const [cart, setCart] = useState<CartItem[]>(() => {
    const saved = localStorage.getItem('kuzama_cart');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem('kuzama_cart', JSON.stringify(cart));
  }, [cart]);

  const addToCart = (product: Product) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        return prev.map(item => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item);
      }
      return [...prev, { ...product, quantity: 1 }];
    });
  };

  const removeFromCart = (productId: string) => {
    setCart(prev => prev.filter(item => item.id !== productId));
  };

  const clearCart = () => {
    setCart([]);
  };

  const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  return (
    <CartContext.Provider value={{ cart, addToCart, removeFromCart, clearCart, total }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => useContext(CartContext);
