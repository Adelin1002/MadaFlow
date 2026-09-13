"use client";

import dynamic from "next/dynamic";
import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { FormField } from "@/components/form-field";
import { useCategories } from "@/lib/hooks/use-categories";
import { getFieldErrors, getGeneralError } from "@/lib/api/error-messages";
import { createReport, uploadReportImage } from "@/lib/api/reports";
import type { ReportSeverity } from "@/lib/api/types";

// Leaflet référence `window` dès l'import — incompatible avec le pré-rendu serveur.
const LocationPicker = dynamic(
  () => import("@/components/create-report/location-picker").then((mod) => mod.LocationPicker),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-64 items-center justify-center border border-stone text-sm text-ink-soft">
        Chargement de la carte…
      </div>
    ),
  },
);

const SEVERITY_OPTIONS: { value: ReportSeverity; label: string }[] = [
  { value: "low", label: "Faible" },
  { value: "medium", label: "Moyenne" },
  { value: "high", label: "Élevée" },
  { value: "critical", label: "Critique" },
];

export default function CreateReportPage() {
  const router = useRouter();
  const categories = useCategories();

  const [category, setCategory] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [severity, setSeverity] = useState<ReportSeverity>("medium");
  const [approximateAddress, setApproximateAddress] = useState("");
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [photos, setPhotos] = useState<File[]>([]);

  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setFieldErrors({});
    setGeneralError(null);

    if (latitude === null || longitude === null) {
      setGeneralError("Choisissez un point sur la carte ou utilisez votre position actuelle.");
      return;
    }

    setIsSubmitting(true);
    try {
      const report = await createReport({
        category,
        title,
        description,
        severity,
        latitude,
        longitude,
        approximate_address: approximateAddress || undefined,
      });

      // Les photos sont envoyées une par une après coup (l'API ne les accepte
      // pas à la création elle-même, voir apps.reports.views.ReportViewSet.images
      // côté backend) — un échec d'upload n'empêche pas d'accéder au
      // signalement déjà créé avec succès.
      for (const photo of photos) {
        try {
          await uploadReportImage(report.id, photo);
        } catch {
          // Non bloquant : le signalement existe déjà, on continue les autres photos.
        }
      }

      router.push(`/reports/${report.id}`);
    } catch (error) {
      setFieldErrors(getFieldErrors(error));
      setGeneralError(getGeneralError(error));
      setIsSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-xl px-6 py-12">
      <h1 className="text-2xl font-semibold tracking-tight">Signaler un problème</h1>
      <p className="mt-2 text-sm text-ink-soft">
        Catégorie, description et localisation — moins d&apos;une minute.
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

        <div>
          <label htmlFor="category" className="block text-sm font-medium">
            Catégorie
          </label>
          <select
            id="category"
            value={category}
            onChange={(event) => setCategory(event.target.value)}
            required
            className="mt-1.5 w-full border border-stone bg-paper-raised px-3 py-2 text-sm outline-none focus:border-ink"
          >
            <option value="" disabled>
              Choisir une catégorie
            </option>
            {categories.map((option) => (
              <option key={option.id} value={option.id}>
                {option.name}
              </option>
            ))}
          </select>
          {fieldErrors.category && (
            <p className="mt-1.5 text-sm text-laterite">{fieldErrors.category}</p>
          )}
        </div>

        <FormField
          id="title"
          label="Titre"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          error={fieldErrors.title}
          required
        />

        <div>
          <label htmlFor="description" className="block text-sm font-medium">
            Description
          </label>
          <textarea
            id="description"
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            required
            rows={4}
            className="mt-1.5 w-full border border-stone bg-paper-raised px-3 py-2 text-sm outline-none focus:border-ink"
          />
          {fieldErrors.description && (
            <p className="mt-1.5 text-sm text-laterite">{fieldErrors.description}</p>
          )}
        </div>

        <div>
          <label htmlFor="severity" className="block text-sm font-medium">
            Gravité
          </label>
          <select
            id="severity"
            value={severity}
            onChange={(event) => setSeverity(event.target.value as ReportSeverity)}
            className="mt-1.5 w-full border border-stone bg-paper-raised px-3 py-2 text-sm outline-none focus:border-ink"
          >
            {SEVERITY_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <LocationPicker
          latitude={latitude}
          longitude={longitude}
          onChange={(lat, lon) => {
            setLatitude(lat);
            setLongitude(lon);
          }}
        />

        <FormField
          id="approximate_address"
          label="Adresse approximative (facultatif)"
          value={approximateAddress}
          onChange={(event) => setApproximateAddress(event.target.value)}
          error={fieldErrors.approximate_address}
        />

        <div>
          <label htmlFor="photos" className="block text-sm font-medium">
            Photos (facultatif)
          </label>
          <input
            id="photos"
            type="file"
            accept="image/*"
            multiple
            onChange={(event) => setPhotos(Array.from(event.target.files ?? []))}
            className="mt-1.5 w-full text-sm"
          />
          {photos.length > 0 && (
            <p className="mt-1 text-xs text-ink-soft">{photos.length} photo(s) sélectionnée(s)</p>
          )}
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full border border-ink bg-ink px-4 py-2.5 text-sm font-medium text-paper transition-colors hover:border-laterite hover:bg-laterite disabled:opacity-50"
        >
          {isSubmitting ? "Envoi en cours…" : "Envoyer le signalement"}
        </button>
      </form>
    </div>
  );
}
