from corine.models import Patch
from django.db.models import Q
from natura.models import Cover, IntersectionLog, Site
from natura.tasks import process_sites


def run():
    # Drop current cover objects
    Cover.objects.all().delete()
    IntersectionLog.objects.all().delete()

    # Select Natura sites that are not water bodies
    non_water_sites = Site.objects.exclude(
        Q(habitatclass__habitatcode='N06') & Q(habitatclass__percentagecover=100)
    )
    water_sites = Site.objects.filter(
        Q(habitatclass__habitatcode='N06') & Q(habitatclass__percentagecover=100)
    )

    print('Processing {} Sites and {} Patches'.format(Site.objects.count(), Patch.objects.count()))

    # Log how many sites are excluded
    ws_count = water_sites.count()
    if(ws_count > 0):
        print('Excluded {} sites where inland water bodies are 100% of its cover.'.format(ws_count))

    # Set task batch size
    batch_size = 50

    # Set empty batch variable
    batch = []

    # Create one celery task for each batch
    for site in non_water_sites.values('id'):
        batch.append(site['id'])
        if(len(batch) == batch_size):
            process_sites.delay(batch)
            batch = []

    if len(batch):
        process_sites.delay(batch)
