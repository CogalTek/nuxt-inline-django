# Nuxt Inline (Vuetify) inside Django — Guide d’installation & mise en production

Ce dépôt montre comment **monter des composants Nuxt (Vuetify)** directement dans des templates **Django**, sans iframe.
En **dev**, Nuxt tourne en HMR et Django référence ses scripts.
En **prod**, on build Nuxt puis on **copie les assets** dans `django/app/static/nuxt-inline/` pour que **Django/Nginx** les servent.

---

## 1) Prérequis

* **Docker** + **Docker Compose**
* **Node 18+** (pour builder Nuxt)
* **Python 3.11+** (dans le conteneur Django)
* (Optionnel) **PostgreSQL** si tu déploies avec DB

---

## 2) Arborescence (rappel)

```
repo/
├─ django/
│  └─ app/
│     ├─ static/nuxt-inline/      # ⇐ cible de copie des assets Nuxt (prod)
│     └─ ...                      # settings, urls, templates, etc.
├─ nuxt-inline/                   # projet Nuxt (Vuetify)
├─ docker-compose.yml             # stack dev
├─ nginx.conf                     # base Nginx (prod)
└─ README.md
```

> Dans les templates Django, on place des ancres :
>
> ```html
> <div data-nuxt-component="UserCard" data-props='{"id":123,"size":"sm"}'></div>
> ```
>
> Un script côté client monte le composant Nuxt sur ces ancres.

---

## 3) Démarrage **dev**

1. Lancer la stack :

```bash
docker compose up --build
```

