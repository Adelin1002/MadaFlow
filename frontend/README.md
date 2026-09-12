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

Étape 10/37 du cahier des charges (section 6.A) : carte interactive, première page protégée du frontend.

**Nouveau à cette étape** :

- **`src/proxy.ts`** (Next.js 16, anciennement `middleware.ts`) : redirige vers `/login?next=...` les visites de routes protégées sans session, et éloigne de `/login`/`/register` les personnes déjà connectées. Vérification **optimiste uniquement** (voir doc Next.js) : la vraie barrière de sécurité reste `IsAuthenticated` côté API Django.
- **Tension architecturale résolue** : les tokens JWT vivent en `localStorage` (choix de l'Étape 9), inaccessible à `proxy.ts` qui tourne en edge runtime. Résolu avec un cookie non-httpOnly (`madaflow_session`), posé/retiré en même temps que les tokens (`src/lib/auth/token-storage.ts`) — ce cookie ne prouve rien côté sécurité, il évite seulement d'afficher le squelette d'une page protégée avant de rediriger.
- **`/map`** : carte Leaflet (`react-leaflet`, chargée en `ssr: false` — Leaflet référence `window` à l'import, incompatible avec le pré-rendu serveur), marqueurs colorés par niveau de priorité via `divIcon` SVG référençant les variables CSS (s'adapte seul au mode sombre), popup avec confirmation fonctionnelle, filtres (catégorie/statut/gravité/priorité) réutilisant les query params déjà supportés par le backend (Étape 3).

**Deux vrais problèmes trouvés et corrigés en écrivant/exécutant les tests** :

1. Un `setState` synchrone en tête d'effet dans `/map` (vraie anti-pattern signalée par `react-hooks/set-state-in-effect`, pas un faux positif d'hydratation comme à l'Étape 9) — corrigé en déplaçant la mise à jour dans le callback asynchrone.
2. `Cookie` est un en-tête interdit par la spec Fetch : impossible à injecter via `headers: { cookie: "..." }` dans un `NextRequest` de test, silencieusement ignoré. Diagnostiqué par une sonde dédiée, corrigé en utilisant `request.cookies.set()`.

**Intégration réelle confirmée contre le backend** (compte de test + signalement créés en direct) : la forme de `GET /api/v1/reports/` correspond exactement aux types TypeScript (`location.latitude/longitude`, `category` en UUID brut, pagination `{count, next, previous, results}`). Confirmation notable : `priority_score` reste `null` juste après création dès qu'aucun worker Celery ne tourne pour consommer la tâche asynchrone (contrairement aux tests pytest, où `CELERY_TASK_ALWAYS_EAGER=True` simule l'exécution synchrone) — le frontend gérait déjà ce cas nul correctement (`?? "en cours de calcul"`), confirmé plutôt que supposé.

**Non vérifié dans cet environnement de génération** : rendu visuel de la carte (positionnement des marqueurs, tuiles OpenStreetMap, popups) — toujours pas de navigateur disponible ici. La logique (récupération des données, construction des icônes, filtres, protection de route) est testée ; l'apparence reste à vérifier avec `npm run dev`.

## Choix techniques notables

- **Next.js 16** : cette version diffère de ce qui circule le plus dans les ressources généralistes sur Next.js — `middleware.ts` est renommé `proxy.ts` (fonction `proxy` au lieu de `middleware`), `next lint` a été retiré au profit d'ESLint en CLI directe. `next typegen` régénère les types de routes ambient (`LayoutProps`, etc.) sans build complet — nécessaire après toute suppression de `.next/`.
- **Polices auto-hébergées (`next/font/local`)** : `fonts.googleapis.com`/`fonts.gstatic.com` ne sont pas joignables dans cet environnement de génération — `next/font/google` fait donc échouer `next build`. Contourné en récupérant les fichiers **Archivo** (variable, licence OFL) directement depuis le mirror GitHub de Google Fonts (`raw.githubusercontent.com/google/fonts`), utilisés ensuite via `next/font/local`. Fonctionne aussi bien en dev qu'en prod, aucune dépendance réseau au runtime.
- **Tokens JWT en `localStorage`** (`src/lib/auth/token-storage.ts`) : choix pragmatique pour ce MVP, avec un risque XSS documenté. Le module est volontairement isolé pour pouvoir être remplacé par un stockage en cookie httpOnly (via des Route Handlers Next.js faisant proxy vers le backend) sans toucher au reste du code, si le besoin de sécurité s'intensifie avant la mise en production réelle.
- **Marqueurs de carte en `divIcon` SVG**, pas les icônes PNG par défaut de Leaflet (chemins relatifs notoirement cassés sous les bundlers) — permet aussi de référencer directement les variables CSS du thème plutôt que de dupliquer les couleurs en JS.
- **Palette de couleurs** : ancrée dans le sujet plutôt que dans un kit SaaS générique — le rouge "latérite" (`--laterite`) référence la vraie couleur du sol malgache (Madagascar est surnommée "l'île rouge"), utilisé uniquement pour les alertes/priorités, jamais en décoration. L'échelle de priorité complète va de `--stone` (faible) à `--laterite` (critique) en passant par `--ochre` (moyenne).

## Prochaines étapes suggérées

- `/reports` et `/reports/[id]` — liste et détail des signalements (le détail pourrait aussi exposer le calcul complet du score de priorité, déjà transparent côté API)
- `/create-report` — formulaire de signalement avec géolocalisation (navigateur) ou sélection sur la carte
- `/profile` — consultation/édition de `GET/PATCH /api/v1/users/me/`, déjà implémenté côté client (`updateMe` dans `src/lib/api/auth.ts`) mais sans page
- Un vrai worker Celery documenté dans le flux de développement local (`celery -A config worker`) — sans lui, `priority_score` et les analyses IA restent indéfiniment `null`/vides, comme confirmé à cette étape
