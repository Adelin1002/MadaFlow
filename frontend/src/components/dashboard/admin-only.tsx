"use client";

import { useEffect, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/AuthContext";

const ALLOWED_TYPES = new Set(["municipal_admin", "platform_admin"]);

/**
 * proxy.ts (voir src/proxy.ts) protège déjà l'accès aux visiteurs non
 * connectés, mais ne peut pas distinguer les rôles — son cookie ne porte
 * aucune information d'autorisation, seulement une présence de session. Le
 * vrai contrôle de rôle reste IsMunicipalOrPlatformAdmin côté API Django ;
 * ce composant n'est qu'une UX cohérente pour la personne (ne pas afficher
 * le squelette d'une page qu'elle n'a de toute façon pas le droit de voir).
 */
export function AdminOnly({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading && !user) {
      router.push(`/login?next=${encodeURIComponent(pathname)}`);
    }
  }, [isLoading, user, pathname, router]);

  if (isLoading || !user) {
    return <div className="mx-auto max-w-lg px-6 py-20 text-sm text-ink-soft">Chargement…</div>;
  }

  if (!ALLOWED_TYPES.has(user.user_type)) {
    return (
      <div className="mx-auto max-w-lg px-6 py-20">
        <p
          role="alert"
          className="border border-laterite bg-laterite/10 px-3 py-2 text-sm text-laterite"
        >
          Cette page est réservée aux administrateurs municipaux et de plateforme.
        </p>
      </div>
    );
  }

  return <>{children}</>;
}
