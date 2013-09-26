#!/usr/bin/env python

import csv
import json
import logging
import re
import sys
import unicodedata

_SLUG_STRIP = re.compile(r'[^\w\s-]')
_SLUG_HYPHENATE = re.compile(r'[-\s]+')

def slugify(value):
    if not isinstance(value, unicode):
        value = unicode(value)
    value = unicodedata.normalize('NFKD', value).encode('ascii', 'ignore')
    value = _SLUG_STRIP.sub('', value).strip().lower()
    return _SLUG_HYPHENATE.sub('-', unicode(value))

def load(row, projects, representatives):
    r = [i.decode('latin-1') for i in row]
    k = slugify(r[4])
    if k not in projects:
        projects[k] = {
            'fecha': r[1],
            'asunto': r[4],
            'votacion': {}
        }
        logging.debug('Loading: %s', r[4])
    v = r[8]
    if v not in projects[k]['votacion']:
        projects[k]['votacion'][v] = []
    name = slugify(r[5])
    projects[k]['votacion'][v].append(name)
    representatives[name] = {
        'nombre': r[5],
        'bloque': r[6],
        'distrito': r[7]
    }

def save(filename, data):
    with open(filename, 'wb') as fp:
        json.dump(data, fp, indent=4)

def main(program, *args):
    """ Main program """
    projects = {}
    representatives = {}
    rows = csv.reader(sys.stdin)
    rows.next() # skip header
    for row in rows:
        load(row, projects, representatives)
    logging.debug('Saving index json file...')
    save('index.json', projects.keys())
    logging.debug('Saving representatives json file...')
    save('legisladores.json', representatives)
    logging.debug('Saving %d json files...', len(projects))
    for k, v in projects.iteritems():
        save(k + '.json', v)
    logging.debug('Done!')

if __name__ == '__main__':
    logging.basicConfig(stream=sys.stderr, level=logging.DEBUG)
    main(*sys.argv)

