==============
Build Database
==============
This section describes how to re-build the protar PostGIS database from
scratch. This presumes that the app and all its dependencies are installed
and that the database settings are configured to use a PostGIS backend as
specified below.

Configure Database
------------------
The protar app works only PostGIS as database backends. To point the app
to a specific database, specify the following environmental variables.

* Database name ``DB_NAME`` (required)
* Database user ``DB_USER``, defaults to ``postgres``
* Database host ``DB_HOST``, defaults to ``localhost``
* Database port ``DB_PORT``, defaults to ``5432``
* Database password ``DB_PASSWORD``, defaults to an empty string

Download and decompress
-----------------------
The first step is to download the data from the EEA. The sources are described
in :doc:`data_management`. After download, decompress all files for Corine and
Natura into separate folders. The corine data should have one subfolder with
the Legend information.

For the Natura data, download the shapefiles and the tabular data as csv.
Decompress both the spatial data and the tabluar data into a single folder. For
the Corine data, the sqlite versions are required. Download the Corine CLC and
change data for the four landcover periods as spatialite and decompress all of
those into one folder. Keep one ``Legend`` subfolder from these files as well
to build the corien data legend.

For Corine data, the version required is v18.5. For the Natura data, the
required version is 7.

Parse Corine Data
-----------------
The next step is to parse the corine vector data. For this, build the
nomenclature and the legend objects first, then load the data into
the app using scripts built into protar. First, set an environmental
variable telling protar where the corine data sits (separate folders
for the legend and the landcover data). The legend folder should contain
a ``clc_legend.xls`` file which comes with the landcover sqlite files. The
data folder should contain spatialite files for all land cover and land cover
change steps. Then scripts can be called as follows::

    export CORINE_DATA_DIRECTORY=/path/to/corine/data/Legend
    ./manage.py runscript corine.scripts.nomenclature
    ./manage.py runscript corine.scripts.rasterlegend

    export CORINE_DATA_DIRECTORY=/path/to/corine/data
    ./manage.py runscript corine.scripts.load

Parse Natura Data
-----------------
To load the Natura 2000 protected areas into the database, specify the Natura
data directory that should contain one shapefile with the Natura data and
a series of CSV files with the Natura metadata. Then the spatial and tabluar
data can be loaded using the following command::

    export NATURA_DATA_DIRECTORY=/path/to/natura/data
    ./manage.py runscript natura.scripts.load

Compute Intersection
--------------------
Once all load scrips have completed successfully, the intersection data can
be built with a script as well.

The intersection script computes the landcover statistics for all protected
areas, so it does take many hours of computations. Therefore, the asynchronous
task manager Celery is used to do the geoprocessing of the data.

To learn how to setup Celery, consult its documentation. Protar assumes a local
redis instance setup for the result backend and a local rabbitmq instance as
broker. If those are installed and running in the default locations, celery
should work automatically. To start celery use::

    celery worker -A protar --loglevel=INFO

The environment variables to specify a custom broker backend is ``BROKER_URL``,
and ``CELERY_RESULT_BACKEND`` for the result backend. The concurrency of the
celery workers defaults to the number of available CPUs, but can be manually
specified using the ``CELERYD_CONCURRENCY`` environment variable.

With celery up and running, run the follwing script to create tasks in the
task queue that wil build the intersection data (the computations are split
into small batches of Natura sites)::

    ./manage.py runscript natura.scripts.intersect
