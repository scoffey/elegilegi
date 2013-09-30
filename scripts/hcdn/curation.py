#!/usr/bin/env python

import csv
import json
import logging
import os
import re
import sys

_EXP_RE = re.compile('[0-9]+-(?:d|s|pe|ov|jgm)-[0-9]+')

def read_json_file(filename):
    with open(filename, 'rb') as stream:
        retval = json.load(stream)
    return retval

def main(program, input_dir=None, *args):
    if not input_dir:
        path = list(os.path.split(os.path.dirname(__file__)))
        path[-1] = 'data'
        input_dir = os.path.join(*path)
    ids = read_json_file(os.path.join(input_dir, 'index.json'))
    writer = csv.writer(sys.stdout)
    writer.writerow(('ID', 'Fecha', 'Asunto', 'Expediente(s)'))
    for proyecto_id in ids:
        filename = os.path.join(input_dir, 'proyectos', proyecto_id + '.json')
        proyecto = read_json_file(filename)
        row = (
            proyecto_id,
            proyecto.get('fecha'),
            proyecto.get('asunto'),
            ';'.join(i.upper() for i in _EXP_RE.findall(proyecto_id))
        )
        writer.writerow(tuple(i.encode('utf-8') for i in row))

if __name__ == '__main__':
    logging.basicConfig(stream=sys.stderr, level=logging.DEBUG)
    main(*sys.argv)

