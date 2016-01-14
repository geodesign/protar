"""
Create fixtures for nomenclature model in corine app.

After running this script, load fixtures into databse like this::

    python manage.py loaddata clc_nomenclature
"""
import csv
import json
import os

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

csvfile = open(os.path.join(BASE_DIR, 'scripts/data/clc_nomenclature.csv'), 'r')
jsonfile = open(os.path.join(BASE_DIR, 'apps/corine/fixtures/clc_nomenclature.json'), 'w')

reader = csv.DictReader(csvfile)
reader = list(reader)

jsonfile.write('[')
counter = 0
for row in reader:
    counter += 1
    data = {"pk": counter, "model": "corine.nomenclature"}
    color = row['color'].split('-')
    if len(color) == 3:
        row['color'] = ('#%02x%02x%02x' % tuple(int(x) for x in color)).upper()
    data["fields"] = row
    json.dump(data, jsonfile)
    if counter < len(reader):
        jsonfile.write(',')

jsonfile.write(']')
jsonfile.close()
