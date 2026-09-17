export type UserType = "citizen" | "business" | "municipal_admin" | "platform_admin";

export interface User {
  id: string;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  user_type: UserType;
  phone_number: string;
  is_verified: boolean;
  date_joined: string;
}

export interface AuthTokens {
  access: string;
  refresh: string;
}

/**
 * Ce que renvoie /auth/register/ — pas un User complet : RegisterSerializer
 * (backend) n'expose que ces 4 champs en écriture publique, jamais id/
 * is_verified/date_joined (vérifié contre le vrai serveur). Le profil
 * complet s'obtient via fetchMe() juste après, voir AuthContext.register().
 */
export interface RegisterResponse {
  username: string;
  email: string;
  user_type: UserType;
  phone_number: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  icon: string;
  color: string;
  is_active: boolean;
}

export interface ReportLocation {
  id: string;
  latitude: number;
  longitude: number;
  approximate_address: string;
  district: string | null;
}

export interface ReportImage {
  id: string;
  image: string;
  uploaded_at: string;
}

/**
 * Le détail exact de `explanation.factors` dépend du moteur de scoring
 * (apps.scoring.services côté backend) et peut évoluer ; on ne type que la
 * forme commune à tous les facteurs plutôt que de dupliquer chaque champ
 * spécifique (count, district, note...) qui varie selon le facteur.
 */
export interface PriorityScoreFactor {
  score: number;
  weight?: number;
  contribution?: number;
  [key: string]: unknown;
}

export interface PriorityScoreExplanation {
  factors: Record<string, PriorityScoreFactor>;
  not_implemented_factors: string[];
}

export interface PriorityScore {
  score: number;
  level: "low" | "medium" | "high" | "critical";
  explanation: PriorityScoreExplanation;
  computed_at: string;
}

export type ReportStatus = "new" | "confirmed" | "in_progress" | "resolved" | "rejected";
export type ReportSeverity = "low" | "medium" | "high" | "critical";

export interface Report {
  id: string;
  reporter: { id: string; username: string; user_type: UserType };
  category: string;
  location: ReportLocation;
  title: string;
  description: string;
  severity: ReportSeverity;
  status: ReportStatus;
  duplicate_of: string | null;
  images: ReportImage[];
  confirmations_count: number;
  priority_score: PriorityScore | null;
  created_at: string;
  updated_at: string;
  resolved_at: string | null;
}

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

/**
 * Types calqués sur apps.scoring.analytics (backend, Étape 8) — 4 endpoints
 * réservés municipal_admin/platform_admin, jamais de statistique fabriquée :
 * avg_resolution_hours vaut null tant qu'aucun signalement n'est résolu,
 * plutôt qu'un zéro trompeur (voir apps.scoring.analytics.get_overview).
 */
export interface AnalyticsOverview {
  total_reports: number;
  active_reports: number;
  resolved_reports: number;
  rejected_reports: number;
  by_status: Record<ReportStatus, number>;
  by_severity: Record<ReportSeverity, number>;
  by_category: { category: string; count: number }[];
  avg_resolution_hours: number | null;
}

export interface DistrictStats {
  district: string;
  district_id: string;
  total_reports: number;
  active_reports: number;
  resolved_reports: number;
  critical_active_reports: number;
  avg_priority_score: number | null;
}

export interface TimelinePoint {
  date: string;
  count: number;
}

export interface AnalyticsTimeline {
  window_days: number;
  created: TimelinePoint[];
  resolved: TimelinePoint[];
}

export interface HeatmapPoint {
  report_id: string;
  lat: number;
  lon: number;
  weight: number;
}

/**
 * Calqué sur apps.ai_engine.serializers.AIAnalysisSerializer (backend,
 * Étape 6) — réservé aux admins via GET /reports/{id}/ai_analyses/.
 * `result` varie selon `analysis_type` (classification/résumé/doublons) ;
 * pas de type précis par variante ici, juste un dict — le composant qui
 * l'affiche connaît la forme attendue pour chaque type.
 */
export type AIAnalysisType =
  | "classification"
  | "duplicate_detection"
  | "summary"
  | "image_analysis"
  | "anomaly"
  | "prediction";

export interface AIAnalysis {
  id: string;
  analysis_type: AIAnalysisType;
  provider: string;
  result: Record<string, unknown>;
  confidence: number | null;
  data_source: "real" | "demo" | "predicted";
  created_at: string;
}

/**
 * Forme normalisée des erreurs DRF : soit {"detail": "..."} pour une erreur
 * générique (401/403/404), soit un dict champ -> liste de messages pour les
 * erreurs de validation (400) — voir ApiError plus bas qui les unifie.
 */
export type ApiErrorBody = { detail?: string } & Record<string, string[] | string | undefined>;
