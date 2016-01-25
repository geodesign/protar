import glob
import os

import xlrd

from corine.models import Nomenclature


def run():
    # Get data directory from environment.
    datadir = os.environ.get('CORINE_DATA_DIRECTORY', '')
    if not datadir:
        print('Datadir not found, please specify CORINE_DATA_DIRECTORY env var.')
        return

    print('Creating nomenclature.')
    # Open clc legend file
    legend = glob.glob(os.path.join(datadir, '*/clc_legend.xls'))[0]
    workbook = xlrd.open_workbook(legend)

    # Get first sheet from xls file
    sheet = workbook.sheet_by_index(0)

    # Setup column name array
    names = ['grid_code', 'code', 'label_1', 'label_2', 'label_3', 'color']

    # Delete all exisiting nomenclature objects
    Nomenclature.objects.all().delete()

    for row_idx in range(1, sheet.nrows):
        # Convert row data to dict using names
        row = dict(zip(names, sheet.row_values(row_idx)))

        # Convert data type to ensure proper conversion
        row['code'] = int(row.pop('code'))
        row['grid_code'] = int(row.pop('grid_code'))
        print(row['code'])

        # Convert rgb color to hex
        color = row['color'].split('-')
        if len(color) == 3:
            row['color'] = ('#%02x%02x%02x' % tuple(int(x) for x in color)).upper()

        # Create nomenclature instance
        Nomenclature.objects.create(**row)
