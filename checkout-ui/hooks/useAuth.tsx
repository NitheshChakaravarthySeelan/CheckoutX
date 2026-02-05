"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import { Auth } from "@/lib/auth"; // Import the Auth utility
import { useRouter } from "next/navigation";

interface User {
  userId: string;
  userName: { username: string };
  email: string;
  roles: string[];
}

interface AuthContextType {
  token: string | null;
  user: User | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  login: (token: string, user: User) => void;
  logout: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [authState, setAuthState] = useState<
    Omit<AuthContextType, "login" | "logout" | "loading">
  >({
    token: null,
    user: null,
    isAuthenticated: false,
    isAdmin: false,
  });
  const [loading, setLoading] = useState(true); // Track initial loading of auth state

  useEffect(() => {
    // This effect runs only once on mount to restore auth state from localStorage
    const storedState = Auth.getAuthState();
    setAuthState(storedState);
    setLoading(false);
  }, []);

  const login = (token: string, user: User) => {
    Auth.setAuthState(token, user);
    setAuthState({
      token,
      user,
      isAuthenticated: true,
      isAdmin: user.roles.includes("ADMIN"),
    });
    router.push("/"); // Redirect to homepage after login
  };

  const logout = () => {
    Auth.clearAuthState();
    setAuthState({
      token: null,
      user: null,
      isAuthenticated: false,
      isAdmin: false,
    });
    router.push("/login"); // Redirect to login page after logout
  };

  const contextValue: AuthContextType = {
    // Define the value object outside JSX
    token: authState.token,
    user: authState.user,
    isAuthenticated: authState.isAuthenticated,
    isAdmin: authState.isAdmin,
    login,
    logout,
    loading,
  };

  return (
    <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>
  );
}

AuthProvider.displayName = "AuthProvider"; // Added display name

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
