from django_countries.fields import CountryField

from django.contrib.gis.db import models
from natura.models import Site


class Region(models.Model):
    """
    Regions to provide summaries for, for instance Nuts and Country boundaries.
    """
    nuts3id = models.FloatField(null=True)
    nufttp = models.CharField(max_length=1, null=True)
    n0cd = models.CharField(max_length=2, null=True)
    n1cd = models.CharField(max_length=3, null=True)
    n2cd = models.CharField(max_length=4, null=True)
    n3cd = models.CharField(max_length=5, null=True)
    n0nme = models.CharField(max_length=254, null=True)
    n0nm = models.CharField(max_length=254, null=True)
    n1nm = models.CharField(max_length=254, null=True)
    n2nm = models.CharField(max_length=254, null=True)
    n3nm = models.CharField(max_length=254, null=True)
    n2_3cd = models.CharField(max_length=254, null=True)
    geom = models.MultiPolygonField()

    country = CountryField(null=True)
    sites = models.ManyToManyField(Site)
    level = models.IntegerField(default=3)
    centroid = models.PointField(null=True)

    def __str__(self):
        return self.name

    @property
    def name(self):
        if self.level == 0:
            rawname = self.n0nme
        else:
            rawname = getattr(self, 'n{}nm'.format(self.level))
        if 'No NUTS' in rawname:
            return self.country.name
        return rawname[self.level + 3:].title()
