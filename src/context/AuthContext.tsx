"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";

export type User = {
  id: number;
  username: string;
  balance: number;
  isAdmin: boolean;
  couponUsed: boolean;
  email: string;
  stats: { opened: number; upgrades: number; contracts: number; battles: number; won: number; bestDrop: number };
};

type AuthContextType = {
  user: User | null;
  ready: boolean;
  login: (username: string, password: string) => Promise<string | null>;
  register: (username: string, password: string) => Promise<string | null>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  setBalance: (b: number) => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(false);

  const refreshUser = useCallback(async () => {
    try {
      const res = await fetch("/api/auth", { cache: "no-store" });
      const data = await res.json();
      setUser(data.user || null);
    } catch {
      setUser(null);
    } finally {
      setReady(true);
    }
  }, []);

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  const login = async (username: string, password: string) => {
    const res = await fetch("/api/auth", {
      method: "POST",
      body: JSON.stringify({ action: "login", username, password }),
    });
    const data = await res.json();
    if (!res.ok) return data.error || "Ошибка входа";
    setUser(data.user);
    return null;
  };

  const register = async (username: string, password: string) => {
    const res = await fetch("/api/auth", {
      method: "POST",
      body: JSON.stringify({ action: "register", username, password }),
    });
    const data = await res.json();
    if (!res.ok) return data.error || "Ошибка регистрации";
    setUser(data.user);
    return null;
  };

  const logout = async () => {
    await fetch("/api/auth", { method: "POST", body: JSON.stringify({ action: "logout" }) });
    setUser(null);
  };

  const setBalance = (b: number) => setUser((u) => (u ? { ...u, balance: b } : u));

  return (
    <AuthContext.Provider value={{ user, ready, login, register, logout, refreshUser, setBalance }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) throw new Error("useAuth must be used within an AuthProvider");
  return context;
}
