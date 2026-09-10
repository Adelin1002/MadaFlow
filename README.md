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



```bash
docker compose run --rm backend pytest --cov=apps --cov-report=term-missing
docker compose run --rm -e DJANGO_SETTINGS_MODULE=config.settings.test backend pytest --cov=apps --cov-report=term-missing (teste)
```

Suite actuelle : 95 tests, 98% de couverture (auth, permissions par rôle, CRUD signalements, filtres, upload d'images, requêtes géospatiales PostGIS réelles, pipeline IA classification/résumé/doublons). Exécutée et validée contre une vraie base PostgreSQL/PostGIS, pas de mock de la couche géo (le seul mock du projet concerne le client SDK Anthropic — voir Statut ci-dessous).

## Structure

Voir chaque `apps/<domaine>/` : un domaine métier = une app Django autonome (models, urls, views, services, permissions). Pas de logique métier dans les vues — voir `apps/ai_engine/providers/` pour un exemple d'abstraction (AIProvider).

## Statut

Étape 6/37 du cahier des charges : implémentation réelle de l'abstraction `AIProvider` (section 10), branchée sur la création de signalements pour la classification automatique et la détection de doublons (section 9).

**Deux fournisseurs IA** :
- `rule_based` (par défaut) — déterministe, sans coût, sans appel réseau. Classification par mots-clés, résumé par extraction de la première phrase, détection de doublons par similarité textuelle (Jaccard) + proximité géographique. Couvre le besoin MVP "détection **basique**" (section 30). Entièrement testé et exécuté réellement.
- `anthropic` — implémentation réelle utilisant l'API Anthropic pour la Phase 3, écrite et fonctionnelle, mais **jamais appelée en conditions réelles dans cet environnement de génération** (pas de clé API disponible, et il n'était pas question d'en consommer une sans accord explicite). Testée uniquement par mock du client SDK (parsing JSON, gestion d'erreur) — aucun appel réseau réel effectué. **Avant mise en production : teste-la une fois avec une vraie clé sur quelques signalements réels.**

**Un vrai bug d'intégration trouvé et corrigé à cette étape** : `config/celery.py` n'était jamais importé nulle part (oubli depuis l'Étape 2). Résultat : `shared_task` utilisait une app Celery par défaut avec un broker AMQP, ignorant complètement notre configuration Redis/`task_always_eager`. Ce genre de bug ne se voit qu'à l'exécution — corrigé via `config/__init__.py`.

Pipeline (classification + résumé + détection de doublons) déclenché de façon asynchrone à la création d'un signalement (`ReportViewSet.perform_create`), consultable par les admins via `GET /api/v1/reports/{id}/ai_analyses/`. Le champ `duplicate_of` n'est lié automatiquement que si le score dépasse `AI_DUPLICATE_AUTO_LINK_THRESHOLD` (0.85 par défaut) — sinon la suggestion reste consultable sans décision automatique (section 8).

95 tests, 98% de couverture, `flake8`/`black` propres.


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

Documentation interactive complète : `http://localhost:8000/api/docs/`

# DOCKER
## Reconstruire/redémarrer le backend
docker compose build backend
docker compose up -d backend

## DATABASE
## Voir les conteneurs Docker actifs
docker compose ps

## Entrer dans PostgreSQL
docker compose exec db psql -U madaflow -d madaflow

## Voir les bases de données disponibles
\l

## Se connecter à la base MadaFlow
\c madaflow

## Voir toutes les tables
\dt

## Rechercher les tables contenant user
SELECT tablename
FROM pg_tables
WHERE schemaname = 'public'
AND tablename LIKE '%user%';

## Consulter les données
SELECT * FROM users_user;

## SELECT UTILISATEUR ADELIN AVEC LEUR COLONNE
SELECT
    username,
    email,
    user_type,
    is_superuser,
    is_staff,
    is_active
FROM users_user
WHERE username = 'Adelin';

## UPDATE TYPE OU ROLE UTILISATEUR
UPDATE users_user
SET user_type = 'platform_admin'
WHERE username = 'Adelin';
