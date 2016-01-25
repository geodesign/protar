from corine.models import Patch
from natura.models import Cover, IntersectionLog, Site
from natura.tasks import process_sites


def run():
    nr_of_sites = Site.objects.count()
    chunk_size = 50

    # Drop current cover objects
    Cover.objects.all().delete()
    IntersectionLog.objects.all().delete()

    print('Processing {} Sites and {} Patches'.format(nr_of_sites, Patch.objects.count()))

    batch = []
    for site in Site.objects.values('id').all():
        batch.append(site['id'])
        if(len(batch) == chunk_size):
            process_sites.delay(batch)
            batch = []

    if len(batch):
        process_sites.delay(batch)
