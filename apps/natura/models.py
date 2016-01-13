from django.contrib.gis.db import models


class Site(models.Model):
    """
    Natura 2000 Site.
    """
    sitecode = models.CharField(max_length=254)
    sitename = models.CharField(max_length=254)
    release_da = models.CharField(max_length=254)
    ms = models.CharField(max_length=254)
    sitetype = models.CharField(max_length=254)
    geom = models.PolygonField(srid=3035)
    objects = models.GeoManager()

    def __str__(self):
        return self.sitename
