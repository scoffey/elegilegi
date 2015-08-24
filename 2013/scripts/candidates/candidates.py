#!/usr/bin/env python

"""
Matches candidates data with existing representatives data.
"""

import csv
import json
import logging
import re
import sys
import unicodedata

_SLUG_STRIP = re.compile(r'[^\w\s-]')
_SLUG_HYPHENATE = re.compile(r'[-\s]+')

def slugify(value):
    value = unicodedata.normalize('NFKD', value).encode('ascii', 'ignore')
    value = _SLUG_STRIP.sub('', value).strip().lower()
    return _SLUG_HYPHENATE.sub('-', unicode(value))

def load(filename):
    with open(filename) as stream:
        rows = csv.reader(stream)
        header = rows.next()
        for row in rows:
            yield [i.decode('utf-8') for i in row]

def get_lastnames(representatives):
    lastnames = {}
    for k, v in representatives.iteritems():
        if ',' not in v['nombre']:
            logging.warning('No last name: %r', v)
        i = slugify(v['nombre'].split(',', 2)[0].strip())
        if i not in lastnames:
            lastnames[i] = []
        item = v.copy()
        item['id'] = k
        lastnames[i].append(item)
    return lastnames

def get_data(row):
    district, party, candidate, house = row
    n, name = candidate.split('-', 2)
    n = int(n.strip())
    name = name.strip()
    data = {
        'orden': n,
        'distrito': district,
        'camara': 'Senado' if house.startswith('Senado') else 'Diputados',
        'lista': party
    }
    return (name, data)

def confirm(prompt):
    user_input = None
    while user_input not in ('y', 'n'):
        user_input = raw_input(prompt.encode('utf-8')).strip().lower()
        if user_input == 'y':
            return True
    return False

def match(representatives, lastnames, name, data):
    k = slugify(name)
    i = slugify(name.split(',', 2)[0].strip())
    if k in representatives:
        representatives[k]['candidatura'] = data
        logging.info('Found exact match for: %s', name)
    elif i in lastnames:
        logging.info('Found %d possible matches for: %s', \
                len(lastnames[i]), name)
        for j in lastnames[i]:
            prompt = '%s == %s? [y/n]: ' % (name, j['nombre'])
            if confirm(prompt):
                representatives[j['id']]['candidatura'] = data
    else:
        logging.info('No matches found for: %s', name)

def main(program, filename=None, *args):
    """ Main program """
    with open(filename) as stream:
        representatives = json.load(stream)
    lastnames = get_lastnames(representatives)
    for row in load('candidatos.csv'):
        name, data = get_data(row)
        try:
            match(representatives, lastnames, name, data)
        except EOFError:
            break
    logging.debug('Done!')
    json.dump(representatives, sys.stdout, indent=4, sort_keys=True)

if __name__ == '__main__':
    logging.basicConfig(stream=sys.stderr, level=logging.DEBUG)
    main(*sys.argv)

