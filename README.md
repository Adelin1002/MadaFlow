# MadaFlow — Backend

Plateforme SaaS géospatiale intelligente pour Madagascar. Architecture **modular monolith** Django REST Framework + PostGIS.

## Démarrage rapide

```bash
cp backend/.env.example backend/.env
# éditer backend/.env : générer une vraie DJANGO_SECRET_KEY

docker compose up -d db redis
docker compose build backend

docker compose run --rm backend python manage.py migrate
docker compose run --rm backend python manage.py loaddata categories_seed
docker compose run --rm backend python manage.py createsuperuser

docker compose up
```

L'API sera disponible sur `http://localhost:8000/api/v1/`, la doc Swagger sur `http://localhost:8000/api/docs/`.

## Tests

```bash
docker compose run --rm backend pytest --cov=apps --cov-report=term-missing
```

Suite actuelle : 59 tests, 95% de couverture (auth, permissions par rôle, CRUD signalements, filtres, upload d'images, requêtes géospatiales PostGIS réelles — proximité `dwithin`, tri par distance, confinement dans un polygone). Exécutée et validée contre une vraie base PostgreSQL/PostGIS, pas de mock de la couche géo.

## Structure

Voir chaque `apps/<domaine>/` : un domaine métier = une app Django autonome (models, urls, views, services, permissions). Pas de logique métier dans les vues — voir `apps/ai_engine/providers/` pour un exemple d'abstraction (AIProvider).

## Statut

Étape 4/37 du cahier des charges : suite de tests automatiques (59 tests, 95% de couverture) sur l'architecture, l'API et les permissions des Étapes 1 à 3 — réellement exécutée contre PostgreSQL/PostGIS, pas seulement écrite. Voir "Tests" ci-dessus.


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

Documentation interactive complète : `http://localhost:8000/api/docs/`
