======
Protar
======
Protected Area Land Cover Change Explorer. The app is published under the
European Union Public License (EUPL) Version 1.1. See the LICENSE file.

Install
-------

* ``git pull ..repository..``
* ``pip install -r requirements.txt``
* ``bower install``
* Download data: shp and csv for natura, sqlite for corinne
* Load natura data ``./manage.py runscript natura.load /path/to/natura.shp /path/to/natura/tables/``
* Load corine data ``./manage.py runscript corine.load /path/to/corine/files/``
* Create superuser ``./manage.py createsuperuser``
* ``./manage.py runserver``
* Open localhost

Loading Data
------------
The protar app comes with fixtures for setting up the base data in the app
(such as nomenclatures etc).

Corine
^^^^^^
Load the fixtures for the corine app like this::

    python manage.py loaddata clc_nomenclature

The script to create fixtures for the corine nomenclature is also part of this
app. The following command re-run the script and recreate the fixtures from the
input csv file in the scripts data directory::

    python scripts/create_corine_nomenclature_fixtures.py

Running this script should not be necessary unless you want to change the
fixtures data.

Env Vars
--------

Required:

* ``DB_NAME``
* ``SECRET_KEY``

Optional:

* ``DEBUG``
* ``AWS_STORAGE_BUCKET_NAME_STATIC``
* ``STATIC_ROOT``
* ``AWS_STORAGE_BUCKET_NAME_MEDIA``
* ``AWS_ACCESS_KEY_ID``
* ``AWS_SECRET_ACCESS_KEY``

Data Sources
------------

Natura 2000 protected areas.
http://www.eea.europa.eu/data-and-maps/data/ds_resolveuid/66812705cd9b4c4280660e5eb0d8d59c

Download sqlite GIS files and CSV Tables

Corrine Land cover
^^^^^^^^^^^^^^^^^^

Copernicus v18 2012

http://land.copernicus.eu/pan-european/corine-land-cover/clc-2012/

Land Cover Polygions in sqlite format
https://cws-download.eea.europa.eu/pan-european/clc/vector/sqlite/clc90_Version_18_4.sqlite.rar
https://cws-download.eea.europa.eu/pan-european/clc/vector/sqlite/clc00_revised_Version_18_4.sqlite.rar
https://cws-download.eea.europa.eu/pan-european/clc/vector/sqlite/clc06_revised_Version_18_4.sqlite.rar
https://cws-download.eea.europa.eu/pan-european/clc/vector/sqlite/clc12_Version_18_4.sqlite.rar

Land Cover Change Polygions in sqlite format
https://cws-download.eea.europa.eu/pan-european/clc/vector/sqlite/cha00_Version_18_4.sqlite.rar
https://cws-download.eea.europa.eu/pan-european/clc/vector/sqlite/cha06_Version_18_4.sqlite.rar
https://cws-download.eea.europa.eu/pan-european/clc/vector/sqlite/cha12_Version_18_4.sqlite.rar

EEA

All for Version 17

1990
http://www.eea.europa.eu/data-and-maps/data/ds_resolveuid/e3cae160d2314608bc945caf86f1abd7

2000
http://www.eea.europa.eu/data-and-maps/data/ds_resolveuid/9d72c3758040434da6905011e4aecbd6

2006
http://www.eea.europa.eu/data-and-maps/data/ds_resolveuid/a47ee0d3248146908f72a8fde9939d9d

Change 1990-2000
http://www.eea.europa.eu/data-and-maps/data/ds_resolveuid/e68ea8e6ce904769a727539ef37f8c75

Change 2000-2006
http://www.eea.europa.eu/data-and-maps/data/ds_resolveuid/f497a90b18dc496b823e3b71137eff7a

Population Density 1990
http://www.eea.europa.eu/data-and-maps/data/ds_resolveuid/8C25939C-F4CC-443F-852D-F2680B2117A1

Population Density 2000
http://www.eea.europa.eu/data-and-maps/data/ds_resolveuid/F6907877-C585-45DE-B93F-E7FC0975DE2A

Base Maps
---------
CartoDB and Stamen collaborated to make beautiful basemaps that are ideal for
data overlays. They are released under a CC3.0 License.

https://cartodb.com/basemaps/

https://creativecommons.org/licenses/by/3.0/

https://github.com/cartodb/cartodb-basemaps

Funding
-------
This application has been developed within the MyGEOSS project, which has received funding from the European Union’s Horizon 2020 research and innovation programme.

Disclaimer
------------
The JRC, or as the case may be the European Commission, shall not be held liable for any direct or indirect, incidental, consequential or other damages, including but not limited to the loss of data, loss of profits, or any other financial loss arising from the use of this application, or inability to use it, even if the JRC is notified of the possibility of such damages.

App Stores
----------
This is a web application not a mobile application. It is therefore not available on app stores.
