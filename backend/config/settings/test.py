"""
Settings utilisés uniquement pour l'exécution de la suite de tests.
Même moteur PostGIS que dev/prod (pas de SQLite/SpatiaLite) pour que les
tests géospatiaux couvrent le comportement réel de production.
"""

from .base import *  # noqa: F401,F403

DEBUG = False

# Hashing de mot de passe rapide — accélère fortement la création d'utilisateurs en test.
PASSWORD_HASHERS = ["django.contrib.auth.hashers.MD5PasswordHasher"]

# Pas de vrai broker Redis nécessaire pendant les tests.
CELERY_TASK_ALWAYS_EAGER = True
CELERY_TASK_EAGER_PROPAGATES = True

MEDIA_ROOT = BASE_DIR / "test_media"
