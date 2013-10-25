#!/usr/bin/env python

"""
Dumps candidates lists by district and house.
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

def get_data(row):
    district, party, candidate, house = row
    n, name = candidate.split('-', 2)
    h = 'Senado' if house.startswith('Senado') else 'Diputados'
    return (district, h, party, int(n.strip()), name.strip())

def main(program, *args):
    """ Main program """
    lists = {}
    items = {}
    for row in load('candidatos.csv'):
        district, house, party, n, name = get_data(row)
        if district not in lists:
            lists[district] = {}
            items[district] = {}
        if house not in lists[district]:
            lists[district][house] = {}
            items[district][house] = {}
        if party not in items[district][house]:
            lists[district][house] = []
            items[district][house][party] = {}
        items[district][house][party][n] = name
    for district in items:
        for house in items[district]:
            parties = items[district][house].items()
            parties.sort(key=lambda party: slugify(party[0]))
            for party in parties:
                slugs = party[1].items()
                slugs.sort()
                lists[district][house].append({
                    'lista': party[0],
                    'candidatos': [i[1] for i in slugs]
                })
    logging.debug('Done!')
    json.dump(lists, sys.stdout, indent=4, sort_keys=True)

if __name__ == '__main__':
    logging.basicConfig(stream=sys.stderr, level=logging.DEBUG)
    main(*sys.argv)

