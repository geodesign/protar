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
        covers = Cover.objects.filter(site__country=obj.country)
        covers = covers.filter(site__in=obj.sites.values_list('id', flat=True))
        covers = covers.values('year', 'nomenclature', 'change', 'nomenclature_previous')
        # Compute aggregate area in km2
        covers = covers.annotate(area=Sum('area') / 1e6)
        return covers

    def get_name0(self, obj):
        rawname = obj.n0nme if obj.n0nme else ''
        if 'No NUTS' in rawname:
            return obj.country.name
        return rawname[3:].title()

    def get_name1(self, obj):
        rawname = obj.n1nm if obj.n1nm else ''
        if 'No NUTS' in rawname:
            return ''
        return rawname[4:].title()

    def get_name2(self, obj):
        rawname = obj.n2nm if obj.n2nm else ''
        if 'No NUTS' in rawname:
            return ''
        return rawname[5:].title()

    def get_name3(self, obj):
        rawname = obj.n3nm if obj.n3nm else ''
        if 'No NUTS' in rawname:
            return ''
        return rawname[6:].title()


class RegionGeoSerializer(GeoFeatureModelSerializer):
    geom = GeometrySerializerMethodField()

    def get_geom(self, obj):
        return obj.geom.simplify(0.008, preserve_topology=True)

    class Meta:
        model = Region
        geo_field = 'geom'
        fields = ('id', 'name', 'area', )
