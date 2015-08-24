#!/usr/bin/env python

"""
Merges senado and hcdn representatives.
"""

import json
import logging
import sys

def main(program, d=None, s=None, bl=None, *args):
    """ Main program """

    with open(d, 'rb') as stream:
        a = json.load(stream)
    with open(s, 'rb') as stream:
        b = json.load(stream)
    with open(bl, 'rb') as stream:
        blacklist = frozenset(i.decode('utf-8').strip() for \
                i in stream.readlines())

    merged = {}
    for k, v in a.iteritems():
        if k not in blacklist:
            merged[k] = v
            merged[k]['camara'] = 'Diputados'
    for k, v in b.iteritems():
        merged[k] = v
        merged[k]['camara'] = 'Diputados/Senado' if k in a else 'Senado'

    json.dump(merged, sys.stdout, indent=4, sort_keys=True)


if __name__ == '__main__':
    logging.basicConfig(stream=sys.stderr, level=logging.DEBUG)
    main(*sys.argv)

