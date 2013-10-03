#!/usr/bin/env python

"""
Merges senado and hcdn project data.
"""

import json
import logging
import os.path
import sys

def merge(filename, data):
    retval = None
    with open(filename) as stream:
        original = json.load(stream)
        original['asunto-senado'] = data['asunto']
        original['fecha-senado'] = data['fecha']
        for v, reprs in original['votacion'].iteritems():
            a = frozenset(reprs)
            b = frozenset(data['votacion'].get(v, []))
            original['votacion'][v] = sorted(a) + sorted(b)
        retval = original
    return retval

def main(program, path=None, *args):
    """ Main program """
    for i in args: # project data JSON files
        data = None
        with open(i, 'rb') as stream:
            data = json.load(stream)
            filename = os.path.join(path, os.path.basename(i))
            data = merge(filename, data)
        if data is not None:
            with open(i, 'w+b') as stream:
                json.dump(data, stream, indent=4, sort_keys=True)

if __name__ == '__main__':
    logging.basicConfig(stream=sys.stderr, level=logging.DEBUG)
    main(*sys.argv)

