"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormField } from "@/components/form-field";
import { useAuth } from "@/lib/auth/AuthContext";
import { getFieldErrors, getGeneralError } from "@/lib/api/error-messages";

export default function RegisterPage() {
  const router = useRouter();
  const { register } = useAuth();
  const [form, setForm] = useState({
    username: "",
    email: "",
    password: "",
    password2: "",
    phone_number: "",
    user_type: "citizen" as "citizen" | "business",
  });
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  function update<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setFieldErrors({});
    setGeneralError(null);
    setIsSubmitting(true);

    try {
      await register(form);
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
      <h1 className="text-2xl font-semibold tracking-tight">Créer un compte</h1>
      <p className="mt-2 text-sm text-ink-soft">
        Déjà inscrit ?{" "}
        <Link href="/login" className="text-laterite underline underline-offset-2">
          Connectez-vous
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

        <fieldset>
          <legend className="text-sm font-medium">Vous êtes</legend>
          <div className="mt-2 flex gap-4 text-sm">
            <label className="flex items-center gap-2">
              <input
                type="radio"
                name="user_type"
                checked={form.user_type === "citizen"}
                onChange={() => update("user_type", "citizen")}
              />
              Un habitant
            </label>
            <label className="flex items-center gap-2">
              <input
                type="radio"
                name="user_type"
                checked={form.user_type === "business"}
                onChange={() => update("user_type", "business")}
              />
              Une entreprise
            </label>
          </div>
        </fieldset>

        <FormField
          id="username"
          label="Nom d'utilisateur"
          value={form.username}
          onChange={(event) => update("username", event.target.value)}
          error={fieldErrors.username}
          autoComplete="username"
          required
        />
        <FormField
          id="email"
          label="Email"
          type="email"
          value={form.email}
          onChange={(event) => update("email", event.target.value)}
          error={fieldErrors.email}
          autoComplete="email"
          required
        />
        <FormField
          id="phone_number"
          label="Téléphone (facultatif)"
          value={form.phone_number}
          onChange={(event) => update("phone_number", event.target.value)}
          error={fieldErrors.phone_number}
          autoComplete="tel"
        />
        <FormField
          id="password"
          label="Mot de passe"
          type="password"
          value={form.password}
          onChange={(event) => update("password", event.target.value)}
          error={fieldErrors.password}
          autoComplete="new-password"
          required
        />
        <FormField
          id="password2"
          label="Confirmer le mot de passe"
          type="password"
          value={form.password2}
          onChange={(event) => update("password2", event.target.value)}
          error={fieldErrors.password2}
          autoComplete="new-password"
          required
        />

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full border border-ink bg-ink px-4 py-2.5 text-sm font-medium text-paper transition-colors hover:border-laterite hover:bg-laterite disabled:opacity-50"
        >
          {isSubmitting ? "Création en cours…" : "Créer mon compte"}
        </button>
      </form>
    </div>
  );
}
