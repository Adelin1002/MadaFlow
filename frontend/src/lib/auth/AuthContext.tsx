"use client";

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import {
  fetchMe,
  login as apiLogin,
  register as apiRegister,
  updateMe,
  type RegisterPayload,
  type UpdateProfilePayload,
} from "@/lib/api/auth";
import type { User } from "@/lib/api/types";
import { tokenStorage } from "./token-storage";

interface AuthContextValue {
  user: User | null;
  /** true pendant la restauration de session au chargement initial de l'app. */
  isLoading: boolean;
  login: (username: string, password: string) => Promise<void>;
  register: (payload: RegisterPayload) => Promise<void>;
  logout: () => void;
  /** Centralisé ici plutôt que dans /profile : tout ce qui lit `user` via
   * useAuth() (la navbar, par exemple) reste synchronisé après une édition. */
  updateProfile: (payload: UpdateProfilePayload) => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const accessToken = tokenStorage.getAccessToken();
    if (!accessToken) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- pas de token : fin de la restauration de session, lecture post-hydratation volontaire
      setIsLoading(false);
      return;
    }
    // apiFetch rafraîchit automatiquement si l'access token est expiré
    // (voir src/lib/api/client.ts) — pas besoin de le refaire ici.
    fetchMe()
      .then(setUser)
      .catch(() => {
        tokenStorage.clear();
        setUser(null);
      })
      .finally(() => setIsLoading(false));
  }, []);

  const login = useCallback(async (username: string, password: string) => {
    const tokens = await apiLogin(username, password);
    tokenStorage.setTokens(tokens.access, tokens.refresh);
    const me = await fetchMe();
    setUser(me);
  }, []);

  const register = useCallback(
    async (payload: RegisterPayload) => {
      await apiRegister(payload);
      // L'inscription ne renvoie pas de tokens (voir apps.users.views.RegisterView
      // côté backend) : on enchaîne avec une connexion pour éviter à la personne
      // de retaper ses identifiants juste après les avoir choisis.
      await login(payload.username, payload.password);
    },
    [login],
  );

  const logout = useCallback(() => {
    tokenStorage.clear();
    setUser(null);
  }, []);

  const updateProfile = useCallback(async (payload: UpdateProfilePayload) => {
    const updated = await updateMe(payload);
    setUser(updated);
  }, []);

  return (
    <AuthContext.Provider value={{ user, isLoading, login, register, logout, updateProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth doit être utilisé à l'intérieur de <AuthProvider>");
  }
  return context;
}
