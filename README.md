# 🧩 Nuxt Inline + Django — Full CI Setup

Un projet combinant **Nuxt 3 (Frontend statique)** et **Django (Backend / Serveur web)**, avec un workflow GitHub Actions qui assure la cohérence du build et teste automatiquement le rendu final.

---

## 🚀 Structure du projet

```
nuxt-inline-django/
│
├── nuxt-inline/           # Application Nuxt 3
│   ├── .output/public/    # Résultat du build statique (via nuxi generate)
│   └── nuxt.config.ts
│
├── django/
│   ├── app/               # App principale Django
│   │   ├── static/        # Statiques (copie des builds Nuxt)
│   │   └── templates/
│   ├── manage.py
│   ├── requirements.txt
│   └── mysite/settings.py
│
└── .github/workflows/ci.yml  # Pipeline GitHub Actions
```

---

## 🧱 Fonctionnement global

### 1️⃣ Build Nuxt

Le frontend est exporté en statique avec :

```bash
cd nuxt-inline
npx nuxi generate
```

Les fichiers finaux se trouvent dans `.output/public/`.

---

### 2️⃣ Copie vers Django

Les fichiers générés sont copiés dans :

```
django/app/static/nuxt-inline/
```

C’est ce dossier que Django (et WhiteNoise) sert comme contenu statique en production.

---

### 3️⃣ Collecte des statiques

```bash
cd django
export DEV=0
export DEBUG=0
export STATIC_ROOT="$(pwd)/static-collect"
python manage.py collectstatic --noinput --clear
```

Tous les fichiers statiques (CSS, JS, images, Nuxt, etc.) sont alors regroupés dans `static-collect/`.

---

### 4️⃣ Serveur en mode production (local)

Localement, tu peux simuler le mode “prod” avec **WhiteNoise** ou **Gunicorn** :

```bash
cd django
pip install -r requirements.txt
pip install gunicorn whitenoise
export DEV=0
export DEBUG=0
export STATIC_ROOT="$(pwd)/static-collect"
export ALLOWED_HOSTS="127.0.0.1,localhost"
gunicorn mysite.wsgi:application --bind 127.0.0.1:8000
```

---

## 🤖 Workflow GitHub Actions

### 📁 Fichier : `.github/workflows/ci.yml`

Le pipeline CI effectue les étapes suivantes :

1. **Checkout** du repo
2. **Build Nuxt** statique
3. **Copie vers Django** (`rsync`)
4. **Installation Django + collectstatic**
5. **Lancement Gunicorn** (port 8001)
6. **Tests HTTP réels** :

   * Vérifie que la page `/` renvoie du HTML
   * Recherche un `.js` et un `.css` dans le HTML
   * Télécharge les assets pour vérifier les **MIME types**

Si tout se passe bien, le job se termine en succès ✅

---

### 🧠 Extrait clé du test serveur

```yaml
nohup gunicorn mysite.wsgi:application --bind 127.0.0.1:8001 &
for i in $(seq 1 60); do
  if curl -fsS http://127.0.0.1:8001/ >/dev/null; then break; fi
  sleep 0.5
done
curl -fsSL http://127.0.0.1:8001/ -o /tmp/home.html
grep -oE '/static/nuxt-inline/_nuxt/.*\.js' /tmp/home.html | head -n1
```

Le test confirme que Django **sert bien** les fichiers générés par Nuxt.

---

## 🧩 Tag `nuxt.py`

Django utilise un **templatetag personnalisé** (`django/app/templatetags/nuxt.py`) pour injecter dynamiquement les balises `<script>` et `<link>` du build Nuxt dans les templates Django.

* En **DEV**, il utilise le manifest Vite (`.vite/manifest.json`)
* En **PROD**, il lit `index.html` et réécrit toutes les URLs `/_nuxt/` vers `/static/nuxt-inline/_nuxt/`

---

## 🧪 Tester localement (sans GitHub)

### Sous **Git Bash / Linux**

```bash
# Build Nuxt
cd nuxt-inline
npm ci
npx nuxi generate
cd ..

# Copie
rm -rf django/app/static/nuxt-inline
mkdir -p django/app/static/nuxt-inline
cp -r nuxt-inline/.output/public/* django/app/static/nuxt-inline/

# Django collectstatic
cd django
export DEV=0 DEBUG=0 STATIC_ROOT="$(pwd)/static-collect"
python manage.py collectstatic --noinput --clear

# Serveur
pip install gunicorn whitenoise
export ALLOWED_HOSTS="127.0.0.1,localhost"
gunicorn mysite.wsgi:application --bind 127.0.0.1:8000
```

---

## 📦 Environnement requis

| Outil            | Version recommandée |
| ---------------- | ------------------- |
| Node.js          | 20+                 |
| Python           | 3.12                |
| Nuxt             | 3.12+               |
| Django           | 5.0+                |
| Gunicorn         | 22+                 |
| rsync (ou cp -r) | —                   |

---

## ✅ Résultat attendu

Sur l’URL `http://127.0.0.1:8000` (ou via le workflow CI) :

* La page Django affiche le contenu Nuxt exporté.
* Les assets `_nuxt/*.js` et `.css` sont correctement servis depuis `/static/nuxt-inline/`.
* Le MIME type est correct (`application/javascript` / `text/css`).
* Aucune erreur `404` ni `400`.

---

## 🧾 Licence & Auteur

**Projet** : Nuxt Inline + Django Integration
**Auteur** : *[Ton nom / ton org]*
**Licence** : MIT

---

Souhaites-tu que je t’ajoute à la fin du README une section “💡 Déploiement production (Docker + Jenkins)” pour documenter la version serveur ?
