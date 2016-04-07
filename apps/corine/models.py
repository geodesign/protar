from raster.models import RasterLayer

from django.contrib.gis.db import models


class Nomenclature(models.Model):
    """
    Corine Land Cover Nomenclature.
    """
    code = models.CharField(max_length=3)
    grid_code = models.IntegerField()
    label_1 = models.CharField(max_length=100)
    label_2 = models.CharField(max_length=100)
    label_3 = models.CharField(max_length=100)
    color = models.CharField(max_length=7, default='')

    def __str__(self):
        return self.label_3


class Patch(models.Model):
    """
    Corine Land Cover patch.
    """
    objectid = models.IntegerField()
    clcid = models.TextField()

    year = models.IntegerField()
    nomenclature = models.ForeignKey(Nomenclature)

    change = models.BooleanField()
    nomenclature_previous = models.ForeignKey(Nomenclature, null=True, related_name='previous_patches')
    change_type = models.CharField(max_length=10, null=True)

    remark = models.TextField()

    area_ha = models.FloatField()
    shape_length = models.FloatField()
    shape_area = models.FloatField()

    geom = models.MultiPolygonField(srid=3035)
    geom_wgs = models.MultiPolygonField(null=True)

    class Meta:
        verbose_name_plural = 'patches'

    def __str__(self):
        return '{} ({}Year {})'.format(self.nomenclature.label_3, 'Change, ' if self.change else '', self.year)


class CorineLayer(models.Model):
    """
    Corine Raster Layers.
    """
    rasterlayer = models.ForeignKey(RasterLayer)
    year = models.IntegerField()
    change = models.BooleanField(default=False)

    def __str__(self):
        return self.rasterlayer.name
