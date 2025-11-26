"""
Django settings for mi_api project.
"""

import os
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent

# Usa una clave fija para desarrollo y permite sobreescribirla por entorno.
SECRET_KEY = os.environ.get(
    "DJANGO_SECRET_KEY",
    "django-insecure-f2r1pc7jz0b7i1!x(n8)5@8pj3)#61f#c@p5c7s-5o9q93+1oa",
)

DEBUG = True
ALLOWED_HOSTS = ['*']

INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',

    'rest_framework',
    'corsheaders',
    'core',
]

MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'mi_api.urls'
WSGI_APPLICATION = 'mi_api.wsgi.application'

# =============================
# TEMPLATES → USA build/
# =============================
TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [os.path.join(BASE_DIR, 'build')],   # 👈 AQUI VA EL BUILD
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
                'django.template.context_processors.debug',
            ],
        },
    },
]

# =============================
# STATIC FILES
# =============================
STATIC_URL = '/static/'
STATIC_ROOT = os.path.join(BASE_DIR, 'staticfiles')

STATICFILES_DIRS = [
    os.path.join(BASE_DIR, 'build', 'static'),   # 👈 JS, CSS del build
]

# =============================
# BASE DE DATOS
# =============================
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.mysql',
        'NAME': 'nee',
        'USER': 'root',
        'PASSWORD': 'admin12345',
        'HOST': 'localhost',
        'PORT': '3306',
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
