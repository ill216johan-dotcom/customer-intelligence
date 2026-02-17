"use client";

/**
 * React Context based store for authentication state
 * Customer Intelligence Platform
 */

import React, {
  createContext,
  useContext,
  useReducer,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";
import type { User } from "./types";
import {
  login as apiLogin,
  getCurrentUser,
  logout as apiLogout,
  getToken,
  clearToken,
} from "./api";

// ==========================================
// State Types
// ==========================================

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

// ==========================================
// Action Types
// ==========================================

type AuthAction =
  | { type: "AUTH_START" }
  | { type: "AUTH_SUCCESS"; payload: { user: User; token: string } }
  | { type: "AUTH_FAILURE"; payload: string }
  | { type: "SET_USER"; payload: User }
  | { type: "LOGOUT" }
  | { type: "CLEAR_ERROR" }
  | { type: "INIT_FROM_STORAGE"; payload: { token: string } };

// ==========================================
// Initial State
// ==========================================

const initialState: AuthState = {
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: true, // Start as loading to check localStorage
  error: null,
};

// ==========================================
// Reducer
// ==========================================

function authReducer(state: AuthState, action: AuthAction): AuthState {
  switch (action.type) {
    case "AUTH_START":
      return {
        ...state,
        isLoading: true,
        error: null,
      };

    case "AUTH_SUCCESS":
      return {
        ...state,
        user: action.payload.user,
        token: action.payload.token,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      };

    case "AUTH_FAILURE":
      return {
        ...state,
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
        error: action.payload,
      };

    case "SET_USER":
      return {
        ...state,
        user: action.payload,
        isAuthenticated: true,
        isLoading: false,
      };

    case "LOGOUT":
      return {
        ...state,
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
      };

    case "CLEAR_ERROR":
      return {
        ...state,
        error: null,
      };

    case "INIT_FROM_STORAGE":
      return {
        ...state,
        token: action.payload.token,
        isLoading: true, // Still loading, will fetch user
      };

    default:
      return state;
  }
}

// ==========================================
// Context Types
// ==========================================

interface AuthContextValue extends AuthState {
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  setUser: (user: User) => void;
  clearError: () => void;
  refreshUser: () => Promise<void>;
}

// ==========================================
// Context
// ==========================================

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

// ==========================================
// Provider Component
// ==========================================

interface StoreProviderProps {
  children: ReactNode;
}

export function StoreProvider({ children }: StoreProviderProps) {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Initialize from localStorage on mount
  useEffect(() => {
    const initAuth = async () => {
      const storedToken = getToken();

      if (storedToken) {
        dispatch({ type: "INIT_FROM_STORAGE", payload: { token: storedToken } });

        try {
          const user = await getCurrentUser();
          dispatch({
            type: "AUTH_SUCCESS",
            payload: { user, token: storedToken },
          });
        } catch {
          // Token is invalid, clear it
          clearToken();
          dispatch({ type: "LOGOUT" });
        }
      } else {
        // No token, not authenticated
        dispatch({ type: "LOGOUT" });
      }
    };

    initAuth();
  }, []);

  // Login action
  const login = useCallback(async (email: string, password: string) => {
    dispatch({ type: "AUTH_START" });

    try {
      const tokenData = await apiLogin(email, password);
      const user = await getCurrentUser();

      dispatch({
        type: "AUTH_SUCCESS",
        payload: { user, token: tokenData.access_token },
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Login failed";
      dispatch({ type: "AUTH_FAILURE", payload: message });
      throw error;
    }
  }, []);

  // Logout action
  const logout = useCallback(() => {
    apiLogout();
    dispatch({ type: "LOGOUT" });
  }, []);

  // Set user action
  const setUser = useCallback((user: User) => {
    dispatch({ type: "SET_USER", payload: user });
  }, []);

  // Clear error action
  const clearError = useCallback(() => {
    dispatch({ type: "CLEAR_ERROR" });
  }, []);

  // Refresh user action
  const refreshUser = useCallback(async () => {
    try {
      const user = await getCurrentUser();
      dispatch({ type: "SET_USER", payload: user });
    } catch (error) {
      // If refresh fails, log out
      logout();
    }
  }, [logout]);

  const value: AuthContextValue = {
    ...state,
    login,
    logout,
    setUser,
    clearError,
    refreshUser,
  };

  return React.createElement(AuthContext.Provider, { value }, children);
}

// ==========================================
// Hook
// ==========================================

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);

  if (context === undefined) {
    throw new Error("useAuth must be used within a StoreProvider");
  }

  return context;
}

// ==========================================
// Auth Guard Component
// ==========================================

interface AuthGuardProps {
  children: ReactNode;
  fallback?: ReactNode;
}

export function AuthGuard({ children, fallback }: AuthGuardProps) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return fallback || React.createElement(
      "div",
      { className: "flex items-center justify-center min-h-screen" },
      React.createElement(
        "div",
        { className: "animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" }
      )
    );
  }

  if (!isAuthenticated) {
    // Redirect to login is handled by the API client on 401
    return fallback || React.createElement(
      "div",
      { className: "flex items-center justify-center min-h-screen" },
      React.createElement("p", null, "Redirecting to login...")
    );
  }

  return React.createElement(React.Fragment, null, children);
}

// ==========================================
// Export context for advanced use cases
// ==========================================

export { AuthContext };
