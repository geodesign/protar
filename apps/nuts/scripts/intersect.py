from corine.models import Patch
from django.db.models import Q
from natura.models import Cover, IntersectionLog, Site
from natura.tasks import process_sites
from nuts.models import Region


def run():
    for region in Region.objects.all():
        # Remove previous links
        region.sites.clear()

        # Filter sites that intersect with region
        sites = Site.objects.filter(geom__intersects=region.geom).values_list('id', flat=True)

        # Store sites
        region.sites.add(*sites)