* **Django**: [http://localhost:8000](http://localhost:8000)
* **Nuxt (HMR)**: [http://localhost:3000](http://localhost:3000)

2. Développe côté Nuxt/Django, les templates Django référencent les bundles servis par Nuxt en dev (HMR).

---

## 4) Build **production** (Nuxt ⇒ Django)

> Objectif : builder Nuxt, puis **copier** le contenu client dans `django/app/static/nuxt-inline/`.

1. Build Nuxt :

```bash
cd nuxt-inline
npm ci
npm run build
```

2. Copier les assets générés :

```bash
# La sortie client Nuxt 3 est dans .output/public
rm -rf ..\django\app\static\nuxt-inline
mkdir ..\django\app\static\nuxt-inline
cp .\.output\public\* ..\django\app\static\nuxt-inline
rm -rf .\.output\public\*
```

> Après cette étape, **Django** voit les fichiers sous `app/static/nuxt-inline/` (puis `collectstatic` les déplacera vers `STATIC_ROOT`).

---

## 5) Configuration Django (prod)

Dans `settings.py` (adapter à ton projet) :

```python
import os
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent

SECRET_KEY = os.getenv("SECRET_KEY", "change-me")
DEBUG = os.getenv("DEBUG", "false").lower() == "true"
ALLOWED_HOSTS = os.getenv("ALLOWED_HOSTS", "*").split(",")

STATIC_URL = "/static/"
STATIC_ROOT = BASE_DIR / "staticfiles"    # cible collectstatic
STATICFILES_DIRS = [
	BASE_DIR / "app" / "static",          # contient "nuxt-inline/"
]
```

En prod (dans le conteneur web) :

```bash
python manage.py migrate
python manage.py collectstatic --noinput
```

---

## 6) Servir en **prod** (Gunicorn + Nginx)

### Option A — Docker Compose (recommandé)

Crée un `docker-compose.prod.yml` (exemple minimal) :

```yaml
version: "3.9"

services:
  web:
    build:
      context: .
      dockerfile: django/Dockerfile
    env_file:
      - .env
    depends_on:
      - db
    expose:
      - "8000"
    volumes:
      - static_volume:/app/staticfiles

  nginx:
    image: nginx:1.27-alpine
    depends_on:
      - web
    ports:
      - "80:80"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf:ro
      - static_volume:/app/staticfiles:ro

  db:
    image: postgres:16-alpine
    environment:
      POSTGRES_DB: ${POSTGRES_DB:-app}
      POSTGRES_USER: ${POSTGRES_USER:-app}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD:-app}
    volumes:
      - pgdata:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U $$POSTGRES_USER -d $$POSTGRES_DB"]
      interval: 10s
      timeout: 5s
      retries: 5

volumes:
  static_volume:
  pgdata:
```

**Dockerfile Django** (exemple `django/Dockerfile`) :

```dockerfile
FROM python:3.12-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
	PYTHONUNBUFFERED=1

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
		build-essential curl libpq-dev \
	&& rm -rf /var/lib/apt/lists/*

COPY django/requirements.txt /app/requirements.txt
RUN pip install --no-cache-dir -r /app/requirements.txt

COPY django /app

EXPOSE 8000

CMD ["bash", "-lc", "python manage.py migrate && python manage.py collectstatic --noinput && gunicorn app.wsgi:application --bind 0.0.0.0:8000 --workers 3 --timeout 90"]
```

**nginx.conf** (tu peux réutiliser celui du dépôt en ajustant les chemins) — points clés :

* `location /static/` doit **lire** dans `/app/staticfiles` (monté depuis `web`)
* `location /` fait **proxy_pass** vers `http://web:8000`

**Déploiement :**

```bash
# 1) Build Nuxt + copie vers django/app/static/nuxt-inline/
cd nuxt-inline && npm ci && npm run build
rsync -av --delete .output/public/ ../django/app/static/nuxt-inline/
cd ..

# 2) Lancer la prod
docker compose -f docker-compose.prod.yml up --build -d

# 3) (si tu n’exécutes pas migrate/collectstatic au CMD)
docker compose -f docker-compose.prod.yml exec web python manage.py migrate
docker compose -f docker-compose.prod.yml exec web python manage.py collectstatic --noinput
```

### Option B — Bare-metal (systemd + Nginx)

1. **Gunicorn (systemd)** lance Django sur `127.0.0.1:8000`
2. **Nginx** :

   * `location /static/` → répertoire `STATIC_ROOT` (ex. `/var/www/app/staticfiles`)
   * `location /` → `proxy_pass http://127.0.0.1:8000`

> Le flux Nuxt ne change pas : **build**, **copie** vers `app/static/nuxt-inline/`, puis `collectstatic`.

---

## 7) Variables d’environnement (exemple `.env`)

```env
# Django
SECRET_KEY=change-me
DEBUG=false
ALLOWED_HOSTS=*

# Base de données (si Postgres)
POSTGRES_DB=app
POSTGRES_USER=app
POSTGRES_PASSWORD=app

# Ou via une URL unique :
# DATABASE_URL=postgres://app:app@db:5432/app
```

---

## 8) Check-list production

* [ ] `nuxt-inline/.output/public/_nuxt/...` **existe** après `npm run build`
* [ ] Copie → `django/app/static/nuxt-inline/` **réussie**
* [ ] `collectstatic` **copie** tout vers `STATIC_ROOT` (ex. `/app/staticfiles`)
* [ ] `ALLOWED_HOSTS` **inclut** ton domaine/host
* [ ] Nginx **sert** `/static/nuxt-inline/_nuxt/*.js` (pas de 404)
* [ ] Proxy vers Gunicorn **OK** (pages Django répondent)

---

## 9) Dépannage

* **404 sur** `/static/nuxt-inline/_nuxt/*.js`
  → Build non copié au bon endroit OU `location /static/` mal configuré (root alias). Refaire : build, copie, `collectstatic`, vérifier la conf Nginx.
* **Vuetify: “Failed to resolve component: v-btn”**
  → Le bundle client nuxt n’est pas injecté (dev HMR vs prod), ou le plugin Vuetify n’est pas chargé en prod. Rebuild + vider le cache navigateur.
* **MIME/404 sur assets**
  → Vérifier que le chemin généré par Nuxt correspond bien à `/static/nuxt-inline/…` côté Django/Nginx, et que `collectstatic` a été exécuté après la copie.

---

## 10) Script utilitaire (optionnel)

`tools/build_nuxt_and_copy.sh` :

```bash
#!/usr/bin/env bash
set -euo pipefail

pushd nuxt-inline
npm ci
npm run build
rsync -av --delete .output/public/ ../django/app/static/nuxt-inline/
popd
```

Utilisation :

```bash
bash tools/build_nuxt_and_copy.sh
```

---

## 11) Roadmap CI/CD (aperçu rapide)

* Étape **Build Nuxt** → **Copie** vers `django/app/static/nuxt-inline/`
* Build & push **image web** (Django) et **image Nginx**
* Déploiement via **docker-compose** (App Service “multi-containers”) ou **Container Apps**

*(Ce README se concentre sur l’installation & prod. Le pipeline Azure peut être ajouté ensuite.)*
