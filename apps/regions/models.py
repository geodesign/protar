from django_countries.fields import CountryField

from django.contrib.gis.db import models
from natura.models import Site


class Region(models.Model):
    """
    Regions to provide summaries for, for instance Nuts and Country boundaries.
    """
    fcsubtype = models.IntegerField(null=True)
    inspireid = models.CharField(max_length=50, null=True)
    beginlifes = models.DateField(null=True)
    f_code = models.CharField(max_length=5, null=True)
    icc = models.CharField(max_length=8, null=True)
    shn0 = models.CharField(max_length=14, null=True)
    shn1 = models.CharField(max_length=14, null=True)
    shn2 = models.CharField(max_length=14, null=True)
    shn3 = models.CharField(max_length=14, null=True)
    shn4 = models.CharField(max_length=14, null=True)
    name0 = models.TextField(null=True)
    name1 = models.TextField(null=True)
    name2 = models.TextField(null=True)
    name3 = models.TextField(null=True)
    name4 = models.TextField(null=True)
    taa = models.IntegerField(null=True)
    shape_leng = models.FloatField(null=True)
    shape_area = models.FloatField(null=True)
    country = CountryField(null=True)
    sites = models.ManyToManyField(Site)
    level = models.IntegerField(default=-1)
    geom = models.MultiPolygonField()

    def __str__(self):
        return self.name

    @property
    def name(self):
        for i in range(4, -1, -1):
            name = getattr(self, 'name' + str(i))
            if name:
                return name
        return str(self.country.name)
