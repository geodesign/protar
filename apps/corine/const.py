"""
Constant definitions for the corine landcover app.
"""
# Field mapping for vector data
FIELD_MAPPING = {
    'objectid': 'OBJECTID',
    'clcid': 'ID',
    'remark': 'Remark',
    'area_ha': 'Area_Ha',
    'shape_length': 'Shape_Length',
    'shape_area': 'Shape_Area',
}

CHANGE_FIELD_MAPPING = {
    'objectid': 'OBJECTID',
    'clcid': 'ID',
    'remark': 'remark',
    'area_ha': 'Area_ha',
    'shape_length': 'Shape_Length',
    'change_type': 'ChType',
    'shape_area': 'Shape_Area',
}

# List of source files for vector corine data
VECTOR_FILES = {
    'full': {
        1990: 'clc90_Version_18_4.sqlite',
        2000: 'clc00_Version_18_4.sqlite',
        2006: 'clc06_Version_18_4.sqlite',
        2012: 'clc12_Version_18_4.sqlite',
    },
    'change': {
        1990: 'cha90_Version_18_4.sqlite',
        2000: 'cha00_Version_18_4.sqlite',
        2006: 'cha06_Version_18_4.sqlite',
        2012: 'cha12_Version_18_4.sqlite',
    },
}

# List of raster files for corine data
RASTER_FILES = {
    'full': {
        1990: 'g100_clc90_V18_3.tif',
        2000: 'g100_clc00_V18_3.tif',
        2006: 'g100_clc06_V18_3.tif',
        2012: 'g100_clc12_V18_3.tif',
    },
    'change': {
        1990: 'g100_ch06_90_V18_3.tif',
        2000: 'g100_ch06_00_V18_3.tif',
        2006: 'g100_ch06_06_V18_3.tif',
        2012: 'g100_ch06_12_V18_3.tif',
    },
}

PREVIOUS_LOOKUP = {'00': '90', '06': '00', '12': '06'}
YEAR_MAPPING = {'90': 1990, '00': 2000, '06': 2006, '12': 2012}
