"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { api, ApiError } from "./api";
import type { User } from "./types";

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  login: (
    email: string,
    password: string,
    portal?: "customer" | "admin",
  ) => Promise<User>;
  register: (data: {
    email: string;
    password: string;
    name: string;
    phone?: string;
  }) => Promise<User>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchMe = useCallback(async () => {
    const token = localStorage.getItem("zevora_token");
    if (!token) {
      setLoading(false);
      return;
    }
    try {
      const res = await api<{ user: User }>("/api/auth/me");
      setUser(res.user);
    } catch {
      localStorage.removeItem("zevora_token");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMe();
  }, [fetchMe]);

  const login = useCallback(
    async (email: string, password: string, portal?: "customer" | "admin") => {
      const sessionId =
        typeof window !== "undefined"
          ? localStorage.getItem("zevora_session_id")
          : null;

      const res = await api<{ user: User; token: string }>(
        "/api/auth/login",
        {
          method: "POST",
          auth: false,
          headers: sessionId ? { "x-session-id": sessionId } : undefined,
          body: JSON.stringify({ email, password, portal }),
        },
      );
      localStorage.setItem("zevora_token", res.token);
      setUser(res.user);
      return res.user;
    },
    [],
  );

  const register = useCallback(
    async (data: {
      email: string;
      password: string;
      name: string;
      phone?: string;
    }) => {
      const res = await api<{ user: User; token: string }>(
        "/api/auth/register",
        {
          method: "POST",
          auth: false,
          body: JSON.stringify(data),
        },
      );
      localStorage.setItem("zevora_token", res.token);
      setUser(res.user);
      return res.user;
    },
    [],
  );

  const logout = useCallback(() => {
    localStorage.removeItem("zevora_token");
    setUser(null);
    api("/api/auth/logout", { method: "POST" }).catch(() => {});
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

export { ApiError };
