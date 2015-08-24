#!/usr/bin/env python

import csv
import json
import logging
import os
import sys

_HERE_DIR = os.path.dirname(__file__)
_BASE_PATH = os.path.join(_HERE_DIR, '..', 'data', 'proyectos')

def read_json_file(filename):
    with open(filename, 'rb') as stream:
        retval = json.load(stream)
    return retval

def write_json_file(filename, data):
    with open(filename, 'wb') as stream:
        json.dump(data, stream, indent=4)

def read_rows(filename):
    retval = None
    if filename is None:
        reader = csv.reader(sys.stdin, delimiter='\t')
        retval = tuple(reader)
    else:
        with open(filename, 'rb') as stream:
            reader = csv.reader(stream, delimiter='\t')
            retval = tuple(reader)
    return retval

def main(program, filename=None, *args):
    for row in read_rows(filename):
        proyecto_id = row[0]
        filename = os.path.join(_BASE_PATH, proyecto_id + '.json')
        proyecto = read_json_file(filename)
        proyecto['url'] = row[4]
        proyecto['sumario'] = row[5]
        proyecto['nombre'] = row[6]
        write_json_file(filename, proyecto)

if __name__ == '__main__':
    logging.basicConfig(stream=sys.stderr, level=logging.DEBUG)
    main(*sys.argv)

