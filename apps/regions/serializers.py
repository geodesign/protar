from rest_framework import serializers
from rest_framework_gis.fields import GeometrySerializerMethodField
from rest_framework_gis.serializers import GeoFeatureModelSerializer

from django.db.models import Sum
from natura.models import Cover
from regions.models import Region


class RegionSerializer(serializers.ModelSerializer):
    covers = serializers.SerializerMethodField()
    country = serializers.CharField(source='country.name')
    name0 = serializers.SerializerMethodField()
    name1 = serializers.SerializerMethodField()
    name2 = serializers.SerializerMethodField()
    name3 = serializers.SerializerMethodField()

    class Meta:
        model = Region
        fields = (
            'id', 'name', 'name0', 'name1', 'name2', 'name3', 'country',
            'level', 'covers',
        )

    def get_covers(self, obj):
        covers = Cover.objects.filter(site__in=obj.sites.values_list('id', flat=True))
        covers = covers.values('year', 'nomenclature', 'change', 'nomenclature_previous')
        covers = covers.annotate(area=Sum('area'))
        return covers

    def get_name0(self, obj):
        return obj.n0nme[3:] if obj.n0nme else ''

    def get_name1(self, obj):
        return obj.n1nm[4:] if obj.n1nm else ''

    def get_name2(self, obj):
        return obj.n2nm[5:] if obj.n2nm else ''

    def get_name3(self, obj):
        return obj.n3nm[6:] if obj.n3nm else ''


class RegionGeoSerializer(GeoFeatureModelSerializer):
    geom = GeometrySerializerMethodField()

    def get_geom(self, obj):
        return obj.geom.simplify(0.008, preserve_topology=True)

    class Meta:
        model = Region
        geo_field = 'geom'
        fields = ('id', 'name', )
