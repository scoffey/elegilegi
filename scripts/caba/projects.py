#!/usr/bin/env python

"""
Initial import script for CABA projects.
"""

import json
import logging
import sys

def extract(stream):
    name = stream.readline().strip()
    url = stream.readline().strip()
    key = ''
    voting = {}
    for line in stream.readlines():
        s = line.strip()
        if not s:
            continue
        if s.endswith(':'):
            key = s[:-1]
        else:
            if key not in voting:
                voting[key] = []
            voting[key].append(s)
    return {
        'nombre': name,
        'url': url,
        'fecha': '',
        'asunto': '',
        'sumario': '',
        'votacion': voting
    }

def main(program, *args):
    for filename in args:
        outfile = filename.split('.', 1)[0] + '.json'
        logging.info('Extracting data from %s...', filename)
        with open(filename) as stream:
            data = extract(stream)
        with open(outfile, 'wb') as fp:
            json.dump(data, fp, indent=4, sort_keys=True)
        logging.info('Saved in %s: %s', outfile, data['nombre'])
    logging.info('Done!')

if __name__ == '__main__':
    logging.basicConfig(stream=sys.stderr, level=logging.DEBUG)
    main(*sys.argv)

