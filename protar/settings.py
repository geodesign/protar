"""
Django settings for protar project.
"""
import os

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

SECRET_KEY = os.environ.get('SECRET_KEY')

DEBUG = os.environ.get('DEBUG', False)

INTERNAL_IPS = ['127.0.0.1']

ALLOWED_HOSTS = ['*']

# Application definition
INSTALLED_APPS = (
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'django.contrib.gis',

    'storages',
    'compressor',
    'celery',
    'kombu.transport.django',

    'raster',
    'raster_aggregation',

    'corine',
    'natura',
)

MIDDLEWARE_CLASSES = (
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.auth.middleware.SessionAuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
    'django.middleware.security.SecurityMiddleware',
)

ROOT_URLCONF = 'protar.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [os.path.join(BASE_DIR, 'ispecia/templates')],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.template.context_processors.static',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'protar.wsgi.application'

# Database
DATABASES = {
    'default': {
        'ENGINE': 'django.contrib.gis.db.backends.postgis',
        'NAME': os.environ.get('DB_NAME'),
        'USER': os.environ.get('DB_USER', 'postgres'),
        'PASSWORD': os.environ.get('DB_PASSWORD', ''),
        'PORT': os.environ.get('DB_PORT', '5432'),
        'HOST': os.environ.get('DB_HOST', 'localhost'),
    }
}

# Internationalization
LANGUAGE_CODE = 'en-us'

TIME_ZONE = 'UTC'

USE_I18N = True

USE_L10N = True

USE_TZ = True

# AWS secrets
AWS_ACCESS_KEY_ID = os.environ.get('AWS_ACCESS_KEY_ID', '')
AWS_SECRET_ACCESS_KEY = os.environ.get('AWS_SECRET_ACCESS_KEY', '')

# Static files
STATIC_ROOT = os.environ.get('STATIC_ROOT', '')

STATICFILES_DIRS = (
    os.path.join(BASE_DIR, 'frontend'),
)

AWS_STORAGE_BUCKET_NAME_STATIC = os.environ.get('AWS_STORAGE_BUCKET_NAME_STATIC', '')

if AWS_STORAGE_BUCKET_NAME_STATIC:
    STATICFILES_STORAGE = 'protar.s3storages.StaticRootCachedS3BotoStorage'

    STATIC_URL = 'http://%s.s3.amazonaws.com/' % os.environ.get('AWS_STORAGE_BUCKET_NAME_STATIC')
else:
    STATIC_URL = '/static/'

STATICFILES_FINDERS = (
    'django.contrib.staticfiles.finders.AppDirectoriesFinder',
    'django.contrib.staticfiles.finders.FileSystemFinder',
    'compressor.finders.CompressorFinder',
)

# Media
AWS_STORAGE_BUCKET_NAME_MEDIA = os.environ.get('AWS_STORAGE_BUCKET_NAME_MEDIA', '')
if AWS_STORAGE_BUCKET_NAME_MEDIA:
    MEDIA_URL = 'http://%s.s3.amazonaws.com/' % os.environ.get('AWS_STORAGE_BUCKET_NAME_MEDIA')
else:
    MEDIA_ROOT = os.environ.get('MEDIA_ROOT')
    MEDIA_URL = '/media/'

# Compression
if 'STATICFILES_STORAGE' in locals():
    COMPRESS_STORAGE = STATICFILES_STORAGE

COMPRESS_JS_FILTERS = [
    'compressor.filters.jsmin.JSMinFilter'
]

COMPRESS_CSS_FILTERS = [
    'compressor.filters.css_default.CssAbsoluteFilter',
    'compressor.filters.cssmin.CSSMinFilter'
]

COMPRESS_PRECOMPILERS = (
    ('text/scss', 'sass {infile} {outfile}'),
    ('text/less', 'lessc {infile} > {outfile}'),
)

COMPRESS_OFFLINE = True

# Celery
BROKER_URL = 'django://'

# Raster
RASTER_USE_CELERY = True
