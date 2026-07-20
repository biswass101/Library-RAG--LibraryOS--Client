"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import type { User } from "@/lib/types";
import { authApi } from "@/lib/api/services";

interface AuthContextValue {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  setUser: (user: User) => void;
}

const AuthContext = React.createContext<AuthContextValue | null>(null);

const TOKEN_KEY = "lms.token";
const USER_KEY = "lms.user";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUserState] = React.useState<User | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const router = useRouter();

  React.useEffect(() => {
    try {
      const token = window.localStorage.getItem(TOKEN_KEY);
      const raw = window.localStorage.getItem(USER_KEY);
      if (token && raw) setUserState(JSON.parse(raw) as User);
    } catch {
      window.localStorage.removeItem(TOKEN_KEY);
      window.localStorage.removeItem(USER_KEY);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const login = React.useCallback(async (email: string, password: string) => {
    const { user: loggedIn, token } = await authApi.login(email, password);
    window.localStorage.setItem(TOKEN_KEY, token);
    window.localStorage.setItem(USER_KEY, JSON.stringify(loggedIn));
    setUserState(loggedIn);
  }, []);

  const logout = React.useCallback(() => {
    window.localStorage.removeItem(TOKEN_KEY);
    window.localStorage.removeItem(USER_KEY);
    setUserState(null);
    router.push("/login");
  }, [router]);

  const setUser = React.useCallback((next: User) => {
    window.localStorage.setItem(USER_KEY, JSON.stringify(next));
    setUserState(next);
  }, []);

  const value = React.useMemo(
    () => ({ user, isLoading, login, logout, setUser }),
    [user, isLoading, login, logout, setUser]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = React.useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
