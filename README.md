# MadaFlow

Plateforme SaaS géospatiale intelligente pour Madagascar.

- **`backend/`** — Django REST Framework + PostGIS, architecture **modular monolith**. Voir `backend/README.md`.
- **`frontend/`** — Next.js 16 + TypeScript + Tailwind. Voir `frontend/README.md`.

## Démarrage rapide (backend)

```bash
cp backend/.env.example backend/.env
# éditer backend/.env : générer une vraie DJANGO_SECRET_KEY

make build
make migrate
docker compose run --rm backend python manage.py loaddata categories_seed
docker compose run --rm backend python manage.py createsuperuser

make up
```

Voir le `Makefile` pour les raccourcis (`make test`, `make lint`, `make format`, `make shell`, `make logs`).

L'API sera disponible sur `http://localhost:8000/api/v1/`, la doc Swagger sur `http://localhost:8000/api/docs/`.

## Démarrage rapide (frontend)

```bash
cd frontend
cp .env.example .env.local
npm install
npm run dev
```

Disponible sur `http://localhost:3000/`. Voir `frontend/README.md` pour le détail (scripts, choix techniques, limites connues).

## Tests

```bash
docker compose run --rm backend pytest --cov=apps --cov-report=term-missing
cd frontend && npm run test
```

Suite backend : 176 tests, 99% de couverture (auth, permissions par rôle, CRUD signalements, filtres, upload d'images, requêtes géospatiales PostGIS réelles, pipeline IA classification/résumé/doublons, moteur de scoring de priorité, agrégations analytics). Exécutée et validée contre une vraie base PostgreSQL/PostGIS, pas de mock de la couche géo (le seul mock du projet concerne le client SDK Anthropic — voir Statut ci-dessous).

Suite frontend : 53 tests Vitest (client API avec rafraîchissement JWT, stockage de tokens, `proxy.ts` de protection de routes, création de signalement et upload de photo, édition de profil, construction des requêtes filtrées, formatage de dates), plus intégration réelle testée contre un backend Django lancé en parallèle avec un vrai worker Celery actif — voir `frontend/README.md`.

## Structure

Voir chaque `apps/<domaine>/` : un domaine métier = une app Django autonome (models, urls, views, services, permissions). Pas de logique métier dans les vues — voir `apps/ai_engine/providers/` pour un exemple d'abstraction (AIProvider).

## Statut

Étape 8/37 du cahier des charges : tableau de bord admin (section 12) — 4 endpoints d'analytics agrégés, consommant directement `Report`, `PriorityScore` et les liens `duplicate_of` produits par l'IA (Étapes 6-7).

**4 endpoints, réservés `municipal_admin`/`platform_admin`** :
- `GET /api/v1/analytics/overview/` — compteurs globaux, répartition par statut/gravité/catégorie, temps moyen de résolution
- `GET /api/v1/analytics/districts/` — statistiques par quartier, triées par concentration de signalements critiques actifs (approximation de "zones critiques" à partir de données réelles, pas de source externe de zones sensibles — voir la limite déjà documentée à l'Étape 7)
- `GET /api/v1/analytics/timeline/?days=30` — évolution temporelle des créations/résolutions
- `GET /api/v1/analytics/heatmap/` — points géolocalisés pondérés par score de priorité, pour une carte de chaleur

**Aucune donnée fabriquée** (section 29) : `avg_resolution_hours` vaut `null` tant qu'aucun signalement n'est résolu — jamais un zéro qui laisserait croire à une résolution instantanée. Un quartier sans aucun signalement n'apparaît pas dans `districts/` plutôt que d'afficher des zéros vides.

**Petit refactor au passage** : `IsMunicipalOrPlatformAdmin`, utilisée par `apps.reports` (Étape 3) et maintenant `apps.scoring`, a été déplacée vers `apps/common/permissions.py` — c'était une permission partagée dès le départ, elle vivait juste au mauvais endroit.

176 tests, 99% de couverture, `flake8`/`black` propres, `makemigrations --check` sans changement en attente.


## Endpoints disponibles (Étape 3)

### Auth
- `POST /api/v1/auth/register/` — inscription (impossible de s'auto-créer admin)
- `POST /api/v1/auth/login/` — obtenir access/refresh token JWT
- `POST /api/v1/auth/refresh/` — rafraîchir l'access token
- `GET/PATCH /api/v1/users/me/` — profil de l'utilisateur courant

### Catégories
- `GET /api/v1/categories/` — liste (tout utilisateur authentifié)
- `POST/PATCH/DELETE /api/v1/categories/{id}/` — réservé `platform_admin`

### Signalements
- `GET /api/v1/reports/` — liste avec filtres `?category=`, `?district=`, `?status=`, `?severity=`, `?created_after=`, `?created_before=`, recherche `?search=`, tri `?ordering=`
- `POST /api/v1/reports/` — créer (champs `latitude`/`longitude` requis, construits en `Location`)
- `PATCH /api/v1/reports/{id}/` — modifier le contenu, réservé à l'auteur
- `POST /api/v1/reports/{id}/confirm/` — confirmer le signalement d'un tiers
- `POST /api/v1/reports/{id}/images/` — ajouter une photo (multipart), réservé à l'auteur
- `PATCH /api/v1/reports/{id}/status_update/` — changer le statut, réservé `municipal_admin`/`platform_admin`
- `GET /api/v1/reports/{id}/ai_analyses/` — résultats IA (classification suggérée, résumé, candidats doublons), réservé `municipal_admin`/`platform_admin`

Le champ `priority_score` (score, niveau, explication détaillée par facteur) est inclus dans la représentation de chaque signalement, visible par tout utilisateur authentifié. Filtrage par niveau : `?priority=low|medium|high|critical`. Tri : `?ordering=-priority_score__score`.

### Analytics (Étape 8, réservé `municipal_admin`/`platform_admin`)
- `GET /api/v1/analytics/overview/`
- `GET /api/v1/analytics/districts/`
- `GET /api/v1/analytics/timeline/?days=30`
- `GET /api/v1/analytics/heatmap/`

Documentation interactive complète : `http://localhost:8000/api/docs/`
