import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { InternalUser, Role } from "@/models";
import { getDb } from "@/mocks/db";
import { can, canAccessNav, canMutate, type Action, type Resource } from "@/permissions/can";

interface AuthState {
  user: InternalUser | null;
  loginAs: (userId: string) => void;
  logout: () => void;
  switchRoleDemo: (role: Role) => void;
  can: (action: Action, resource: Resource) => boolean;
  canAccessNav: (resource: Resource) => boolean;
  canMutate: (resource: Resource) => boolean;
}

const AuthContext = createContext<AuthState | null>(null);
const SESSION_KEY = "jm-admin-session-user";

function readSession(): InternalUser | null {
  try {
    const id = localStorage.getItem(SESSION_KEY);
    if (!id) return null;
    return getDb().users.find((u) => u.id === id) ?? null;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<InternalUser | null>(() => readSession());

  const loginAs = useCallback((userId: string) => {
    const found = getDb().users.find((u) => u.id === userId) ?? null;
    setUser(found);
    if (found) localStorage.setItem(SESSION_KEY, found.id);
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    localStorage.removeItem(SESSION_KEY);
  }, []);

  const switchRoleDemo = useCallback((role: Role) => {
    const match = getDb().users.find((u) => u.role === role && u.status === "active");
    if (match) {
      setUser(match);
      localStorage.setItem(SESSION_KEY, match.id);
    }
  }, []);

  const value = useMemo<AuthState>(() => {
    const role: Role = user?.role ?? "viewer";
    return {
      user,
      loginAs,
      logout,
      switchRoleDemo,
      can: (action, resource) => (user ? can(role, action, resource) : false),
      canAccessNav: (resource) => (user ? canAccessNav(role, resource) : false),
      canMutate: (resource) => (user ? canMutate(role, resource) : false),
    };
  }, [user, loginAs, logout, switchRoleDemo]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
