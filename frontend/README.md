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

Étape 11/37 du cahier des charges (section 6, 18) : liste et détail des signalements.

**Nouveau à cette étape** :

- **`/reports`** : liste paginée, réutilise le `FiltersPanel` déjà construit pour `/map` (catégorie/statut/gravité/priorité) plutôt que d'en dupliquer un. Pagination par compteur local (`filters.page`) plutôt que par extraction du paramètre `page` depuis les URLs `next`/`previous` de DRF — voir plus bas pourquoi.
- **`/reports/[id]`** : page de détail — description complète, photos, badges de gravité/statut/priorité, et surtout la **première interface pour l'explicabilité du score de priorité** construite à l'Étape 7 (`PriorityExplanation`) : chaque facteur (gravité, confirmations, doublons liés, ancienneté, récurrence), son poids et sa contribution, plus la mention explicite des facteurs non implémentés (`proximite_zone_importante`) plutôt que de les cacher.
- **`ConfirmButton`** extrait en composant partagé entre le popup de la carte et la page de détail (au lieu d'une logique dupliquée).
- **`PageProps<'/reports/[id]'>`** : helper de typage ambient généré par `next typegen`, à régénérer après la création de chaque nouvelle route dynamique (pas seulement après suppression de `.next/`, comme découvert à l'Étape 10).

**Un vrai bug évité avant même d'écrire du code** : DRF omet `page=1` du lien `previous` de la pagination (comportement standard de `PageNumberPagination` — la page 1 n'a pas besoin d'être explicite). Une implémentation naïve extrayant le numéro de page depuis l'URL `previous` aurait rendu le bouton "Précédent" silencieusement inopérant en revenant à la première page. Repéré en analysant le comportement DRF avant d'écrire le test, pas après un échec — remplacé par un compteur de page suivi côté client.

**Deux hypothèses vérifiées, pas juste supposées** :

1. Les chaînes produites par `Intl.RelativeTimeFormat` en français ne sont pas devinables sans exécution réelle (`"maintenant"` pour 0 seconde avec `numeric: "auto"`, pas `"il y a 0 seconde"` comme je l'avais d'abord écrit) — corrigé après avoir fait tourner le test et lu la vraie sortie ICU.
2. **Confirmation complète et rassurante** : en créant un signalement avec un vrai worker Celery actif (`celery -A config worker`) et en récupérant son détail, le payload `priority_score` réel correspond exactement à ce que `PriorityExplanation` attendait — construit à l'Étape 11 à partir de la lecture du code backend de l'Étape 7, jamais testé en conditions réelles jusqu'ici. Aucune correction nécessaire.

**Non vérifié dans cet environnement de génération** : rendu visuel (positionnement des badges, barres de contribution, galerie d'images) — toujours pas de navigateur disponible ici.

## Choix techniques notables

- **Next.js 16** : cette version diffère de ce qui circule le plus dans les ressources généralistes sur Next.js — `middleware.ts` est renommé `proxy.ts` (fonction `proxy` au lieu de `middleware`), `next lint` a été retiré au profit d'ESLint en CLI directe. `next typegen` régénère les types de routes ambient (`LayoutProps`, etc.) sans build complet — nécessaire après toute suppression de `.next/`.
- **Polices auto-hébergées (`next/font/local`)** : `fonts.googleapis.com`/`fonts.gstatic.com` ne sont pas joignables dans cet environnement de génération — `next/font/google` fait donc échouer `next build`. Contourné en récupérant les fichiers **Archivo** (variable, licence OFL) directement depuis le mirror GitHub de Google Fonts (`raw.githubusercontent.com/google/fonts`), utilisés ensuite via `next/font/local`. Fonctionne aussi bien en dev qu'en prod, aucune dépendance réseau au runtime.
- **Tokens JWT en `localStorage`** (`src/lib/auth/token-storage.ts`) : choix pragmatique pour ce MVP, avec un risque XSS documenté. Le module est volontairement isolé pour pouvoir être remplacé par un stockage en cookie httpOnly (via des Route Handlers Next.js faisant proxy vers le backend) sans toucher au reste du code, si le besoin de sécurité s'intensifie avant la mise en production réelle.
- **Marqueurs de carte en `divIcon` SVG**, pas les icônes PNG par défaut de Leaflet (chemins relatifs notoirement cassés sous les bundlers) — permet aussi de référencer directement les variables CSS du thème plutôt que de dupliquer les couleurs en JS.
- **Palette de couleurs** : ancrée dans le sujet plutôt que dans un kit SaaS générique — le rouge "latérite" (`--laterite`) référence la vraie couleur du sol malgache (Madagascar est surnommée "l'île rouge"), utilisé uniquement pour les alertes/priorités, jamais en décoration. L'échelle de priorité complète va de `--stone` (faible) à `--laterite` (critique) en passant par `--ochre` (moyenne).

## Prochaines étapes suggérées

- `/create-report` — formulaire de signalement avec géolocalisation (navigateur) ou sélection sur la carte
- `/profile` — consultation/édition de `GET/PATCH /api/v1/users/me/`, déjà implémenté côté client (`updateMe` dans `src/lib/api/auth.ts`) mais sans page
- Un vrai worker Celery documenté dans le flux de développement local (`celery -A config worker`) — sans lui, `priority_score` et les analyses IA restent indéfiniment `null`/vides, confirmé aux Étapes 10 et 11
- Pagination de `/reports` : actuellement un compteur de page suivi côté client (voir Statut ci-dessus) — passer à des liens numérotés ("1 2 3...") demanderait de connaître le nombre total de pages, calculable depuis `count` déjà renvoyé par l'API
