# Nuxt Inline Django

🚀 **Projet d'intégration de composants Nuxt 3 (Vue.js) dans Django**

Ce projet permet d'afficher des composants Vue.js/Nuxt directement dans des templates Django, avec support du développement (HMR) et de la production (build statique optimisé).

---

## 📋 Table des matières

- [Vue d'ensemble](#-vue-densemble)
- [Architecture](#-architecture)
- [Prérequis](#-prérequis)
- [Installation complète](#-installation-complète)
  - [1. Structure du projet](#1-structure-du-projet)
  - [2. Configuration Django](#2-configuration-django)
  - [3. Configuration Nuxt](#3-configuration-nuxt)
  - [4. Configuration Docker](#4-configuration-docker)
- [Développement](#-développement)
- [Production](#-production)
- [Utilisation des composants](#-utilisation-des-composants)
- [Déploiement](#-déploiement)

---

## 🎯 Vue d'ensemble

Ce projet combine :
- **Django 4.2** : Framework backend Python
- **Nuxt 3** : Framework frontend Vue.js avec SSR/SSG
- **Vuetify 3** : Bibliothèque de composants Material Design
- **Docker** : Conteneurisation pour dev et production

**Fonctionnalités principales :**
- ✅ Montage automatique de composants Vue dans Django
- ✅ Hot Module Replacement (HMR) en développement
- ✅ Build optimisé pour la production
- ✅ Support des props et attributs Vue
- ✅ CORS configuré pour le développement
- ✅ WhiteNoise pour servir les fichiers statiques

---

## 🏗️ Architecture

### Mode Développement
```
┌─────────────┐         ┌──────────────┐
│   Django    │ ←──────→│    Nuxt      │
│   :8000     │  Proxy  │    :3000     │
│             │  /_nuxt │  (Vite HMR)  │
└─────────────┘         └──────────────┘
```

### Mode Production
```
┌─────────────────────────────────┐
│          Django :8000           │
│                                 │
│  Templates + Nuxt Static Build  │
│  (/static/nuxt-inline/)         │
└─────────────────────────────────┘
```

---

## 🔧 Prérequis

- **Python 3.11+**
- **Node.js 20+**
- **Docker & Docker Compose** (optionnel mais recommandé)
- **Git**

---

## 📦 Installation complète

### 1. Structure du projet

Créez la structure de base :

```bash
mkdir nuxt-inline-django
cd nuxt-inline-django

# Structure des dossiers
mkdir -p django/app/static/nuxt-inline
mkdir -p django/app/templates
mkdir -p django/app/templatetags
mkdir -p django/mysite
mkdir -p nuxt-inline/components
mkdir -p nuxt-inline/plugins
```

---

### 2. Configuration Django

#### 2.1. Fichiers de base

**`django/requirements.txt`**
```txt
Django==4.2.15
django-cors-headers==4.3.1
whitenoise==6.11.0
```

**`django/manage.py`**
```python
#!/usr/bin/env python
"""Django's command-line utility for administrative tasks."""
import os
import sys

def main():
    """Run administrative tasks."""
    os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'mysite.settings')
    try:
        from django.core.management import execute_from_command_line
    except ImportError as exc:
        raise ImportError(
            "Couldn't import Django. Are you sure it's installed and "
            "available on your PYTHONPATH environment variable? Did you "
            "forget to activate a virtual environment?"
        ) from exc
    execute_from_command_line(sys.argv)

if __name__ == '__main__':
    main()
```

#### 2.2. Configuration (`django/mysite/settings.py`)

```python
import os
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent

# --- Modes ---
DEBUG = os.getenv("DEBUG", "1") == "1"
DEV = os.getenv("DEV", "1") == "1"  # DEV par défaut, désactive en prod avec DEV=0
SECRET_KEY = os.getenv("SECRET_KEY", "dev-secret-key-change-in-production")

# Hosts
if DEV or DEBUG:
    ALLOWED_HOSTS = ["*"]
else:
    ALLOWED_HOSTS = os.getenv("ALLOWED_HOSTS", "").split(",") if os.getenv("ALLOWED_HOSTS") else ["localhost"]

INSTALLED_APPS = [
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
    "corsheaders",
    "app",
]

MIDDLEWARE = [
    "corsheaders.middleware.CorsMiddleware",  # En premier pour gérer CORS
    "django.middleware.security.SecurityMiddleware",
    "whitenoise.middleware.WhiteNoiseMiddleware",  # Juste après Security pour servir les statics
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
]

ROOT_URLCONF = "mysite.urls"

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [BASE_DIR / "app" / "templates"],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.debug",
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ]
        },
    }
]

WSGI_APPLICATION = "mysite.wsgi.application"

DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.sqlite3",
        "NAME": BASE_DIR / "db.sqlite3",
    }
}

# -----------------------------
# Static files
# -----------------------------
STATIC_URL = "/static/"

# ⚠️ IMPORTANT : Ne jamais définir STATICFILES_DIRS et STATIC_ROOT ensemble
if DEV:
    # Dev: servir directement depuis le dossier source (pas de collectstatic)
    STATICFILES_DIRS = [BASE_DIR / "app" / "static"]
else:
    # Prod: collectstatic copie tous les fichiers ici
    STATIC_ROOT = Path(os.getenv("STATIC_ROOT", BASE_DIR / "static-collect"))
    # WhiteNoise : compression + cache avec hash des fichiers
    STATICFILES_STORAGE = "whitenoise.storage.CompressedManifestStaticFilesStorage"

# -----------------------------
# CORS
# -----------------------------
if DEV or DEBUG:
    CORS_ALLOW_ALL_ORIGINS = True
else:
    CORS_ALLOW_ALL_ORIGINS = False

CORS_ALLOWED_ORIGINS = list(filter(None, [
    os.getenv("CORS_ORIGIN_1", "http://localhost:3000"),
    os.getenv("CORS_ORIGIN_2", "http://127.0.0.1:3000"),
]))

CORS_ALLOW_CREDENTIALS = True
CORS_ALLOWED_HEADERS = [
    "accept", "accept-encoding", "authorization", "content-type",
    "dnt", "origin", "user-agent", "x-csrftoken", "x-requested-with",
]

# Assouplissements dev
if DEBUG:
    SECURE_CROSS_ORIGIN_OPENER_POLICY = None
    X_FRAME_OPTIONS = "SAMEORIGIN"
```

#### 2.3. URLs (`django/mysite/urls.py`)

```python
from django.contrib import admin
from django.urls import path
from app.views import home

urlpatterns = [
    path("admin/", admin.site.urls),
    path("", home, name="home"),
]
```

#### 2.4. WSGI (`django/mysite/wsgi.py`)

```python
import os
from django.core.wsgi import get_wsgi_application

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'mysite.settings')
application = get_wsgi_application()
```

#### 2.5. Fichiers `__init__.py`

```bash
# Créer les fichiers vides
touch django/mysite/__init__.py
touch django/app/__init__.py
touch django/app/templatetags/__init__.py
```

#### 2.6. Views (`django/app/views.py`)

```python
from django.shortcuts import render
from django.conf import settings

def home(request):
    return render(request, "base.html", {
        "dev": settings.DEV
    })
```

#### 2.7. Template Tag Nuxt (`django/app/templatetags/nuxt.py`)

> 💡 **Pourquoi un template tag custom ?** Django ne sait pas nativement comment charger les assets Nuxt. Ce template tag fait le pont entre les deux mondes.

Ce fichier est crucial - il gère l'injection intelligente des composants Nuxt selon l'environnement.

**Fonctionnement :**

**En DEV (`DEV=1`)** :
- 🔍 Lit le manifest Vite (`.vite/manifest.json`)
- 🔗 Génère les balises `<link>` et `<script>` pointant vers le serveur Nuxt (:3000)
- ⚡ Active le Hot Module Replacement (HMR)

**En PROD (`DEV=0`)** :
- 📄 Extrait les balises depuis `index.html` généré par le build
- 🔄 Réécrit tous les chemins `/_nuxt/` → `/static/nuxt-inline/_nuxt/`
- 📦 Sert les assets statiques (optimisés, hashés, compressés)

**Balises générées :**
- `{% nuxt_head %}` : CSS, preloads, scripts d'entrée, importmap
- `{% nuxt_mount %}` : Divs de montage (`#__nuxt`, `#teleports`), payload JSON, config window

Copiez le contenu complet depuis le fichier existant (trop long pour être inclus ici).

#### 2.8. Template de base (`django/app/templates/base.html`)

```html
{% load static %}
{% load nuxt %}
<!doctype html>
<html lang="fr">
<head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>{% block title %}Nuxt inline + Django{% endblock %}</title>

    {% block head %}{% endblock %}

    {# Injecte automatiquement les balises Nuxt (prod ou dev) #}
    {% nuxt_head 'nuxt-inline' %}
</head>

<body>
    <header>
        {% block header %}{% endblock %}
    </header>

    <main>
        {% block content %}{% endblock %}

        <!-- Exemples de montage de composants -->
        <div data-nuxt-component="UserCard" data-props='{"id":123,"size":"sm"}'></div>
        
        <!-- Syntaxe alternative (Vue-like) -->
        <UserCard :id="456" :size="'md'"></UserCard>
    </main>

    {# Injecte les divs et scripts d'initialisation Nuxt #}
    {% nuxt_mount 'nuxt-inline' %}

    {% block scripts %}{% endblock %}
</body>
</html>
```

---

### 3. Configuration Nuxt

#### 3.1. Package.json (`nuxt-inline/package.json`)

```json
{
    "name": "nuxt-inline",
    "private": true,
    "type": "module",
    "scripts": {
        "dev": "nuxi dev --port 3000 --host 0.0.0.0",
        "build": "nuxi build && nuxi generate"
    },
    "dependencies": {
        "@mdi/font": "^7.4.47",
        "sass-loader": "^16.0.5",
        "vue": "^3.4.0",
        "vuetify": "^3.10.3"
    },
    "devDependencies": {
        "@vitejs/plugin-vue": "^5.0.4",
        "nuxi": "^3.12.0",
        "nuxt": "^3.12.0",
        "sass": "^1.93.2",
        "typescript": "^5.4.0"
    }
}
```

#### 3.2. Configuration Nuxt (`nuxt-inline/nuxt.config.ts`)

```typescript
export default defineNuxtConfig({
    compatibilityDate: '2025-07-15',
    ssr: false,  // ⚠️ CRUCIAL : désactive SSR, on génère du statique pour Django
    app: {
        baseURL: '/',
    },
    experimental: {
        appManifest: true  // Génère le manifest pour le template tag
    },
    components: [
        // pathPrefix: false → composants accessibles sans préfixe de dossier
        { path: '~/components', pathPrefix: false },
    ],

    css: [
        'vuetify/styles',
        '@mdi/font/css/materialdesignicons.css',
    ],

    build: {
        transpile: ['vuetify'],  // Nécessaire pour Vuetify 3 avec Nuxt
    },

    nitro: {
        preset: 'static'  // Génère des fichiers statiques (pas de serveur Node en prod)
    },
    devServer: {
        host: '0.0.0.0',  // Accessible depuis Docker
        port: 3000,
    },
    vite: {
        server: {
            port: 3000,
            host: '0.0.0.0',  // Accessible depuis l'extérieur du container
            hmr: {
                protocol: 'ws',  // WebSocket pour le Hot Module Replacement
                host: 'localhost',
                port: 3000
            },
            cors: {
                // Autorise Django (8000) à charger les assets Nuxt (3000) en dev
                origin: ['http://localhost:8000', 'http://127.0.0.1:8000'],
                credentials: true,
                methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
                allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
            },
        },
        vue: {
            template: {
                compilerOptions: {
                    isCustomElement: (tag) => false,
                }
            }
        },
        ssr: {
            noExternal: ['vuetify'],  // Force l'inclusion de Vuetify dans le bundle
        },
        optimizeDeps: {
            exclude: ['vuetify'],  // Évite les conflits de pré-bundling
        },
    },
})
```

#### 3.3. TypeScript config (`nuxt-inline/tsconfig.json`)

```json
{
  "extends": "./.nuxt/tsconfig.json",
  "compilerOptions": {
    "strict": true,
    "types": ["vuetify"]
  }
}
```

#### 3.4. App config (`nuxt-inline/app.config.ts`)

```typescript
export default defineAppConfig({
  // Configuration de l'application
})
```

#### 3.5. Root component (`nuxt-inline/app.vue`)

```vue
<template>
  <div>
    <NuxtPage />
  </div>
</template>
```

#### 3.6. Plugin Vuetify (`nuxt-inline/plugins/01.vuetify.ts`)

> 💡 **Pourquoi "01." ?** Les plugins Nuxt sont chargés par ordre alphabétique. Le préfixe "01." garantit que Vuetify est initialisé **avant** le plugin multimount (qui en dépend pour monter les composants).

```typescript
import { createVuetify } from 'vuetify'
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'

export const vuetify = createVuetify({
    components,
    directives,
    theme: {
        defaultTheme: 'light',
    },
})

export default defineNuxtPlugin((nuxtApp) => {
    nuxtApp.vueApp.use(vuetify)
})
```

> 📝 **Note** : Ce plugin est exporté (`export const vuetify`) pour être réutilisé dans `multimount.client.ts`.

#### 3.7. Plugin Multi-mount (`nuxt-inline/plugins/multimount.client.ts`)

> 💡 **Pourquoi ".client" ?** Le suffixe `.client.ts` indique à Nuxt d'exécuter ce plugin **uniquement côté navigateur** (pas côté serveur). Essentiel car il manipule le DOM.

Ce plugin gère le montage automatique et l'exposition globale des composants.

**Fonctionnalités :**
- ✅ **Auto-découverte** : Détecte automatiquement les composants dans le DOM
- ✅ **Multi-syntaxe** : Supporte `data-nuxt-component` et les balises Vue-like (`<UserCard>`)
- ✅ **Props intelligentes** : Parse automatiquement les attributs HTML (`:id="123"`, `size="sm"`, etc.)
- ✅ **Intégration Vuetify** : Monte les composants avec l'instance Vuetify configurée
- ✅ **Exposition globale** : Rend les composants accessibles via `window.NUXT_INLINE_COMPONENTS` (utile pour debug)
- ✅ **Chargement dynamique** : Utilise `import.meta.glob` pour charger les composants à la demande (lazy loading)

**Pourquoi `import.meta.glob` ?**
- ✅ Chargement lazy (performance optimale)
- ✅ Pas besoin d'importer manuellement chaque composant
- ✅ Nouveaux composants détectés automatiquement

Le contenu complet est disponible dans le fichier existant du projet.

#### 3.8. Exemple de composant (`nuxt-inline/components/UserCard.vue`)

```vue
<template>
    <v-card class="mx-auto" :max-width="size === 'sm' ? 300 : 400">
        <v-card-title>
            <v-icon class="me-2">mdi-account</v-icon>
            User Profile
        </v-card-title>
        <v-card-text>
            <div class="text-h6 mb-2">User ID: {{ id }}</div>
            <div class="text-body-1">Size: {{ size }}</div>
            <v-btn @click="loadMore" :loading="loading" color="primary" class="mt-3">
                {{ loading ? "Loading..." : "Load More Info" }}
            </v-btn>
            <div v-if="extraInfo" class="mt-3 pa-2 bg-grey-lighten-4 rounded">
                <strong>Extra Info:</strong> Component successfully mounted via Django!
            </div>
        </v-card-text>
    </v-card>
</template>

<script setup lang="ts">
import { ref } from "vue";

const props = defineProps<{
    id: number;
    size?: "sm" | "md" | "lg";
}>();

const loading = ref(false);
const extraInfo = ref(false);

const loadMore = async () => {
    loading.value = true;
    await new Promise((resolve) => setTimeout(resolve, 1000));
    loading.value = false;
    extraInfo.value = true;
};
</script>
```

---

### 4. Configuration Docker

#### 4.1. Dockerfile Django (`django/Dockerfile`)

```dockerfile
FROM python:3.11-slim

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . /app

EXPOSE 8000
CMD ["python", "manage.py", "runserver", "0.0.0.0:8000"]
```

#### 4.2. Dockerfile Nuxt (`nuxt-inline/Dockerfile`)

```dockerfile
FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . ./

EXPOSE 3000
CMD ["npx", "nuxi", "dev", "--port", "3000", "--host", "0.0.0.0"]
```

#### 4.3. Docker Compose (`docker-compose.yml`)

```yaml
version: "3.9"
services:
    django:
        build: ./django
        expose:
            - "8000"
        ports:
            - "8000:8000"
        environment:
            - DEBUG=1
            - DEV=1
        volumes:
            - ./django:/app
        command: python manage.py runserver 0.0.0.0:8000

    nuxt:
        build: ./nuxt-inline
        expose:
            - "3000"
        ports:
            - "3000:3000"
        environment:
            - NODE_ENV=development
        volumes:
            - ./nuxt-inline:/app
            - /app/node_modules
        command: npx nuxi dev --port 3000 --host 0.0.0.0
```

---

## 🚀 Développement

### Avec Docker (recommandé)

```bash
# Lancer tous les services
docker-compose up --build

# Accès :
# - Django : http://localhost:8000
# - Nuxt (HMR) : http://localhost:3000
```

### Sans Docker

**Terminal 1 - Django :**
```bash
cd django
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver
```

**Terminal 2 - Nuxt :**
```bash
cd nuxt-inline
npm install
npm run dev
```

### Workflow de développement

1. **Créer un nouveau composant** : `nuxt-inline/components/MonComposant.vue`
2. **L'utiliser dans Django** :
   ```html
   <MonComposant :prop1="'valeur'" :prop2="123"></MonComposant>
   ```
3. **Hot reload automatique** : Les modifications sont immédiatement visibles

---

## 🏭 Production

### Étape 1 : Build Nuxt

```bash
cd nuxt-inline
npm install
npm run build

# Génère : .output/public/
```

### Étape 2 : Copier les fichiers buildés

```bash
# Depuis la racine du projet
cp -r nuxt-inline/.output/public/* django/app/static/nuxt-inline/
```

**Windows (PowerShell) :**
```powershell
Copy-Item -Path "nuxt-inline\.output\public\*" -Destination "django\app\static\nuxt-inline\" -Recurse -Force
```

### Étape 3 : Collectstatic Django

```bash
cd django

# Configurer les variables d'environnement
export DEBUG=0
export DEV=0
export SECRET_KEY="votre-secret-key-production"

# Collecter les fichiers statiques
python manage.py collectstatic --noinput

# Migrations
python manage.py migrate
```

**Windows (PowerShell) :**
```powershell
$env:DEBUG="0"
$env:DEV="0"
$env:SECRET_KEY="votre-secret-key-production"

python manage.py collectstatic --noinput
python manage.py migrate
```

### Étape 4 : Lancer en production

```bash
# Avec Gunicorn (recommandé)
pip install gunicorn
gunicorn mysite.wsgi:application --bind 0.0.0.0:8000

# Ou avec le serveur Django (dev uniquement)
python manage.py runserver 0.0.0.0:8000
```

### Script de déploiement automatisé

**`deploy.sh` (Linux/Mac) :**
```bash
#!/bin/bash
set -e

echo "🏗️  Building Nuxt..."
cd nuxt-inline
npm install
npm run build

echo "📦 Copying static files..."
cd ..
cp -r nuxt-inline/.output/public/* django/app/static/nuxt-inline/

echo "🔧 Configuring Django..."
cd django
export DEBUG=0
export DEV=0

echo "📊 Collecting static files..."
python manage.py collectstatic --noinput

echo "🗄️  Running migrations..."
python manage.py migrate

echo "✅ Deployment ready!"
echo "Run: gunicorn mysite.wsgi:application --bind 0.0.0.0:8000"
```

**`deploy.ps1` (Windows PowerShell) :**
```powershell
Write-Host "🏗️  Building Nuxt..." -ForegroundColor Green
Set-Location nuxt-inline
npm install
npm run build

Write-Host "📦 Copying static files..." -ForegroundColor Green
Set-Location ..
Copy-Item -Path "nuxt-inline\.output\public\*" -Destination "django\app\static\nuxt-inline\" -Recurse -Force

Write-Host "🔧 Configuring Django..." -ForegroundColor Green
Set-Location django
$env:DEBUG="0"
$env:DEV="0"

Write-Host "📊 Collecting static files..." -ForegroundColor Green
python manage.py collectstatic --noinput

Write-Host "🗄️  Running migrations..." -ForegroundColor Green
python manage.py migrate

Write-Host "✅ Deployment ready!" -ForegroundColor Green
Write-Host "Run: gunicorn mysite.wsgi:application --bind 0.0.0.0:8000"
```

---

## 💡 Utilisation des composants

### Syntaxe 1 : Attribut data (compatible partout)

```html
<div 
    data-nuxt-component="UserCard" 
    data-props='{"id": 123, "size": "sm"}'>
</div>
```

### Syntaxe 2 : Vue-like (plus naturel)

```html
<UserCard :id="123" :size="'md'"></UserCard>
```

### Syntaxe 3 : Attributs mixtes

```html
<UserCard :id="456" size="lg" :active="true"></UserCard>
```

### Props supportées

- **Nombres** : `:id="123"` ou `id="123"`
- **Strings** : `:name="'John'"` ou `name="John"`
- **Booleans** : `:active="true"` ou `active="true"`
- **Objects/Arrays** : `:config='{"key": "value"}'`

---

## 🌐 Déploiement

### Avec Nginx (production)

**`nginx.conf` :**
```nginx
server {
    listen 80;
    server_name votre-domaine.com;

    client_max_body_size 100M;

    # Static files
    location /static/ {
        alias /chemin/vers/django/static-collect/;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Django application
    location / {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### Variables d'environnement production

```bash
export DEBUG=0
export DEV=0
export SECRET_KEY="changez-moi-en-production"
export ALLOWED_HOSTS="votre-domaine.com,www.votre-domaine.com"
export STATIC_ROOT="/var/www/static"
```

---

## 🔍 Debugging

### Script de debug (`debug_nuxt_build.sh`)

```bash
#!/bin/bash
echo "🔍 Analysing Nuxt build output..."
cd nuxt-inline

if [ ! -d ".output" ]; then
    echo "Building Nuxt..."
    npm run build
fi

echo "📁 Structure de .output/public/ :"
find .output/public/ -type f | head -20

echo "📄 Fichiers HTML :"
find .output/public/ -name "*.html"

echo "📄 Fichiers JS :"
find .output/public/ -name "*.js"

echo "📄 Contenu de index.html :"
cat .output/public/index.html
```

### Vérifications courantes

**Vérifier que le build Nuxt est complet :**
```bash
ls -la nuxt-inline/.output/public/_nuxt/
```

**Vérifier que les fichiers sont copiés :**
```bash
ls -la django/app/static/nuxt-inline/_nuxt/
```

**Vérifier collectstatic :**
```bash
ls -la django/static-collect/nuxt-inline/_nuxt/
```

---

## 📚 Structure finale du projet

```
nuxt-inline-django/
├── django/
│   ├── app/
│   │   ├── static/
│   │   │   └── nuxt-inline/          # Build Nuxt copié ici
│   │   │       ├── index.html
│   │   │       ├── 200.html
│   │   │       └── _nuxt/
│   │   ├── templates/
│   │   │   └── base.html
│   │   ├── templatetags/
│   │   │   ├── __init__.py
│   │   │   └── nuxt.py              # Template tag crucial
│   │   ├── __init__.py
│   │   └── views.py
│   ├── mysite/
│   │   ├── __init__.py
│   │   ├── settings.py              # Config DEV/PROD
│   │   ├── urls.py
│   │   └── wsgi.py
│   ├── static-collect/               # Généré par collectstatic (prod)
│   ├── Dockerfile
│   ├── manage.py
│   └── requirements.txt
├── nuxt-inline/
│   ├── components/
│   │   └── UserCard.vue
│   ├── plugins/
│   │   ├── 01.vuetify.ts
│   │   └── multimount.client.ts     # Montage automatique + exposition globale
│   ├── .output/                      # Généré par npm run build
│   │   └── public/
│   ├── app.config.ts
│   ├── app.vue
│   ├── Dockerfile
│   ├── nuxt.config.ts
│   ├── package.json
│   └── tsconfig.json
├── docker-compose.yml
└── README.md
```

---

## 🎓 Concepts clés

### Mode DEV vs PROD

| Aspect | DEV (`DEV=1`) | PROD (`DEV=0`) |
|--------|---------------|----------------|
| **Nuxt** | Serveur Vite (HMR) | Build statique |
| **Assets** | Proxy vers :3000 | Servis par Django |
| **STATICFILES_DIRS** | ✅ Utilisé | ❌ Désactivé |
| **STATIC_ROOT** | ❌ Non défini | ✅ collectstatic |
| **Template tag** | Lit manifest Vite | Lit index.html |

### Flux de données

1. **Django** génère le HTML avec `{% nuxt_head %}` et `{% nuxt_mount %}`
2. **multimount.client.ts** détecte les composants dans le DOM
3. Les composants sont **montés dynamiquement** avec leurs props
4. **Vuetify** fournit les composants UI

---

## 🤝 Contribution

1. Fork le projet
2. Créer une branche (`git checkout -b feature/AmazingFeature`)
3. Commit (`git commit -m 'Add AmazingFeature'`)
4. Push (`git push origin feature/AmazingFeature`)
5. Ouvrir une Pull Request

---

## 📝 License

Ce projet est sous licence MIT.

---

## 🆘 Support

Pour toute question ou problème :
- Vérifiez que `DEV=1` en développement et `DEV=0` en production
- Vérifiez que le build Nuxt est complet
- Vérifiez les logs du navigateur (Console + Network)
- Vérifiez que CORS est bien configuré

**Checklist de dépannage :**
- [ ] `npm run build` a réussi
- [ ] Les fichiers sont dans `.output/public/`
- [ ] Les fichiers sont copiés dans `django/app/static/nuxt-inline/`
- [ ] `collectstatic` a été exécuté (prod)
- [ ] Les variables d'environnement sont correctes
- [ ] Le template tag `nuxt.py` est chargé

---

**Créé avec ❤️ - Django + Nuxt 3 + Vuetify**
