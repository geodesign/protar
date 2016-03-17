from rest_framework import serializers
from rest_framework_gis.fields import GeometrySerializerMethodField
from rest_framework_gis.serializers import GeoFeatureModelSerializer

from django.db.models import Sum
from natura.models import Cover
from regions.models import Region


class RegionSerializer(serializers.ModelSerializer):
    covers = serializers.SerializerMethodField()
    country = serializers.CharField(source='country.name')

    class Meta:
        model = Region
        fields = (
            'id', 'inspireid', 'name0', 'name1', 'name2', 'name3', 'name4',
            'name', 'country', 'level', 'covers', 'shn0'
        )

    def get_covers(self, obj):
        covers = Cover.objects.filter(site__in=obj.sites.values_list('id', flat=True))
        covers = covers.values('year', 'nomenclature', 'change', 'nomenclature_previous')
        covers = covers.annotate(area=Sum('area'))
        return covers


class RegionGeoSerializer(GeoFeatureModelSerializer):
    geom = GeometrySerializerMethodField()

    def get_geom(self, obj):
        return obj.geom.simplify(0.01, preserve_topology=True)

    class Meta:
        model = Region
        geo_field = 'geom'
        fields = ('id', 'name', )
