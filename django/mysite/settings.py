import os
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent

# --- Modes ---
DEBUG = os.getenv("DEBUG", "1") == "1"
DEV = os.getenv("DEV", "1") == "1"  # DEV par défaut, désactive en prod avec DEV=0
SECRET_KEY = os.getenv("SECRET_KEY", "dev-secret")

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
	"corsheaders.middleware.CorsMiddleware",
	"django.middleware.security.SecurityMiddleware",
	"django.contrib.sessions.middleware.SessionMiddleware",
	"django.middleware.common.CommonMiddleware",
	"django.middleware.csrf.CsrfViewMiddleware",
	"django.contrib.auth.middleware.AuthenticationMiddleware",
	"django.contrib.messages.middleware.MessageMiddleware",
	"django.middleware.clickjacking.XFrameOptionsMiddleware",
]

# après SecurityMiddleware
MIDDLEWARE.insert(1, "whitenoise.middleware.WhiteNoiseMiddleware")
STATICFILES_STORAGE = "whitenoise.storage.CompressedManifestStaticFilesStorage"

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

# ⚠️ Ne pas définir STATICFILES_DIRS et STATIC_ROOT en même temps.
if DEV:
	# Dev: servir directement depuis le dossier source (pas de collectstatic requis)
	STATICFILES_DIRS = [BASE_DIR / "app" / "static"]
else:
	# Prod: collectstatic remplit ce dossier
	STATIC_ROOT = Path(os.getenv("STATIC_ROOT", BASE_DIR / "static-collect"))
	# Optionnel: meilleure gestion des statics (si tu veux tout servir via Django)
	# INSTALLED_APPS += ["whitenoise.runserver_nostatic"]
	# MIDDLEWARE.insert(1, "whitenoise.middleware.WhiteNoiseMiddleware")
	# STATICFILES_STORAGE = "whitenoise.storage.CompressedManifestStaticFilesStorage"

# -----------------------------
# CORS
# -----------------------------
# En dev on peut autoriser large; en prod, configure CORS_ALLOWED_ORIGINS via env
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
	"accept",
	"accept-encoding",
	"authorization",
	"content-type",
	"dnt",
	"origin",
	"user-agent",
	"x-csrftoken",
	"x-requested-with",
]

# -----------------------------
# Assouplissements dev
# -----------------------------
if DEBUG:
	SECURE_CROSS_ORIGIN_OPENER_POLICY = None
	X_FRAME_OPTIONS = "SAMEORIGIN"
