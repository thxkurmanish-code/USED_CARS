"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";

import { apiClient } from "@/services/api-client";

export interface CurrentUser { id: string; email: string; role: "customer" | "admin"; }
interface AuthContextValue { user: CurrentUser | null; loading: boolean; refresh: () => Promise<void>; logout: () => Promise<void>; }
const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: Readonly<{ children: React.ReactNode }>) {
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [loading, setLoading] = useState(true);
  const refresh = useCallback(async () => { try { setUser(await apiClient<CurrentUser>("/auth/me")); } catch { setUser(null); } finally { setLoading(false); } }, []);
  useEffect(() => { void refresh(); }, [refresh]);
  const logout = useCallback(async () => { await apiClient<void>("/auth/logout", { method: "POST" }); setUser(null); }, []);
  return <AuthContext.Provider value={{ user, loading, refresh, logout }}>{children}</AuthContext.Provider>;
}

export function useAuth() { const context = useContext(AuthContext); if (!context) throw new Error("useAuth must be used inside AuthProvider"); return context; }
