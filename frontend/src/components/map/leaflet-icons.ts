import L from "leaflet";
import type { PriorityScore } from "@/lib/api/types";

/**
 * Palette de priorité — du calme (stone) à l'urgent (laterite), en passant
 * par ochre. Pas les couleurs de statut (paddy=résolu) : un marqueur de
 * signalement actif reste dans cette échelle même à priorité "low".
 */
const PRIORITY_COLORS: Record<PriorityScore["level"], string> = {
  low: "var(--stone)",
  medium: "var(--ochre)",
  high: "var(--laterite-soft)",
  critical: "var(--laterite)",
};

/**
 * `divIcon` plutôt que les icônes PNG par défaut de Leaflet, dont les
 * chemins relatifs sont notoirement cassés une fois passés par un bundler
 * (webpack/Turbopack) — un problème connu de react-leaflet, pas la peine de
 * le réintroduire. Le SVG utilise `var(--...)`, donc s'adapte seul au mode
 * sombre puisque divIcon insère du vrai DOM (héritage CSS normal).
 */
export function createReportIcon(level: PriorityScore["level"] | null): L.DivIcon {
  const color = level ? PRIORITY_COLORS[level] : PRIORITY_COLORS.low;

  return L.divIcon({
    className: "",
    html: `
      <svg width="26" height="26" viewBox="0 0 26 26" xmlns="http://www.w3.org/2000/svg">
        <circle cx="13" cy="13" r="9" fill="${color}" stroke="var(--paper-raised)" stroke-width="2.5" />
      </svg>
    `,
    iconSize: [26, 26],
    iconAnchor: [13, 13],
    popupAnchor: [0, -13],
  });
}
