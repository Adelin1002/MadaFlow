"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { FormField } from "@/components/form-field";
import { useAuth } from "@/lib/auth/AuthContext";
import { getFieldErrors, getGeneralError } from "@/lib/api/error-messages";
import { formatFullDate } from "@/lib/format";
import { USER_TYPE_LABELS } from "@/lib/labels";
import type { UpdateProfilePayload } from "@/lib/api/auth";
import type { User } from "@/lib/api/types";

/**
 * Composant séparé plutôt qu'un effet de synchronisation dans ProfilePage :
 * ne monte qu'une fois `user` garanti non-nul, donc son état local peut
 * s'initialiser directement depuis les props sans effet (voir "You Might
 * Not Need An Effect" — react-hooks/set-state-in-effect signalait
 * justement ce pattern comme anti-pattern, à raison cette fois).
 */
function ProfileForm({
  user,
  updateProfile,
}: {
  user: User;
  updateProfile: (payload: UpdateProfilePayload) => Promise<void>;
}) {
  const [email, setEmail] = useState(user.email);
  const [firstName, setFirstName] = useState(user.first_name);
  const [lastName, setLastName] = useState(user.last_name);
  const [phoneNumber, setPhoneNumber] = useState(user.phone_number);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setFieldErrors({});
    setGeneralError(null);
    setSuccessMessage(null);
    setIsSubmitting(true);

    try {
      await updateProfile({
        email,
        first_name: firstName,
        last_name: lastName,
        phone_number: phoneNumber,
      });
      setSuccessMessage("Profil mis à jour.");
    } catch (error) {
      setFieldErrors(getFieldErrors(error));
      setGeneralError(getGeneralError(error));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mt-6 space-y-5">
      {generalError && (
        <p
          role="alert"
          className="border border-laterite bg-laterite/10 px-3 py-2 text-sm text-laterite"
        >
          {generalError}
        </p>
      )}
      {successMessage && (
        <p role="status" className="border border-paddy bg-paddy/10 px-3 py-2 text-sm text-paddy">
          {successMessage}
        </p>
      )}

      <FormField
        id="email"
        label="Email"
        type="email"
        value={email}
        onChange={(event) => setEmail(event.target.value)}
        error={fieldErrors.email}
        autoComplete="email"
        required
      />
      <FormField
        id="first_name"
        label="Prénom"
        value={firstName}
        onChange={(event) => setFirstName(event.target.value)}
        error={fieldErrors.first_name}
        autoComplete="given-name"
      />
      <FormField
        id="last_name"
        label="Nom"
        value={lastName}
        onChange={(event) => setLastName(event.target.value)}
        error={fieldErrors.last_name}
        autoComplete="family-name"
      />
      <FormField
        id="phone_number"
        label="Téléphone"
        value={phoneNumber}
        onChange={(event) => setPhoneNumber(event.target.value)}
        error={fieldErrors.phone_number}
        autoComplete="tel"
      />

      <button
        type="submit"
        disabled={isSubmitting}
        className="border border-ink bg-ink px-4 py-2.5 text-sm font-medium text-paper transition-colors hover:border-laterite hover:bg-laterite disabled:opacity-50"
      >
        {isSubmitting ? "Enregistrement…" : "Enregistrer"}
      </button>
    </form>
  );
}

export default function ProfilePage() {
  const router = useRouter();
  const { user, isLoading, updateProfile } = useAuth();

  // Le cookie que proxy.ts vérifie (voir src/proxy.ts) n'est qu'une
  // indication optimiste — s'il est périmé (localStorage vidé manuellement,
  // par exemple) la restauration de session échoue malgré tout : on se
  // rabat alors sur une redirection côté client.
  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/login?next=/profile");
    }
  }, [isLoading, user, router]);

  if (isLoading || !user) {
    return <div className="mx-auto max-w-lg px-6 py-20 text-sm text-ink-soft">Chargement…</div>;
  }

  return (
    <div className="mx-auto max-w-lg px-6 py-12">
      <h1 className="text-2xl font-semibold tracking-tight">Mon profil</h1>

      <dl className="mt-6 grid grid-cols-2 gap-4 border-y border-stone py-4 text-sm">
        <div>
          <dt className="text-xs text-ink-soft">Nom d&apos;utilisateur</dt>
          <dd className="mt-1">{user.username}</dd>
        </div>
        <div>
          <dt className="text-xs text-ink-soft">Type de compte</dt>
          <dd className="mt-1">{USER_TYPE_LABELS[user.user_type]}</dd>
        </div>
        <div>
          <dt className="text-xs text-ink-soft">Email vérifié</dt>
          <dd className="mt-1">{user.is_verified ? "Oui" : "Non"}</dd>
        </div>
        <div>
          <dt className="text-xs text-ink-soft">Membre depuis</dt>
          <dd className="mt-1">{formatFullDate(user.date_joined)}</dd>
        </div>
      </dl>

      <ProfileForm user={user} updateProfile={updateProfile} />
    </div>
  );
}
