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
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";

import { formApiFetch } from "@/lib/formApiClient";
import { setAccessToken, getAccessToken } from "@/lib/authToken";
import { beginSignIn, completeTotpSignIn, completeLoginFlow } from "@/services/auth";

type AuthContextValue = {
  accessToken: string | null;
  isAuthenticated: boolean;
  loading: boolean;
  login: (email: string, password: string, totpCode?: string) => Promise<void>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

type LoginResponse = {
  accessToken: string;
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [accessTokenState, setAccessTokenState] = useState<string | null>(null);
  const [initialised, setInitialised] = useState(false);

  // Bootstrap session on mount (check refresh cookie)
  useEffect(() => {
    const bootstrapSession = async () => {
      try {
        const result = await formApiFetch<LoginResponse>("/auth/refresh", {
          method: "POST",
          credentials: "include", // Important: send cookies
        });
        
        setAccessToken(result.accessToken);
        setAccessTokenState(result.accessToken);
      } catch (error) {
        // No valid refresh token, user needs to login
        setAccessToken(null);
        setAccessTokenState(null);
      } finally {
        setInitialised(true);
      }
    };

    bootstrapSession();
  }, []);

  const login = useCallback(async (email: string, password: string, totpCode?: string) => {
    try {
      // Step 1: Begin sign-in (email/password)
      const result = await beginSignIn(email, password);

      if (result.type === "MFA_REQUIRED") {
        if (!totpCode) {
          // MFA required but no code provided - throw special error
          throw new Error("MFA_REQUIRED");
        }
        
        // Complete TOTP sign-in
        const user = await completeTotpSignIn(result.resolver, totpCode);
        
        // Complete login flow (email verification check + backend token exchange)
        await completeLoginFlow(user);
      } else {
        // Sign-in successful without MFA
        await completeLoginFlow(result.userCredential.user);
      }

      // Update access token state
      const token = getAccessToken();
      setAccessTokenState(token);
      router.replace("/mitarbeiter");
    } catch (error: any) {
      // Re-throw error so login page can handle it
      throw error;
    }
  }, [router]);

  const logout = useCallback(async () => {
    // Call backend logout to revoke refresh token
    try {
      await formApiFetch("/auth/logout", {
        method: "POST",
        credentials: "include",
      });
    } catch (error) {
      // Ignore errors during logout
    }

    // Sign out from Firebase
    try {
      await signOut(auth);
    } catch (error) {
      // Ignore errors
    }

    setAccessToken(null);
    setAccessTokenState(null);
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
