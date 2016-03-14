from django_countries.serializer_fields import CountryField
from rest_framework import serializers
from rest_framework_gis.serializers import GeoFeatureModelSerializer, GeometrySerializerMethodField

from natura.models import (
    Bioregion, Contacts, Cover, Designationstatus, Habitatclass, Habitats, Impact, Management, Natura2000Sites, Site
)

class AggregateSerializer(serializers.ModelSerializer):
    covers = serializers.SerializerMethodField()


    def get_covers(self, obj):
        return {'year': 2000, 'area': 1}
