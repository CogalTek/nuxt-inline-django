# 🚀 Setup Guide - Nuxt Inline Django

Guide pas à pas pour créer le projet de zéro. Cochez les cases au fur et à mesure ! ✅

---

## 📋 Prérequis

- [ ] Python 3.11+ installé
- [ ] Node.js 20+ installé
- [ ] Docker & Docker Compose installés (optionnel)
- [ ] Git installé
- [ ] Éditeur de code (VS Code recommandé)

---

## 🏗️ Étape 1 : Structure du projet

### 1.1 Créer le projet

```bash
mkdir nuxt-inline-django
cd nuxt-inline-django
```

- [ ] Dossier principal créé

### 1.2 Structure Django

```bash
mkdir -p django/app/static/nuxt-inline
mkdir -p django/app/templates
mkdir -p django/app/templatetags
mkdir -p django/mysite
```

- [ ] Dossiers Django créés

### 1.3 Structure Nuxt

```bash
mkdir -p nuxt-inline/components
mkdir -p nuxt-inline/plugins
```

- [ ] Dossiers Nuxt créés

---

## 🐍 Étape 2 : Configuration Django

### 2.1 Créer les fichiers de base

- [ ] `django/requirements.txt`
  ```txt
  Django==4.2.15
  django-cors-headers==4.3.1
  whitenoise==6.11.0
  ```

- [ ] `django/manage.py` (copier depuis le README)

- [ ] `django/mysite/__init__.py` (fichier vide)
- [ ] `django/app/__init__.py` (fichier vide)
- [ ] `django/app/templatetags/__init__.py` (fichier vide)

### 2.2 Configuration principale

- [ ] `django/mysite/settings.py` (copier depuis le README)
  - [ ] Vérifier `DEBUG` et `DEV` pour le mode développement
  - [ ] Vérifier `INSTALLED_APPS` (inclut `corsheaders` et `app`)
  - [ ] Vérifier `MIDDLEWARE` (ordre important!)
  - [ ] Vérifier `STATIC_URL` et logique `DEV`
  - [ ] Vérifier `CORS_ALLOW_ALL_ORIGINS = True` en dev

- [ ] `django/mysite/urls.py` (copier depuis le README)

- [ ] `django/mysite/wsgi.py` (copier depuis le README)

### 2.3 Application Django

- [ ] `django/app/views.py` (copier depuis le README)

- [ ] `django/app/templates/base.html` (copier depuis le README)
  - [ ] Vérifier `{% load static %}` et `{% load nuxt %}`
  - [ ] Vérifier `{% nuxt_head 'nuxt-inline' %}`
  - [ ] Vérifier `{% nuxt_mount 'nuxt-inline' %}`

- [ ] `django/app/templatetags/nuxt.py` (copier depuis le fichier existant)
  - ⚠️ **CRUCIAL** : Ce fichier est complexe, le copier intégralement

### 2.4 Docker Django

- [ ] `django/Dockerfile` (copier depuis le README)

---

## 🎨 Étape 3 : Configuration Nuxt

### 3.1 Initialisation npm

```bash
cd nuxt-inline
npm init -y
```

- [ ] `package.json` généré

### 3.2 Fichiers de configuration

- [ ] Remplacer `nuxt-inline/package.json` (copier depuis le README)

- [ ] `nuxt-inline/nuxt.config.ts` (copier depuis le README)
  - [ ] Vérifier `ssr: false`
  - [ ] Vérifier `nitro.preset: 'static'`
  - [ ] Vérifier CORS vers Django (ports 8000)

- [ ] `nuxt-inline/tsconfig.json` (copier depuis le README)

- [ ] `nuxt-inline/app.config.ts` (copier depuis le README)

- [ ] `nuxt-inline/app.vue` (copier depuis le README)

### 3.3 Plugins

- [ ] `nuxt-inline/plugins/01.vuetify.ts` (copier depuis le README)
  - ⚠️ Le "01." est important pour l'ordre de chargement!

- [ ] `nuxt-inline/plugins/multimount.client.ts` (copier depuis le fichier existant)
  - ⚠️ **CRUCIAL** : Gère le montage automatique des composants
  - Le ".client" est important (exécution navigateur uniquement)

### 3.4 Composant exemple

- [ ] `nuxt-inline/components/UserCard.vue` (copier depuis le README)

### 3.5 Docker Nuxt

- [ ] `nuxt-inline/Dockerfile` (copier depuis le README)

---

## 🐳 Étape 4 : Docker Compose

- [ ] `docker-compose.yml` à la racine (copier depuis le README)
  - [ ] Service Django (port 8000)
  - [ ] Service Nuxt (port 3000)
  - [ ] Variables d'environnement `DEBUG=1` et `DEV=1`

---

## ✅ Étape 5 : Installation des dépendances

### 5.1 Avec Docker (recommandé)

```bash
docker-compose build
```

- [ ] Images Docker construites

### 5.2 Sans Docker

**Django :**
```bash
cd django
python -m venv venv
# Windows
venv\Scripts\activate
# Linux/Mac
source venv/bin/activate

pip install -r requirements.txt
```

