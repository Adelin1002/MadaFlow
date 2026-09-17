# MadaFlow — Frontend

Next.js 16 (App Router) + TypeScript + Tailwind CSS v4.

## Démarrage rapide

```bash
cp .env.example .env.local
# éditer .env.local si le backend ne tourne pas sur localhost:8000

npm install
npm run dev
```

Le backend (voir `../backend/README.md`) doit tourner en parallèle, avec `CORS_ALLOWED_ORIGINS` incluant `http://localhost:3000` dans son `.env` (déjà le cas par défaut).

## Scripts

```bash
npm run dev              # serveur de développement
npm run build            # build de production (Turbopack)
npm run typecheck        # tsc --noEmit
npm run lint              # eslint . (flat config, Next.js 16 — next lint n'existe plus)
npm run format            # prettier --write .
npm run format:check      # prettier --check .
npm run test               # vitest run
```

## Statut

Étape 15/37 du cahier des charges (section 5, 8) : actions admin sur la page de détail d'un signalement — changement de statut et diagnostic IA, deux endpoints construits et testés côté backend depuis les Étapes 3 et 6, jamais exposés jusqu'ici.

**Nouveau à cette étape** :

- **`StatusUpdateControl`** : changement de statut (`PATCH /reports/{id}/status_update/`), affiché uniquement pour `municipal_admin`/`platform_admin` sur `/reports/[id]`.
- **`AiAnalysesPanel`** : diagnostic IA brut (classification suggérée, résumé, doublons détectés), première interface pour `GET /reports/{id}/ai_analyses/` construit à l'Étape 6 — jusqu'ici seulement accessible via `curl`.

**Un vrai bug trouvé par l'intégration réelle, corrigé avant tout usage** : `updateReportStatus` était typé `Promise<Report>`, mais `ReportStatusSerializer` (backend) ne renvoie que `{status, resolved_at}` — confirmé contre le vrai serveur. Le code appelant (`onUpdated(updated)`) aurait remplacé l'état complet du signalement par cet objet partiel au premier clic, faisant disparaître le titre, la description, les images de l'écran. Corrigé en :

1. Renommant le type de retour en `UpdateStatusResponse` (le vrai contrat)
2. Extrayant une fonction `applyStatusPatch(report, patch)` qui **fusionne** le patch dans le signalement existant plutôt que de le remplacer
3. Ajoutant un test de régression qui verrouille ce comportement (`applyStatusPatch` ne doit jamais perdre de champs, ne doit jamais muter l'original)

C'est le premier vrai bug de logique d'état trouvé dans ce projet frontend (les précédents étaient soit des styles de code signalés par ESLint, soit des hypothèses de format déjà correctes) — et il n'a été découvert qu'en testant contre le vrai serveur avec un vrai rôle admin, pas en lisant le code.

**Le reste de l'intégration confirmé sans correction** : citoyen 403 sur les deux endpoints (la vraie barrière de sécurité, cohérente avec le choix de ne pas afficher les contrôles côté UI pour ce rôle), et la forme de `ai_analyses` (classification, résumé, détection de doublons) correspond exactement à `renderResult()`.

**Non vérifié dans cet environnement de génération** : rendu visuel — toujours pas de navigateur disponible ici.

## Choix techniques notables

- **Next.js 16** : cette version diffère de ce qui circule le plus dans les ressources généralistes sur Next.js — `middleware.ts` est renommé `proxy.ts` (fonction `proxy` au lieu de `middleware`), `next lint` a été retiré au profit d'ESLint en CLI directe. `next typegen` régénère les types de routes ambient (`LayoutProps`, `PageProps`, etc.) sans build complet — nécessaire après toute suppression de `.next/` ou toute nouvelle route.
- **Polices auto-hébergées (`next/font/local`)** : `fonts.googleapis.com`/`fonts.gstatic.com` ne sont pas joignables dans cet environnement de génération — `next/font/google` fait donc échouer `next build`. Contourné en récupérant les fichiers **Archivo** (variable, licence OFL) directement depuis le mirror GitHub de Google Fonts (`raw.githubusercontent.com/google/fonts`), utilisés ensuite via `next/font/local`. Fonctionne aussi bien en dev qu'en prod, aucune dépendance réseau au runtime.
- **Tokens JWT en `localStorage`** (`src/lib/auth/token-storage.ts`) : choix pragmatique pour ce MVP, avec un risque XSS documenté. Le module est volontairement isolé pour pouvoir être remplacé par un stockage en cookie httpOnly (via des Route Handlers Next.js faisant proxy vers le backend) sans toucher au reste du code, si le besoin de sécurité s'intensifie avant la mise en production réelle.
- **Marqueurs de carte en `divIcon` SVG**, pas les icônes PNG par défaut de Leaflet (chemins relatifs notoirement cassés sous les bundlers) — permet aussi de référencer directement les variables CSS du thème plutôt que de dupliquer les couleurs en JS.
- **Palette de couleurs** : ancrée dans le sujet plutôt que dans un kit SaaS générique — le rouge "latérite" (`--laterite`) référence la vraie couleur du sol malgache (Madagascar est surnommée "l'île rouge"), utilisé uniquement pour les alertes/priorités, jamais en décoration. L'échelle de priorité complète va de `--stone` (faible) à `--laterite` (critique) en passant par `--ochre` (moyenne).

## Prochaines étapes suggérées

- Un vrai worker Celery documenté dans le flux de développement local (`celery -A config worker`) — sans lui, `priority_score` et les analyses IA restent indéfiniment `null`/vides, confirmé aux Étapes 10 et 11
- Pagination de `/reports` : actuellement un compteur de page suivi côté client (voir Statut de l'Étape 11) — passer à des liens numérotés ("1 2 3...") demanderait de connaître le nombre total de pages, calculable depuis `count` déjà renvoyé par l'API
- `/dashboard` sur `?days=` de la timeline : actuellement fixé à la valeur par défaut du backend (30 jours) — un sélecteur (7/30/90 jours) serait un ajout simple, `getTimeline(days)` le supporte déjà côté client
- Le dashboard entreprise (section 13, `user_type: "business"`) reste à construire, sur le même modèle de garde de rôle (`AdminOnly` généralisable en un `RoleGate` plus générique si un deuxième rôle apparaît)
- Assigner une intervention à un signalement (section 5 : "assigner une intervention") n'a pas d'équivalent côté backend pour l'instant — nécessiterait un nouveau champ/modèle avant toute UI
