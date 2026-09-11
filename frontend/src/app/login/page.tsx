"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormField } from "@/components/form-field";
import { useAuth } from "@/lib/auth/AuthContext";
import { getFieldErrors, getGeneralError } from "@/lib/api/error-messages";

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setFieldErrors({});
    setGeneralError(null);
    setIsSubmitting(true);

    try {
      await login(username, password);
      router.push("/map");
    } catch (error) {
      setFieldErrors(getFieldErrors(error));
      setGeneralError(getGeneralError(error));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-sm px-6 py-20">
      <h1 className="text-2xl font-semibold tracking-tight">Connexion</h1>
      <p className="mt-2 text-sm text-ink-soft">
        Pas encore de compte ?{" "}
        <Link href="/register" className="text-laterite underline underline-offset-2">
          Créez-en un
        </Link>
        .
      </p>

      <form onSubmit={handleSubmit} className="mt-8 space-y-5">
        {generalError && (
          <p
            role="alert"
            className="border border-laterite bg-laterite/10 px-3 py-2 text-sm text-laterite"
          >
            {generalError}
          </p>
        )}

        <FormField
          id="username"
          label="Nom d'utilisateur"
          value={username}
          onChange={(event) => setUsername(event.target.value)}
          error={fieldErrors.username}
          autoComplete="username"
          required
        />
        <FormField
          id="password"
          label="Mot de passe"
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          error={fieldErrors.password}
          autoComplete="current-password"
          required
        />

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full border border-ink bg-ink px-4 py-2.5 text-sm font-medium text-paper transition-colors hover:border-laterite hover:bg-laterite disabled:opacity-50"
        >
          {isSubmitting ? "Connexion en cours…" : "Se connecter"}
        </button>
      </form>
    </div>
  );
}
