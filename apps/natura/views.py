from rest_framework import filters, viewsets
from rest_framework_gis.filters import TMSTileFilter
from rest_framework_gis.pagination import GeoJsonPagination

from natura.models import Site
from natura.serializers import SiteGeoSerializer, SiteSerializer


class SiteViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Site.objects.all()
    serializer_class = SiteSerializer
    filter_backends = (filters.SearchFilter, filters.DjangoFilterBackend, )
    search_fields = ('sitename', 'sitecode', )
    filter_fields = ('country', )


class SiteGeoViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Site.objects.all().order_by('id')
    serializer_class = SiteGeoSerializer
    filter_backends = (filters.DjangoFilterBackend, TMSTileFilter, )
    pagination_class = GeoJsonPagination
    bbox_filter_include_overlapping = True
    bbox_filter_field = 'centroid'
