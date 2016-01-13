#!/usr/bin/env python
import os
import sys

# Add apps directory to python path
sys.path.append(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'apps'))

if __name__ == "__main__":
    os.environ.setdefault("DJANGO_SETTINGS_MODULE", "protar.settings")

    from django.core.management import execute_from_command_line

    execute_from_command_line(sys.argv)
