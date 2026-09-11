import type { InputHTMLAttributes } from "react";

interface FormFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
}

export function FormField({ label, error, id, ...inputProps }: FormFieldProps) {
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium">
        {label}
      </label>
      <input
        id={id}
        {...inputProps}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${id}-error` : undefined}
        className="mt-1.5 w-full border border-stone bg-paper-raised px-3 py-2 text-sm outline-none focus:border-ink"
      />
      {error && (
        <p id={`${id}-error`} className="mt-1.5 text-sm text-laterite">
          {error}
        </p>
      )}
    </div>
  );
}
