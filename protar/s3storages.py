"""
S3 Boto Storage class extensions to handle separate buckets for static and
media files. By default, S3BotoStorage only allows one setup. The classes
here allow separate storage classes for static and media files.
"""
from storages.backends.s3boto import S3BotoStorage

from django.conf import settings
from django.core.files.storage import get_storage_class


class StaticRootCachedS3BotoStorage(S3BotoStorage):
    """
    S3 storage backend that saves the files locally, too. This is to know
    which compressed files were already uploaded.
    """
    def __init__(self, *args, **kwargs):
        kwargs['bucket_name'] = getattr(settings,
            'AWS_STORAGE_BUCKET_NAME_STATIC')
        kwargs['preload_metadata'] = True
        kwargs['reduced_redundancy'] = True
        kwargs['file_overwrite'] = True
        kwargs['secure_urls'] = False
        kwargs['querystring_auth'] = False
        super(StaticRootCachedS3BotoStorage, self).__init__(*args, **kwargs)

        self.local_storage = get_storage_class(
            "compressor.storage.CompressorFileStorage")()

    def save(self, name, content):
        name = super(StaticRootCachedS3BotoStorage, self).save(name, content)
        if name.startswith(getattr(settings, 'COMPRESS_OUTPUT_DIR')):
            self.local_storage._save(name, content)
        return name


class MediaRootS3BotoStorage(S3BotoStorage):
    """
    S3 storage backend that uses the media setting as bucket name.
    """
    def __init__(self, *args, **kwargs):
        kwargs['bucket_name'] = getattr(settings,
            'AWS_STORAGE_BUCKET_NAME_MEDIA')
        kwargs['preload_metadata'] = True
        kwargs['reduced_redundancy'] = False
        kwargs['file_overwrite'] = False
        kwargs['secure_urls'] = True
        kwargs['querystring_auth'] = True
        super(MediaRootS3BotoStorage, self).__init__(*args, **kwargs)
