============
Introduction
============

Installation
------------

* ``git pull ..repository..``
* ``pip install -r requirements.txt``
* ``bower install``
* Download data: sqlite format for GIS data for Natura2000 and Corine, and csv
  for Natura2000.
* Set the path to the data directories as environment variables:
  ``NATURA_DATA_DIRECTORY`` and ``CORINE_DATA_DIRECTORY``
* Load natura data ``./manage.py runscript natura.scripts.load``
* Load corine data ``./manage.py runscript corine.scripts.load``
* Create superuser ``./manage.py createsuperuser``
* ``./manage.py runserver``
* Open localhost


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

Loading Data
------------
All data used in this app is loaded from the raw data files using scripts.
These scripts can be run as follows:

* Load natura data ``./manage.py runscript natura.scripts.load``
* Load corine data ``./manage.py runscript corine.scripts.load``
* Create corine nomenclature ``./manage.py runscript corine.scripts.load``
