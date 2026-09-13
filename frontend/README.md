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

Étape 12/37 du cahier des charges (section 7) : création de signalement, dernière pièce du cycle citoyen complet (créer _et_ consulter, plus seulement consulter).

**Nouveau à cette étape** :

- **`/create-report`** : catégorie, titre, description, gravité, localisation, photos (facultatives). Le flux respecte l'API telle qu'elle existe réellement : `POST /reports/` (JSON) crée le signalement, puis chaque photo est envoyée séparément via `POST /reports/{id}/images/` (multipart) — l'API n'accepte pas les photos à la création elle-même (voir `apps.reports.views.ReportViewSet.images` côté backend, Étape 3). Un échec d'upload de photo n'empêche pas d'accéder au signalement déjà créé avec succès.
- **`LocationPicker`** : sélection de la localisation par clic sur une carte Leaflet embarquée ou par géolocalisation navigateur (`navigator.geolocation`), avec recentrage automatique de la carte quand la position change par un autre moyen que le clic. Pas de géocodage inverse (aucun service autorisé dans cet environnement, et hors périmètre de cette étape) — l'adresse approximative reste un champ texte libre, facultatif.
- Lien "Signaler" ajouté à la navbar, en évidence au même titre que "Créer un compte" pour les visiteurs non connectés.

**Un vrai artefact de test découvert, pas un bug produit** : en testant l'upload de photo via `curl`, le GIF de test construit avec `printf` et des séquences d'échappement shell (`\xff`, `\x04`...) s'est corrompu silencieusement (`file` rapportait des dimensions absurdes de 30812×12592 pour un GIF censé faire 1×1 pixel). Reconstruit avec Python pour un contrôle exact des octets, l'upload a fonctionné du premier coup. Bon rappel que l'outil de test peut être la source de l'échec, pas seulement le code testé — la même discipline de vérification s'applique à mes propres scripts de test.

**Flux complet confirmé de bout en bout contre le vrai backend** (création JSON → upload multipart → relecture) : la photo apparaît dans `images[]` avec une URL absolue (`http://localhost:8000/media/...`), exactement la forme attendue par mon type `ReportImage`. Aucune correction de code nécessaire — une confirmation propre plutôt qu'une découverte de bug, comme la vérification de `PriorityExplanation` à l'Étape 11.

**Non vérifié dans cet environnement de génération** : rendu visuel du formulaire et de la carte de sélection, ergonomie tactile de la sélection par clic sur mobile — toujours pas de navigateur disponible ici.

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
- Pagination de `/reports` : actuellement un compteur de page suivi côté client (voir Statut de l'Étape 11) — passer à des liens numérotés ("1 2 3...") demanderait de connaître le nombre total de pages, calculable depuis `count` déjà renvoyé par l'API
- Le cycle citoyen (accueil → inscription → carte → liste/détail → confirmation → création) est maintenant complet de bout en bout ; la suite logique s'oriente vers les autres rôles (`municipal_admin`, `business`) ou vers le tableau de bord (section 12, déjà exposé côté API depuis l'Étape 8 mais sans interface)
