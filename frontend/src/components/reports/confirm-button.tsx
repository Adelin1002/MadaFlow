"use client";

import { useState } from "react";
import { ApiError } from "@/lib/api/client";
import { confirmReport } from "@/lib/api/reports";

export function ConfirmButton({ reportId }: { reportId: string }) {
  const [state, setState] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [message, setMessage] = useState<string | null>(null);

  async function handleConfirm() {
    setState("loading");
    try {
      const result = await confirmReport(reportId);
      setMessage(result.detail);
      setState("done");
    } catch (error) {
      setMessage(
        error instanceof ApiError && error.body.detail
          ? error.body.detail
          : "Impossible de confirmer ce signalement.",
      );
      setState("error");
    }
  }

  return (
    <div className="space-y-1.5">
      {state !== "done" && (
        <button
          type="button"
          onClick={handleConfirm}
          disabled={state === "loading"}
          className="border border-ink px-3 py-1.5 text-xs font-medium transition-colors hover:border-laterite hover:text-laterite disabled:opacity-50"
        >
          {state === "loading" ? "Confirmation…" : "Je confirme ce problème"}
        </button>
      )}
      {message && (
        <p className={`text-xs ${state === "error" ? "text-laterite" : "text-paddy"}`}>{message}</p>
      )}
    </div>
  );
}
