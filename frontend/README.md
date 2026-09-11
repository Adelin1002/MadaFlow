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

Étape 9/37 du cahier des charges (section 17-19) : fondations frontend. Scaffold, client API typé avec rafraîchissement JWT automatique, page d'accueil (copie exacte du cahier des charges), inscription/connexion connectées à l'API réelle.

**Validé en dur** (exécuté réellement, pas seulement écrit) :

- `npm run typecheck`, `npm run lint`, `npm run build` passent tous — le build inclut la compilation TypeScript et le prérendu statique réel des pages, pas une simple lecture de code
- 24 tests Vitest, dont la logique de rafraîchissement JWT (un seul refresh en vol lors de requêtes concurrentes, anti-boucle infinie sur l'endpoint de refresh lui-même, nettoyage des tokens si le refresh échoue) — testée avec un vrai `fetch` mocké simulant les séquences 401 → refresh → retry
- **Intégration réelle testée contre le backend Django** (que j'ai fait tourner en parallèle) : inscription, connexion, `/users/me/`, erreurs de validation. Deux vraies erreurs trouvées et corrigées grâce à ça :
  1. Le backend traduit déjà ses messages d'erreur génériques en français (`LANGUAGE_CODE="fr-fr"`) — mon code les écrasait par un texte français codé en dur en supposant, à tort, un message anglais par défaut.
  2. `RegisterSerializer` ne renvoie pas un objet `User` complet (pas de `id`/`is_verified`/`date_joined`) — mon typage `Promise<User>` sur `register()` était trompeur, corrigé en `RegisterResponse`.

**Non vérifié dans cet environnement de génération** : rendu visuel et interactions réelles dans un navigateur. Ce sandbox n'a pas d'accès display/navigateur — aucun outil comme Playwright n'a pu être utilisé. La compilation, le typage, et le comportement logique du client API sont solidement vérifiés ; l'apparence effective et l'ergonomie (tab order, focus visible, contraste réel une fois rendu) restent à vérifier une fois lancé chez toi avec `npm run dev`.

## Choix techniques notables

- **Next.js 16** : cette version diffère de ce qui circule le plus dans les ressources généralistes sur Next.js — `middleware.ts` est renommé `proxy.ts` (fonction `proxy` au lieu de `middleware`), `next lint` a été retiré au profit d'ESLint en CLI directe. Aucun `proxy.ts` n'existe encore à ce stade (pas de route protégée nécessitant une redirection serveur pour l'instant) ; il faudra y penser dès que `/map`, `/reports` ou `/dashboard` seront ajoutés.
- **Polices auto-hébergées (`next/font/local`)** : `fonts.googleapis.com`/`fonts.gstatic.com` ne sont pas joignables dans cet environnement de génération — `next/font/google` fait donc échouer `next build`. Contourné en récupérant les fichiers **Archivo** (variable, licence OFL) directement depuis le mirror GitHub de Google Fonts (`raw.githubusercontent.com/google/fonts`), utilisés ensuite via `next/font/local`. Fonctionne aussi bien en dev qu'en prod, aucune dépendance réseau au runtime.
- **Tokens JWT en `localStorage`** (`src/lib/auth/token-storage.ts`) : choix pragmatique pour ce MVP, avec un risque XSS documenté. Le module est volontairement isolé pour pouvoir être remplacé par un stockage en cookie httpOnly (via des Route Handlers Next.js faisant proxy vers le backend) sans toucher au reste du code, si le besoin de sécurité s'intensifie avant la mise en production réelle.
- **Palette de couleurs** : ancrée dans le sujet plutôt que dans un kit SaaS générique — le rouge "latérite" (`--laterite`) référence la vraie couleur du sol malgache (Madagascar est surnommée "l'île rouge"), utilisé uniquement pour les alertes/priorités, jamais en décoration.

## Prochaines étapes suggérées

- `/map` — carte interactive (marqueurs, clustering, filtres) consommant `GET /api/v1/reports/`
- `/reports` et `/reports/[id]` — liste et détail des signalements
- `/create-report` — formulaire de signalement avec géolocalisation
- `proxy.ts` pour protéger ces routes côté serveur (redirection si non connecté) plutôt que de s'appuyer uniquement sur les vérifications côté client déjà en place dans `AuthContext`
