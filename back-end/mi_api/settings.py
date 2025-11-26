"""
Django settings for mi_api project.
"""

import os
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent

SECRET_KEY = 'django-insecure-uw4m&_u@9_kehx!ptc=hnuzbm2tjlf1*s-7qfp*i!gsc3sfz5b'
DEBUG = True

ALLOWED_HOSTS = ["*"]

CSRF_TRUSTED_ORIGINS = [
    "http://54.234.221.254",
    "http://54.234.221.254:8000",
]

# ======================================================
# CORS (para que el frontend pueda consumir el backend)
# ======================================================
CORS_ALLOW_ALL_ORIGINS = True
CORS_ALLOW_CREDENTIALS = True

# ======================================================
# APPS
# ======================================================

INSTALLED_APPS = [
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",

    # Terceros
    "rest_framework",
    "corsheaders",

    # Apps
    "core",
    "mi_api",
]

# ======================================================
# MIDDLEWARE
# ======================================================

# IMPORTANTE: corsheaders SIEMPRE debe ir arriba
MIDDLEWARE = [
    "django.middleware.security.SecurityMiddleware",

    "corsheaders.middleware.CorsMiddleware",  # DEBE IR AQUÍ

    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
]

ROOT_URLCONF = "mi_api.urls"

# ======================================================
# TEMPLATES (para servir el build de React)
# ======================================================

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [
            os.path.join(BASE_DIR, "build"),  # <-- Donde está el index.html del build
        ],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
                "django.template.context_processors.debug",
            ],
        },
    },
]

WSGI_APPLICATION = "mi_api.wsgi.application"

# ======================================================
# DATABASE
# ======================================================

DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.mysql",
        "NAME": "nee",
        "USER": "root",
        "PASSWORD": "Codaw2002-.",  # <-- tu clave correcta
        "HOST": "localhost",
        "PORT": "3306",
    }
}

# ======================================================
# VALIDACIÓN DE CONTRASEÑAS
# ======================================================

AUTH_PASSWORD_VALIDATORS = [
    {"NAME": "django.contrib.auth.password_validation.UserAttributeSimilarityValidator"},
    {"NAME": "django.contrib.auth.password_validation.MinimumLengthValidator"},
    {"NAME": "django.contrib.auth.password_validation.CommonPasswordValidator"},
    {"NAME": "django.contrib.auth.password_validation.NumericPasswordValidator"},
]

# ======================================================
# INTERNACIONALIZACIÓN
# ======================================================

LANGUAGE_CODE = "es-es"
TIME_ZONE = "UTC"
USE_I18N = True
USE_TZ = True

# ======================================================
# STATIC FILES + BUILD DE REACT
# ======================================================

STATIC_URL = "/static/"

STATICFILES_DIRS = [
    os.path.join(BASE_DIR, "build", "static"),  # del build de React
]

STATIC_ROOT = os.path.join(BASE_DIR, "staticfiles")

# ======================================================
# USER CUSTOM
# ======================================================

AUTH_USER_MODEL = "core.Usuario"

# ======================================================
# EMAIL
# ======================================================

EMAIL_BACKEND = "django.core.mail.backends.smtp.EmailBackend"
EMAIL_HOST = "smtp.gmail.com"
EMAIL_PORT = 587
EMAIL_USE_TLS = True
EMAIL_HOST_USER = "gestioncontra12@gmail.com"
EMAIL_HOST_PASSWORD = "xwmq hsmc rmmw mbuz"
DEFAULT_FROM_EMAIL = EMAIL_HOST_USER
