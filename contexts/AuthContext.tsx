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

export type RegisterPayload = {
  name: string;
  email: string;
  phone?: string;
  password: string;
  password_confirmation: string;
  user_type: "private_buyer" | "private_seller" | "trade_buyer";
};

export type RegisterDealerPayload = {
  organization_name: string;
  name: string;
  email: string;
  phone?: string;
  password: string;
  password_confirmation: string;
};

type AuthContextValue = {
  user: AuthUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<LoginResult>;
  completeTwoFactorChallenge: (challengeToken: string, code: string) => Promise<void>;
  register: (payload: RegisterPayload) => Promise<void>;
  registerDealer: (payload: RegisterDealerPayload) => Promise<void>;
  updateProfile: (name: string, phone?: string) => Promise<void>;
  uploadAvatar: (file: File) => Promise<void>;
  removeAvatar: () => Promise<void>;
  changePassword: (currentPassword: string, password: string, passwordConfirmation: string) => Promise<void>;
  requestPasswordReset: (email: string) => Promise<void>;
  resetPassword: (
    token: string,
    email: string,
    password: string,
    passwordConfirmation: string
  ) => Promise<void>;
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
    queueMicrotask(() => {
      refreshUser();
    });
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

  const register = useCallback(async (payload: RegisterPayload) => {
    const data = await apiFetch<{ user: AuthUser; token: string }>("/register", {
      method: "POST",
      auth: false,
      body: payload,
    });
    setStoredToken(data.token);
    setUser(data.user);
  }, []);

  const registerDealer = useCallback(async (payload: RegisterDealerPayload) => {
    const data = await apiFetch<{ user: AuthUser; token: string }>("/register/dealer", {
      method: "POST",
      auth: false,
      body: payload,
    });
    setStoredToken(data.token);
    setUser(data.user);
  }, []);

  const updateProfile = useCallback(async (name: string, phone?: string) => {
    const data = await apiFetch<AuthUser>("/user", {
      method: "PATCH",
      body: { name, phone: phone || null },
    });
    setUser(data);
  }, []);

  const uploadAvatar = useCallback(async (file: File) => {
    const formData = new FormData();
    formData.append("avatar", file);
    const data = await apiFetch<AuthUser>("/user/avatar", {
      method: "POST",
      body: formData,
    });
    setUser(data);
  }, []);

  const removeAvatar = useCallback(async () => {
    const data = await apiFetch<AuthUser>("/user/avatar", { method: "DELETE" });
    setUser(data);
  }, []);

  const changePassword = useCallback(
    async (currentPassword: string, password: string, passwordConfirmation: string) => {
      await apiFetch("/user/password", {
        method: "PUT",
        body: {
          current_password: currentPassword,
          password,
          password_confirmation: passwordConfirmation,
        },
      });
    },
    []
  );

  const requestPasswordReset = useCallback(async (email: string) => {
    await apiFetch("/forgot-password", { method: "POST", auth: false, body: { email } });
  }, []);

  const resetPassword = useCallback(
    async (token: string, email: string, password: string, passwordConfirmation: string) => {
      await apiFetch("/reset-password", {
        method: "POST",
        auth: false,
        body: { token, email, password, password_confirmation: passwordConfirmation },
      });
    },
    []
  );

  const logout = useCallback(() => {
    setStoredToken(null);
    setUser(null);
    // Best-effort — a stale/expired token still means "logged out" locally.
    apiFetch("/logout", { method: "POST" }).catch(() => {});
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        completeTwoFactorChallenge,
        register,
        registerDealer,
        updateProfile,
        uploadAvatar,
        removeAvatar,
        changePassword,
        requestPasswordReset,
        resetPassword,
        logout,
        refreshUser,
      }}
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
