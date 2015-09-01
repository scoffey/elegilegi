#!/usr/bin/env python2.7

import csv
import json
import logging
import re
import sys
import unicodedata

_SLUG_STRIP = re.compile(r'[^\w\s-]')
_SLUG_HYPHENATE = re.compile(r'[-\s]+')

logger = logging.getLogger(__name__)

def slugify(value):
    if not isinstance(value, unicode):
        value = unicode(value)
    value = unicodedata.normalize('NFKD', value).encode('ascii', 'ignore')
    value = _SLUG_STRIP.sub('', value).strip().lower()
    return _SLUG_HYPHENATE.sub('-', unicode(value))

class Project(object):
    def __init__(self, *row):
        self.id = int(row[0])
        self.date = row[1]
        self.house_id = row[2]
        self.senate_id = row[3]
        self.url = row[4]
        self.name = row[5]
        self.summary = row[6]
        self.votes = [[], [], [], []]

    def to_dict(self):
        return {
            'fecha': self.date,
            'nombre': self.name,
            'sumario': self.summary,
            'url': self.url,
            'votacion': {
                'ABSTENCION': sorted(set(self.votes[2])),
                'AFIRMATIVO': sorted(set(self.votes[0])),
                'AUSENTE':    sorted(set(self.votes[3])),
                'NEGATIVO':   sorted(set(self.votes[1])),
            }
        }

class Representative(object):
    def __init__(self, house, *row):
        _alias = {
            u'Ciudad Aut\xf3noma de Buenos Aires': 'CABA',
            u'Cdad.Aut.Bs.As.': 'CABA'
        }
        self.party = None
        self.house = house
        self.district = _alias.get(row[2], row[2])
        self.name = row[1]
        self.id = slugify(self.name)

    def to_dict(self):
        return {
            'bloque': self.party,
            'camara': self.house,
            'distrito': self.district,
            'nombre': self.name
        }

def read_csv(filename):
    with open(filename, 'rb') as stream:
        rows = csv.reader(stream)
        rows.next() #skip header
        for row in rows:
            #logger.debug('Reading %s: %s' % (filename, ','.join(row)))
            yield tuple(unicode(i, 'utf-8') for i in row)

def main(program, filename, *args):
    """ Main program """

    parties = {'house': {}, 'senate': {}}
    for row in read_csv('bloques-diputados.csv'):
        parties['house'][row[0]] = row[1]
    for row in read_csv('bloques-senado.csv'):
        parties['senate'][row[0]] = row[1]

    projects = {'house': {}, 'senate': {}}
    for row in read_csv(filename):
        p = Project(*row)
        projects['house'][p.house_id] = p
        projects['senate'][p.senate_id] = p

    representatives = {'house': {}, 'senate': {}}
    for row in read_csv('diputados.csv'):
        r = Representative('Diputados', *row)
        representatives['house'][row[0]] = r
    for row in read_csv('senadores.csv'):
        r = Representative('Senado', *row)
        representatives['senate'][row[0]] = r

    keys = projects['house'].keys()
    roster = {}
    for row in read_csv('votaciones-diputados.csv'):
        if row[0] in keys:
            r = representatives['house'][row[1]]
            r.party = parties['house'][row[2]]
            projects['house'][row[0]].votes[int(row[3])].append(r.id)
            roster[r.id] = r.to_dict()
    keys = projects['senate'].keys()
    for row in read_csv('votaciones-senado.csv'):
        if row[0] in keys:
            r = representatives['senate'][row[1]]
            r.party = parties['senate'][row[2]]
            projects['senate'][row[0]].votes[int(row[3])].append(r.id)
            if r.id in roster and \
                    roster[r.id]['camara'].startswith('Diputados'):
                r.house = 'Diputados/Senado'
            roster[r.id] = r.to_dict()

    for p in projects['house'].values(): # projects['senate'] is redundant
        with open('ley-%d.json' % p.id, 'wb') as stream:
            json.dump(p.to_dict(), stream, indent=4)
            logger.info('Successfully saved: ley-%d.json' % p.id)
    with open('legisladores.json', 'wb') as stream:
        json.dump(roster, stream, indent=4)
        logger.info('Successfully saved: legisladores.json')

if __name__ == '__main__':
    logging.basicConfig(stream=sys.stderr, level=logging.DEBUG)
    main(*sys.argv)

