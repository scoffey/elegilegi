#!/usr/bin/env python

"""
Lists representatives with no participation.
"""

import json
import logging
import sys

def main(program, filename=None, *args):
    """ Main program """
    r = set()
    for i in args: # project data JSON files
        with open(i, 'rb') as stream:
            data = json.load(stream)
            for vote, keys in data.get('votacion').iteritems():
                r.update(keys)
    with open(filename, 'rb') as stream: # representatives index JSON file
        representatives = frozenset(json.load(stream).keys())
    for i in representatives.difference(r):
        print i

if __name__ == '__main__':
    logging.basicConfig(stream=sys.stderr, level=logging.DEBUG)
    main(*sys.argv)