- [ ] Environnement virtuel Python créé
- [ ] Dépendances Django installées

**Nuxt :**
```bash
cd nuxt-inline
npm install
```

- [ ] Dépendances Node installées
- [ ] `node_modules/` créé

---

## 🚀 Étape 6 : Premier lancement (DEV)

### 6.1 Avec Docker

```bash
docker-compose up
```

- [ ] Django accessible sur http://localhost:8000
- [ ] Nuxt accessible sur http://localhost:3000
- [ ] Pas d'erreurs dans les logs

### 6.2 Sans Docker

**Terminal 1 - Django :**
```bash
cd django
python manage.py migrate
python manage.py runserver
```

- [ ] Migrations appliquées
- [ ] Django tourne sur :8000

**Terminal 2 - Nuxt :**
```bash
cd nuxt-inline
npm run dev
```

- [ ] Nuxt tourne sur :3000
- [ ] HMR actif

### 6.3 Vérifications

- [ ] Ouvrir http://localhost:8000 dans le navigateur
- [ ] Le composant `UserCard` s'affiche
- [ ] Pas d'erreurs dans la console navigateur (F12)
- [ ] Modifier `UserCard.vue` → changement visible instantanément (HMR)

---

## 🏭 Étape 7 : Configuration PROD

### 7.1 Build Nuxt

```bash
cd nuxt-inline
npm run build
```

- [ ] Build réussi
- [ ] Dossier `.output/public/` créé
- [ ] Fichiers dans `.output/public/_nuxt/` présents

### 7.2 Copier les assets

**Windows (PowerShell) :**
```powershell
Copy-Item -Path "nuxt-inline\.output\public\*" -Destination "django\app\static\nuxt-inline\" -Recurse -Force
```

**Linux/Mac :**
```bash
cp -r nuxt-inline/.output/public/* django/app/static/nuxt-inline/
```

- [ ] Fichiers copiés dans `django/app/static/nuxt-inline/`
- [ ] Vérifier `django/app/static/nuxt-inline/_nuxt/` existe

### 7.3 Collectstatic Django

**Windows (PowerShell) :**
```powershell
cd django
$env:DEBUG="0"
$env:DEV="0"
$env:SECRET_KEY="changez-moi-en-production"

python manage.py collectstatic --noinput
```

**Linux/Mac :**
```bash
cd django
export DEBUG=0
export DEV=0
export SECRET_KEY="changez-moi-en-production"

python manage.py collectstatic --noinput
```

- [ ] Fichiers copiés dans `django/static-collect/`
- [ ] `django/static-collect/nuxt-inline/_nuxt/` existe
- [ ] Pas d'erreurs

### 7.4 Tester en mode PROD

```bash
python manage.py runserver
```

- [ ] Ouvrir http://localhost:8000
- [ ] Composants fonctionnent
- [ ] Inspecter les sources (F12) : les chemins pointent vers `/static/nuxt-inline/_nuxt/`
- [ ] Pas d'erreurs 404 dans l'onglet Network

---

## 🔧 Étape 8 : Configuration production réelle

### 8.1 Variables d'environnement

Créer un fichier `.env` ou configurer les variables :

```bash
DEBUG=0
DEV=0
SECRET_KEY="générer-une-clé-secrète-forte"
ALLOWED_HOSTS="votre-domaine.com,www.votre-domaine.com"
STATIC_ROOT="/var/www/static"
```

- [ ] Variables configurées
- [ ] `SECRET_KEY` changée (utiliser `python -c "from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())"`)
- [ ] `ALLOWED_HOSTS` configuré pour votre domaine

### 8.2 Gunicorn (serveur WSGI)

```bash
pip install gunicorn
gunicorn mysite.wsgi:application --bind 0.0.0.0:8000
```

- [ ] Gunicorn installé
- [ ] Application démarre avec Gunicorn

### 8.3 Nginx (optionnel)

- [ ] Nginx installé
- [ ] Configuration nginx créée (voir README)
- [ ] Nginx redémarre sans erreur
- [ ] Site accessible via Nginx

---

## 🎯 Étape 9 : Créer vos composants

### 9.1 Nouveau composant

Créer `nuxt-inline/components/MonComposant.vue` :

```vue
<template>
  <v-card>
    <v-card-title>{{ title }}</v-card-title>
    <v-card-text>{{ content }}</v-card-text>
  </v-card>
</template>

<script setup lang="ts">
const props = defineProps<{
  title: string
  content?: string
}>()
</script>
```

- [ ] Composant créé

### 9.2 Utiliser dans Django

Dans un template Django :

```html
<MonComposant :title="'Bonjour'" :content="'Mon contenu'"></MonComposant>
```

ou

```html
<div data-nuxt-component="MonComposant" data-props='{"title":"Bonjour","content":"Mon contenu"}'></div>
```

- [ ] Composant utilisé dans Django
- [ ] Composant s'affiche correctement
- [ ] Props fonctionnent

---

## 🧪 Étape 10 : Tests et validation

### 10.1 Mode DEV

