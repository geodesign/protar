"""
Django settings for protar project.
"""
import os

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

SECRET_KEY = os.environ.get('SECRET_KEY')

DEBUG = os.environ.get('DEBUG', '') in [True, 'True']

INTERNAL_IPS = ['127.0.0.1']

ALLOWED_HOSTS = ['*']

# Allow all CORS requests for the api
CORS_URLS_REGEX = r'^/api/.*$'
CORS_ORIGIN_ALLOW_ALL = True

# Application definition
INSTALLED_APPS = (
    # Django apps
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'django.contrib.gis',

    # Third party apps
    'rest_framework',
    'rest_framework_gis',
    'storages',
    'compressor',
    'celery',
    'kombu.transport.django',
    'raster',
    'raster_aggregation',
    'django_extensions',
    'django_countries',
    'corsheaders',

    # Protar apps
    'corine',
    'natura',
    'regions',
)

MIDDLEWARE_CLASSES = (
    'django.middleware.cache.UpdateCacheMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.auth.middleware.SessionAuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
    'django.middleware.security.SecurityMiddleware',
    'django.middleware.cache.FetchFromCacheMiddleware',
)

ROOT_URLCONF = 'protar.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [
            os.path.join(BASE_DIR, 'frontend/templates'),
        ],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.contrib.auth.context_processors.auth',
                'django.template.context_processors.debug',
                'django.template.context_processors.i18n',
                'django.template.context_processors.media',
                'django.template.context_processors.static',
                'django.template.context_processors.tz',
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
        'NAME': os.environ.get('DB_NAME', 'protar'),
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

USE_TZ = False

# Static files
STATIC_ROOT = os.environ.get('STATIC_ROOT', '/protar_static')
STATIC_URL = '/static/'

STATICFILES_DIRS = (
    os.path.join(BASE_DIR, 'frontend'),
)


STATICFILES_FINDERS = (
    'django.contrib.staticfiles.finders.AppDirectoriesFinder',
    'django.contrib.staticfiles.finders.FileSystemFinder',
    'compressor.finders.CompressorFinder',
)

# Media
MEDIA_ROOT = os.environ.get('MEDIA_ROOT', '/protar_media')
MEDIA_URL = '/media/'

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
BROKER_URL = os.environ.get('BROKER_URL', 'amqp://guest:guest@localhost:5672//')
CELERY_RESULT_BACKEND = os.environ.get('REDIS_URL', 'redis://localhost:6379')
CELERYD_PREFETCH_MULTIPLIER = 1
CELERY_ACKS_LATE = True
if 'CELERYD_CONCURRENCY' in os.environ:
    CELERYD_CONCURRENCY = os.environ.get('CELERYD_CONCURRENCY')

# Raster
RASTER_USE_CELERY = True
RASTER_WORKDIR = os.environ.get('RASTER_WORKDIR', None)

# Rest framework
REST_FRAMEWORK = {
    'DEFAULT_PAGINATION_CLASS': 'rest_framework.pagination.PageNumberPagination',
    'PAGE_SIZE': 5,
}

if not DEBUG:
    CACHES = {
        'default': {
            'BACKEND': 'django.core.cache.backends.memcached.MemcachedCache',
            'LOCATION': '127.0.0.1:11211',
            'TIMEOUT': None,
            'OPTIONS': {
                'MAX_ENTRIES': 2000
            }
        }
    }
