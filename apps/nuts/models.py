from django_countries.fields import CountryField

from django.contrib.gis.db import models

class Nuts(models.Model):
    """
    Nomenclature of Territorial Units for Statistics used for regional
    aggregation.
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
    taa = models.IntegerField(null=True)
    shape_leng = models.FloatField(null=True)
    shape_area = models.FloatField(null=True)
    country = CountryField(null=True)
    level = models.IntegerField(default=3)
    geom = models.PolygonField()

    def __str__(self):
        return self.inspireid

#class Nuts(models.Model):
    #"""
    #Nomenclature of Territorial Units for Statistics used for regional
    #aggregation.
    #"""
    #nuts3id = models.FloatField(null=True)
    #nufttp = models.CharField(max_length=1, null=True)
    #n0cd = models.CharField(max_length=2)
    #n1cd = models.CharField(max_length=3, null=True)
    #n2cd = models.CharField(max_length=4, null=True)
    #n3cd = models.CharField(max_length=5, null=True)
    #n0nme = models.CharField(max_length=254)
    #n0nm = models.CharField(max_length=254)
    #n1nm = models.CharField(max_length=254, null=True)
    #n2nm = models.CharField(max_length=254, null=True)
    #n3nm = models.CharField(max_length=254, null=True)
    #n2_3cd = models.CharField(max_length=254, null=True)
    #country = CountryField(null=True)
    #level = models.IntegerField(default=3)
    #geom = models.MultiPolygonField(srid=3857)

    #def __str__(self):
        #print(self.level)
        #return getattr(self, 'n{}cd'.format(self.level))
