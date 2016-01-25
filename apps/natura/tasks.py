import datetime

from celery import task

from corine.models import Patch
from django.contrib.gis.db.models.functions import Area, Intersection
from django.db.models import Sum
from natura.models import Cover, IntersectionLog, Site


@task
def process_sites(sites):
    now = '[{0}]'.format(datetime.datetime.now().strftime('%Y-%m-%d %T'))
    print('{} Processing ids {} ... {}.'.format(now, sites[0], sites[-1]))

    for site in Site.objects.filter(id__in=sites):
        # Log the beginning of the intersection process
        log = IntersectionLog.objects.create(site=site)

        # Filter patches that intersect with this site
        qs = Patch.objects.filter(geom__intersects=site.geom)

        # Group output by relevant factors
        qs = qs.values('year', 'nomenclature_id', 'change', 'nomenclature_previous_id')

        # Annotate with sum of intersection areas
        qs = qs.annotate(area=Sum(Area(Intersection('geom', site.geom))))

        # Assemble cover objects from aggregate result
        batch = [Cover(site=site, **dat) for dat in qs]

        # Commit cover for the sites to database
        Cover.objects.bulk_create(batch)

        # Log the end of this site intersection process
        log.end = datetime.datetime.now()
        log.save()
