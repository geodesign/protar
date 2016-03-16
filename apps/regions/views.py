from rest_framework import filters, viewsets
from rest_framework_gis.pagination import GeoJsonPagination

from regions.models import Region
from regions.serializers import RegionGeoSerializer, RegionSerializer


class RegionViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Region.objects.all().order_by('level')
    serializer_class = RegionSerializer
    filter_backends = (filters.SearchFilter, filters.DjangoFilterBackend, )
    search_fields = ('country', 'name0', 'name1', 'name2', 'name3', 'name4', )
    filter_fields = ('country', 'level', )


class RegionGeoJsonPagination(GeoJsonPagination):
    page_size = 60


class RegionGeoViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Region.objects.all()
    serializer_class = RegionGeoSerializer
    filter_backends = (filters.DjangoFilterBackend, )
    filter_fields = ('country', 'level', )
    pagination_class = RegionGeoJsonPagination
