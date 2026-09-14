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

Étape 13/37 du cahier des charges (section 18) : page profil — dernière brique manquante du cycle citoyen, et un vrai lien mort refermé au passage.

**Constat avant de commencer** : le lien "Profil" existait dans la navbar depuis l'Étape 9 et pointait vers une page qui n'a jamais été construite — un lien mort resté ouvert pendant quatre étapes. Corrigé en priorité plutôt que d'enchaîner sur une nouvelle direction (tableau de bord admin).

**Nouveau à cette étape** :

- **`/profile`** : consultation (nom d'utilisateur, type de compte, email vérifié, date d'inscription — tous en lecture seule) et édition (email, prénom, nom, téléphone) via `PATCH /api/v1/users/me/`.
- **`AuthContext.updateProfile`** : centralise l'appel API et la mise à jour de l'utilisateur dans le contexte global, plutôt qu'un état local à la page — tout ce qui lit `user` via `useAuth()` (la navbar, par exemple) reste synchronisé après une édition.
- **Décision de scope délibérée, pas une limite technique** : le backend autorise techniquement la modification de `username` via `PATCH /users/me/` (confirmé contre le vrai serveur), mais l'interface ne l'expose pas — changer son identifiant remettrait en cause son affichage ailleurs dans l'app (auteur des signalements, etc.) sans bénéfice clair pour ce MVP.

**Un vrai problème de conception corrigé avant la mise en production du code, pas après un bug** : la première version de la page synchronisait l'état local du formulaire depuis `user` (le contexte) via un `useEffect` — signalé à raison par `react-hooks/set-state-in-effect` comme l'anti-pattern canonique ("dériver un état depuis une prop via un effet"). Corrigé en extrayant un composant `ProfileForm` qui ne monte qu'une fois `user` garanti non nul, initialisant son état directement depuis les props — plus besoin d'effet du tout. Contrairement aux faux positifs d'hydratation des étapes précédentes, celui-ci était fondé.

**Intégration réelle confirmée contre le backend** : le payload exact du formulaire fonctionne (200), la tentative de modifier `user_type` est bien silencieusement ignorée (`read_only_fields` tient), et la modification de `username` fonctionne comme prévu par le backend — confirmant que son absence de l'UI est un choix, pas un oubli.

**Non vérifié dans cet environnement de génération** : rendu visuel du formulaire — toujours pas de navigateur disponible ici.

## Choix techniques notables

- **Next.js 16** : cette version diffère de ce qui circule le plus dans les ressources généralistes sur Next.js — `middleware.ts` est renommé `proxy.ts` (fonction `proxy` au lieu de `middleware`), `next lint` a été retiré au profit d'ESLint en CLI directe. `next typegen` régénère les types de routes ambient (`LayoutProps`, `PageProps`, etc.) sans build complet — nécessaire après toute suppression de `.next/` ou toute nouvelle route.
- **Polices auto-hébergées (`next/font/local`)** : `fonts.googleapis.com`/`fonts.gstatic.com` ne sont pas joignables dans cet environnement de génération — `next/font/google` fait donc échouer `next build`. Contourné en récupérant les fichiers **Archivo** (variable, licence OFL) directement depuis le mirror GitHub de Google Fonts (`raw.githubusercontent.com/google/fonts`), utilisés ensuite via `next/font/local`. Fonctionne aussi bien en dev qu'en prod, aucune dépendance réseau au runtime.
- **Tokens JWT en `localStorage`** (`src/lib/auth/token-storage.ts`) : choix pragmatique pour ce MVP, avec un risque XSS documenté. Le module est volontairement isolé pour pouvoir être remplacé par un stockage en cookie httpOnly (via des Route Handlers Next.js faisant proxy vers le backend) sans toucher au reste du code, si le besoin de sécurité s'intensifie avant la mise en production réelle.
- **Marqueurs de carte en `divIcon` SVG**, pas les icônes PNG par défaut de Leaflet (chemins relatifs notoirement cassés sous les bundlers) — permet aussi de référencer directement les variables CSS du thème plutôt que de dupliquer les couleurs en JS.
- **Palette de couleurs** : ancrée dans le sujet plutôt que dans un kit SaaS générique — le rouge "latérite" (`--laterite`) référence la vraie couleur du sol malgache (Madagascar est surnommée "l'île rouge"), utilisé uniquement pour les alertes/priorités, jamais en décoration. L'échelle de priorité complète va de `--stone` (faible) à `--laterite` (critique) en passant par `--ochre` (moyenne).

## Prochaines étapes suggérées

- Un vrai worker Celery documenté dans le flux de développement local (`celery -A config worker`) — sans lui, `priority_score` et les analyses IA restent indéfiniment `null`/vides, confirmé aux Étapes 10 et 11
- Pagination de `/reports` : actuellement un compteur de page suivi côté client (voir Statut de l'Étape 11) — passer à des liens numérotés ("1 2 3...") demanderait de connaître le nombre total de pages, calculable depuis `count` déjà renvoyé par l'API
- Le cycle citoyen (accueil → inscription → carte → liste/détail → confirmation → création → profil) est maintenant complet de bout en bout ; la suite logique s'oriente vers les autres rôles (`municipal_admin`, `business`) ou vers le tableau de bord (section 12, déjà exposé côté API depuis l'Étape 8 mais sans interface)
