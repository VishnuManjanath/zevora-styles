"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { api } from "./api";
import type { Cart } from "./types";
import { useAuth } from "./auth-context";

interface CartContextValue {
  cart: Cart | null;
  loading: boolean;
  refresh: () => Promise<void>;
  addItem: (variantId: string, quantity?: number) => Promise<void>;
  updateItem: (variantId: string, quantity: number) => Promise<void>;
  removeItem: (variantId: string) => Promise<void>;
  clear: () => Promise<void>;
}

const CartContext = createContext<CartContextValue | null>(null);

const emptyCart: Cart = { id: "", items: [], subtotal: 0, itemCount: 0 };

export function CartProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [cart, setCart] = useState<Cart | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const res = await api<Cart>("/api/cart", { withSession: true });
      setCart(res);
    } catch {
      setCart(emptyCart);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh, user]);

  const addItem = useCallback(
    async (variantId: string, quantity = 1) => {
      const res = await api<Cart>("/api/cart/items", {
        method: "POST",
        withSession: true,
        body: JSON.stringify({ variantId, quantity }),
      });
      setCart(res);
    },
    [],
  );

  const updateItem = useCallback(async (variantId: string, quantity: number) => {
    const res = await api<Cart>(`/api/cart/items/${variantId}`, {
      method: "PATCH",
      withSession: true,
      body: JSON.stringify({ quantity }),
    });
    setCart(res);
  }, []);

  const removeItem = useCallback(async (variantId: string) => {
    const res = await api<Cart>(`/api/cart/items/${variantId}`, {
      method: "DELETE",
      withSession: true,
    });
    setCart(res);
  }, []);

  const clear = useCallback(async () => {
    const res = await api<Cart>("/api/cart", {
      method: "DELETE",
      withSession: true,
    });
    setCart(res);
  }, []);

  return (
    <CartContext.Provider
      value={{ cart, loading, refresh, addItem, updateItem, removeItem, clear }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
