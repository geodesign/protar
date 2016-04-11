from rest_framework import filters, viewsets
from rest_framework_gis.filters import TMSTileFilter
from rest_framework_gis.pagination import GeoJsonPagination

from regions.models import Region
from regions.serializers import RegionGeoSerializer, RegionSerializer


class RegionViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Region.objects.defer('geom').order_by('level')
    serializer_class = RegionSerializer
    filter_backends = (filters.SearchFilter, filters.DjangoFilterBackend, )
    search_fields = ('country', 'n0nm', 'n0nme', 'n1nm', 'n2nm', 'n3nm', )
    filter_fields = ('country', 'level', )


class RegionGeoViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = RegionGeoSerializer
    filter_backends = (filters.DjangoFilterBackend, TMSTileFilter, )
    filter_fields = ('country', 'level', )
    pagination_class = GeoJsonPagination
    bbox_filter_include_overlapping = True
    bbox_filter_field = 'centroid'

    def get_queryset(self):
        queryset = Region.objects.all().order_by('id')
        exclude = self.request.query_params.get('exclude', '')
        if exclude:
            queryset.exclude(id__in=exclude.split(','))
        return queryset
