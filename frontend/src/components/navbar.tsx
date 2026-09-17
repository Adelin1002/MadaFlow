"use client";

import Link from "next/link";
import { useAuth } from "@/lib/auth/AuthContext";
import { ThemeToggle } from "./theme-toggle";

export function Navbar() {
  const { user, logout, isLoading } = useAuth();

  return (
    <header className="border-b border-stone">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
        <Link href="/" className="text-lg font-semibold tracking-tight">
          MadaFlow
        </Link>

        <nav className="flex items-center gap-6 text-sm">
          {!isLoading && user && (
            <>
              <Link href="/map" className="text-ink-soft transition-colors hover:text-ink">
                Carte
              </Link>
              <Link href="/reports" className="text-ink-soft transition-colors hover:text-ink">
                Signalements
              </Link>
              {(user.user_type === "municipal_admin" || user.user_type === "platform_admin") && (
                <Link href="/dashboard" className="text-ink-soft transition-colors hover:text-ink">
                  Tableau de bord
                </Link>
              )}
              <Link
                href="/create-report"
                className="border border-ink px-4 py-1.5 transition-colors hover:border-laterite hover:text-laterite"
              >
                Signaler
              </Link>
              <Link href="/profile" className="text-ink-soft transition-colors hover:text-ink">
                Profil
              </Link>
              <button
                type="button"
                onClick={logout}
                className="text-ink-soft transition-colors hover:text-laterite"
              >
                Déconnexion
              </button>
            </>
          )}

          {!isLoading && !user && (
            <>
              <Link href="/login" className="text-ink-soft transition-colors hover:text-ink">
                Connexion
              </Link>
              <Link
                href="/register"
                className="border border-ink px-4 py-1.5 transition-colors hover:border-laterite hover:text-laterite"
              >
                Créer un compte
              </Link>
            </>
          )}

          <ThemeToggle />
        </nav>
      </div>
    </header>
  );
}