- [ ] HMR fonctionne (modifications → rechargement automatique)
- [ ] Composants Vuetify fonctionnent (boutons, cards, etc.)
- [ ] Props dynamiques fonctionnent
- [ ] Console navigateur sans erreurs
- [ ] CORS fonctionne (pas d'erreurs cross-origin)

### 10.2 Mode PROD

- [ ] Build Nuxt réussi
- [ ] Collectstatic réussi
- [ ] Assets servis avec hash (versionning)
- [ ] Composants fonctionnent identique à DEV
- [ ] Pas d'erreurs 404 sur les assets
- [ ] Performance (Network tab : fichiers minifiés et compressés)

### 10.3 Compatibilité navigateurs

- [ ] Chrome/Edge
- [ ] Firefox
- [ ] Safari

---

## 📝 Étape 11 : Scripts de déploiement (optionnel)

### 11.1 Script Windows

Créer `deploy.ps1` (copier depuis le README)

- [ ] Script créé
- [ ] Testé et fonctionne

### 11.2 Script Linux/Mac

Créer `deploy.sh` (copier depuis le README)

```bash
chmod +x deploy.sh
```

- [ ] Script créé
- [ ] Rendu exécutable
- [ ] Testé et fonctionne

---

## 🎓 Étape 12 : Comprendre le flux

### 12.1 Mode DEV

```
Navigateur → Django:8000 → Template avec {% nuxt_head %}
                          → nuxt.py lit le manifest Vite
                          → Génère <script src="http://localhost:3000/_nuxt/...">
Navigateur → Charge depuis Nuxt:3000
          → HMR WebSocket actif
          → multimount.client.ts détecte et monte les composants
```

- [ ] Flux DEV compris

### 12.2 Mode PROD

```
Navigateur → Django:8000 → Template avec {% nuxt_head %}
                          → nuxt.py lit index.html buildé
                          → Réécrit /_nuxt/ → /static/nuxt-inline/_nuxt/
                          → Génère <script src="/static/nuxt-inline/_nuxt/entry.xyz.js">
Navigateur → Charge depuis Django (WhiteNoise sert les statics)
          → multimount.client.ts détecte et monte les composants
```

- [ ] Flux PROD compris

---

## ✅ Checklist finale

### Développement
- [ ] Projet cloné/créé
- [ ] Dépendances installées (Python + Node)
- [ ] Docker Compose fonctionne OU les deux serveurs tournent manuellement
- [ ] http://localhost:8000 affiche la page avec composants
- [ ] HMR fonctionne (modification de composant → rechargement)
- [ ] Pas d'erreurs dans la console

### Production
- [ ] Build Nuxt réussi (`.output/public/` existe)
- [ ] Assets copiés dans Django
- [ ] Collectstatic exécuté
- [ ] Variables d'environnement configurées (`DEV=0`, `DEBUG=0`)
- [ ] Application tourne avec Gunicorn
- [ ] Nginx configuré (si applicable)
- [ ] Domaine configuré avec SSL (si applicable)

### Composants
- [ ] Au moins un composant custom créé
- [ ] Composant utilisé dans Django avec les 2 syntaxes
- [ ] Props fonctionnent
- [ ] Événements fonctionnent (si applicable)
- [ ] Vuetify fonctionne (icons, theming)

---

## 🆘 Dépannage rapide

### Problème : Composants ne se montent pas

- [ ] Console navigateur → erreurs ?
- [ ] Onglet Network → fichiers chargés ?
- [ ] `multimount.client.ts` bien présent ?
- [ ] Mode DEV : Nuxt tourne sur :3000 ?
- [ ] Mode PROD : Assets dans `static-collect/` ?

### Problème : Erreurs CORS en DEV

- [ ] `CORS_ALLOW_ALL_ORIGINS = True` dans settings.py ?
- [ ] Vite CORS configuré dans nuxt.config.ts ?
- [ ] Ports corrects (8000 et 3000) ?

### Problème : 404 sur assets en PROD

- [ ] `DEV=0` bien configuré ?
- [ ] Collectstatic exécuté ?
- [ ] Chemins dans le HTML = `/static/nuxt-inline/_nuxt/...` ?
- [ ] Fichiers présents dans `static-collect/nuxt-inline/_nuxt/` ?

### Problème : HMR ne fonctionne pas

- [ ] Nuxt tourne bien sur :3000 ?
- [ ] WebSocket fonctionne ? (vérifier onglet Network → WS)
- [ ] Pare-feu bloque le port 3000 ?

---

## 🎉 Projet terminé !

Félicitations ! Vous avez maintenant un projet Django + Nuxt 3 fonctionnel.

**Prochaines étapes :**
- [ ] Ajouter plus de composants
- [ ] Créer des pages Django complexes
- [ ] Ajouter une base de données
- [ ] Configurer CI/CD
- [ ] Ajouter des tests

**Ressources :**
- README.md (documentation complète)
- [Django Docs](https://docs.djangoproject.com/)
- [Nuxt 3 Docs](https://nuxt.com/)
- [Vuetify 3 Docs](https://vuetifyjs.com/)

---

**Bon développement ! 🚀**
