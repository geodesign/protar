import datetime

from corine.models import Patch
from django.contrib.gis.db.models.functions import Area, Intersection
from django.db.models import Sum
from natura.models import Cover, Site


def run():
    counter = 0
    nr_of_sites = Site.objects.count()

    # Drop current cover objects
    Cover.objects.all().delete()

    print('Processing {} Sites and {} Patches'.format(nr_of_sites, Patch.objects.count()))

    for site in Site.objects.all():
        # Filter patches that intersect with this site
        qs = Patch.objects.filter(geom__intersects=site.geom)
        # Group output by relevant factors
        qs = qs.values('year', 'nomenclature_id', 'change', 'nomenclature_previous_id')
        # Annotate with sum of intersection areas
        qs = qs.annotate(area=Sum(Area(Intersection('geom', site.geom))))
        # Assemble cover objects from aggregate result
        batch = []
        for dat in qs:
            batch.append(Cover(site=site, **dat))
        # Commit cover for this site to database
        Cover.objects.bulk_create(batch)
        # Log progress
        counter += 1
        if counter % 50 == 0:
            percent = round(100 * float(counter) / nr_of_sites, 2)
            now = '[{0}]'.format(datetime.datetime.now().strftime('%Y-%m-%d %T'))
            print('{} Processed {}% ({}/{}) sites'.format(now, percent, counter, nr_of_sites))
