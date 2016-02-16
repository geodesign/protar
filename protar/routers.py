from rest_framework import routers

from corine.views import NomenclatureViewSet
from natura.views import SiteGeoViewSet, SiteViewSet

router = routers.DefaultRouter(trailing_slash=False)

router.register(r'site', SiteViewSet, base_name='natura-site')
router.register(r'sitegeo', SiteGeoViewSet, base_name='natura-site-geo')
router.register(r'nomenclature', NomenclatureViewSet, base_name='corine-nomenclature')
