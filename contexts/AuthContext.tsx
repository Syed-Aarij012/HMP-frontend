"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { apiFetch, ApiError, getStoredToken, setStoredToken } from "@/lib/api-client";

export type AuthUser = {
  id: number;
  name: string;
  email: string;
  user_type: string;
  [key: string]: unknown;
};

type LoginResult =
  | { status: "ok" }
  | { status: "two_factor_required"; challengeToken: string };

type AuthContextValue = {
  user: AuthUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<LoginResult>;
  completeTwoFactorChallenge: (challengeToken: string, code: string) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshUser = useCallback(async () => {
    const token = getStoredToken();
    if (!token) {
      setUser(null);
      setLoading(false);
      return;
    }

    try {
      const data = await apiFetch<AuthUser>("/user");
      setUser(data);
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        setStoredToken(null);
      }
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  const login = useCallback(async (email: string, password: string): Promise<LoginResult> => {
    const data = await apiFetch<{
      user?: AuthUser;
      token?: string;
      two_factor_required?: boolean;
      challenge_token?: string;
    }>("/login", { method: "POST", body: { email, password }, auth: false });

    if (data.two_factor_required) {
      return { status: "two_factor_required", challengeToken: data.challenge_token! };
    }

    setStoredToken(data.token ?? null);
    setUser(data.user ?? null);
    return { status: "ok" };
  }, []);

  const completeTwoFactorChallenge = useCallback(async (challengeToken: string, code: string) => {
    const data = await apiFetch<{ user?: AuthUser; token?: string }>(
      "/login/two-factor-challenge",
      { method: "POST", auth: false, body: { challenge_token: challengeToken, code } }
    );
    setStoredToken(data.token ?? null);
    setUser(data.user ?? null);
  }, []);

  const logout = useCallback(() => {
    setStoredToken(null);
    setUser(null);
    // Best-effort — a stale/expired token still means "logged out" locally.
    apiFetch("/logout", { method: "POST" }).catch(() => {});
  }, []);

  return (
    <AuthContext.Provider
      value={{ user, loading, login, completeTwoFactorChallenge, logout, refreshUser }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
