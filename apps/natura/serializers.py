from rest_framework import serializers
from rest_framework_gis.serializers import GeoFeatureModelSerializer, GeometrySerializerMethodField

from natura.models import (
    Bioregion, Contacts, Cover, Designationstatus, Habitatclass, Habitats, Impact, Management, Natura2000Sites, Site
)


class Natura2000SitesSerializer(serializers.ModelSerializer):

    class Meta:
        model = Natura2000Sites
        exclude = ('site', )


class BioregionSerializer(serializers.ModelSerializer):

    class Meta:
        model = Bioregion
        exclude = ('site', )


class ContactsSerializer(serializers.ModelSerializer):

    class Meta:
        model = Contacts
        exclude = ('site', )


class DesignationstatusSerializer(serializers.ModelSerializer):

    class Meta:
        model = Designationstatus
        exclude = ('site', )


class HabitatclassSerializer(serializers.ModelSerializer):

    class Meta:
        model = Habitatclass
        exclude = ('site', )


class HabitatsSerializer(serializers.ModelSerializer):

    class Meta:
        model = Habitats
        exclude = ('site', )


class ImpactSerializer(serializers.ModelSerializer):

    class Meta:
        model = Impact
        exclude = ('site', )


class ManagementSerializer(serializers.ModelSerializer):

    class Meta:
        model = Management
        exclude = ('site', )


class CoverSerializer(serializers.ModelSerializer):

    class Meta:
        model = Cover
        exclude = ('site', )


class SiteSerializer(serializers.ModelSerializer):

    management = ManagementSerializer(source='management_set.first', read_only=True)
    contact = ContactsSerializer(source='contacts_set.first', read_only=True)
    bioregion = BioregionSerializer(source='bioregion_set.first', read_only=True)
    covers = CoverSerializer(source='cover_set', many=True, read_only=True)
    designationstatus = DesignationstatusSerializer(source='designationstatus_set', many=True, read_only=True)
    natura2000 = Natura2000SitesSerializer(source='natura2000sites_set.first', read_only=True)
    country = serializers.CharField(source='country.name')
    sitetype = serializers.CharField(source='get_sitetype_display')

    class Meta:
        model = Site
        exclude = ('geom', )


class SiteGeoSerializer(GeoFeatureModelSerializer):

    geom = GeometrySerializerMethodField()

    class Meta:
        model = Site
        geo_field = 'geom'
        fields = ('id', 'country', )

    def get_geom(self, obj):
        obj.geom.transform(4326)
        return obj.geom
