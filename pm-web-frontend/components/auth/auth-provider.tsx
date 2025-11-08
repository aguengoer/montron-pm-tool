"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useRouter } from "next/navigation";

import { formApiFetch } from "@/lib/formApiClient";
import { setAccessToken } from "@/lib/authToken";

type AuthContextValue = {
  accessToken: string | null;
  isAuthenticated: boolean;
  loading: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const ACCESS_TOKEN_STORAGE_KEY = "pm_access_token";

type LoginResponse = {
  accessToken: string;
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [accessTokenState, setAccessTokenState] = useState<string | null>(null);
  const [initialised, setInitialised] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const storedToken = window.localStorage.getItem(ACCESS_TOKEN_STORAGE_KEY);
    if (storedToken) {
      setAccessToken(storedToken);
      setAccessTokenState(storedToken);
    }
    setInitialised(true);
  }, []);

  const login = useCallback(async (username: string, password: string) => {
    const result = await formApiFetch<LoginResponse>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ username, password }),
    });

    setAccessToken(result.accessToken);
    setAccessTokenState(result.accessToken);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(ACCESS_TOKEN_STORAGE_KEY, result.accessToken);
    }
    router.replace("/mitarbeiter");
  }, [router]);

  const logout = useCallback(() => {
    setAccessToken(null);
    setAccessTokenState(null);
    if (typeof window !== "undefined") {
      window.localStorage.removeItem(ACCESS_TOKEN_STORAGE_KEY);
    }
    router.replace("/login");
  }, [router]);

  const value = useMemo<AuthContextValue>(() => ({
    accessToken: accessTokenState,
    isAuthenticated: Boolean(accessTokenState),
    loading: !initialised,
    login,
    logout,
  }), [accessTokenState, initialised, login, logout]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
