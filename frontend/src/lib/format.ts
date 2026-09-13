const RELATIVE_FORMATTER = new Intl.RelativeTimeFormat("fr", { numeric: "auto" });
const DATE_FORMATTER = new Intl.DateTimeFormat("fr-MG", {
  dateStyle: "long",
  timeStyle: "short",
});

const DIVISIONS: { amount: number; unit: Intl.RelativeTimeFormatUnit }[] = [
  { amount: 60, unit: "seconds" },
  { amount: 60, unit: "minutes" },
  { amount: 24, unit: "hours" },
  { amount: 7, unit: "days" },
  { amount: 4.34524, unit: "weeks" },
  { amount: 12, unit: "months" },
  { amount: Number.POSITIVE_INFINITY, unit: "years" },
];

/** "il y a 3 jours", "dans 2 heures", etc. */
export function formatRelativeDate(isoDate: string): string {
  let duration = (new Date(isoDate).getTime() - Date.now()) / 1000;

  for (const division of DIVISIONS) {
    if (Math.abs(duration) < division.amount) {
      return RELATIVE_FORMATTER.format(Math.round(duration), division.unit);
    }
    duration /= division.amount;
  }
  return RELATIVE_FORMATTER.format(Math.round(duration), "years");
}

/** Date complète, pour un affichage non ambigu (ex: infobulle). */
export function formatFullDate(isoDate: string): string {
  return DATE_FORMATTER.format(new Date(isoDate));
}
