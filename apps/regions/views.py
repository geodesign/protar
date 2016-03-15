from rest_framework import filters, mixins, viewsets

from regions.models import Region
from regions.serializers import RegionGeoSerializer, RegionSerializer


class RegionViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Region.objects.all().order_by('level')
    serializer_class = RegionSerializer
    filter_backends = (filters.SearchFilter, filters.DjangoFilterBackend, )
    search_fields = ('country', 'name0', 'name1', 'name2', 'name3', 'name4', )
    filter_fields = ('country', 'level', )


class RegionGeoViewSet(viewsets.GenericViewSet, mixins.RetrieveModelMixin):
    queryset = Region.objects.all()
    serializer_class = RegionGeoSerializer
