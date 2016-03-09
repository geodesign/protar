from django_countries.fields import CountryField

from django.contrib.gis.db import models


class Nuts(models.Model):
    """
    Statistical areas for regional aggregation.
    """
    nuts3id = models.FloatField()
    nufttp = models.CharField(max_length=1)
    n0cd = models.CharField(max_length=2)
    n1cd = models.CharField(max_length=3)
    n2cd = models.CharField(max_length=4)
    n3cd = models.CharField(max_length=5)
    n0nme = models.CharField(max_length=254)
    n0nm = models.CharField(max_length=254)
    n1nm = models.CharField(max_length=254)
    n2nm = models.CharField(max_length=254)
    n3nm = models.CharField(max_length=254)
    n2_3cd = models.CharField(max_length=254)
    country = CountryField(null=True)
    geom = models.MultiPolygonField(srid=3857)
