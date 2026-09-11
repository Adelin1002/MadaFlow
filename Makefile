.PHONY: up down build migrate makemigrations test lint format shell logs frontend-test frontend-lint

up:
	docker compose up

down:
	docker compose down

build:
	docker compose build

migrate:
	docker compose run --rm backend python manage.py migrate

makemigrations:
	docker compose run --rm backend python manage.py makemigrations

test:
	docker compose run --rm backend pytest --cov=apps --cov-report=term-missing

lint:
	docker compose run --rm backend flake8 apps config
	docker compose run --rm backend black --check apps config --exclude=migrations

format:
	docker compose run --rm backend black apps config --exclude=migrations

shell:
	docker compose run --rm backend python manage.py shell

logs:
	docker compose logs -f backend

frontend-test:
	docker compose run --rm frontend npm run test

frontend-lint:
	docker compose run --rm frontend npm run typecheck
	docker compose run --rm frontend npm run lint
	docker compose run --rm frontend npm run format:check
