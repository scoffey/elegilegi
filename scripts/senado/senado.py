#!/usr/bin/env python

"""
Initial import script for senado projects.
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
    table = {}
    with open(filename) as stream:
        rows = csv.reader(stream)
        header = rows.next()
        for row in rows:
            r = [i.decode('utf-8') for i in row]
            table[row[0]] = dict(zip(header, r))
    return table

def load_vote(k, vote, data, projects, representatives):
    representative = data['senadores'].get(vote['diputadoId'], '')
    party = data['bloques'].get(vote['bloqueId'], '')
    session = data['asuntos'].get(vote['asuntoId'])
    if k not in projects:
        projects[k] = {
            'fecha': session['fecha'] + ' ' + session['hora'],
            'asunto': session['asunto'],
            'votacion': {}
        }
        logging.debug('Loading: %s', session['asunto'])
    vote_map = ['AFIRMATIVO', 'NEGATIVO', 'ABSTENCION', 'AUSENTE']
    v = vote_map[int(vote['voto'])]
    if v not in projects[k]['votacion']:
        projects[k]['votacion'][v] = []
    name = slugify(representative['nombre'])
    projects[k]['votacion'][v].append(name)
    representatives[name] = {
        'nombre': representative['nombre'],
        'bloque': party['bloque'],
        'distrito': representative['distrito']
    }

def save(filename, data):
    with open(filename, 'wb') as fp:
        json.dump(data, fp, indent=4, sort_keys=True)

def main(program, *args):
    """ Main program """
    projects = {}
    representatives = {}
    data = {
        'senadores': load('senadores.csv'),
        'proyectos': load('proyectos.csv'),
        'bloques': load('bloques-senado.csv'),
        'asuntos': load('asuntos-senado.csv')
    }
    project_map = dict((i['asuntoId'], i['proyectoId']) for i in \
            data['proyectos'].itervalues())
    with open('votaciones-senado.csv') as stream:
        rows = csv.reader(stream)
        header = rows.next()
        for row in rows:
            if row[0] in project_map:
                k = project_map[row[0]]
                r = [i.decode('utf-8') for i in row]
                vote = dict(zip(header, r))
                load_vote(k, vote, data, projects, representatives)

    #logging.debug('Saving index json file...')
    #save('index.json', projects.keys())
    logging.debug('Saving representatives json file...')
    save('legisladores.json', representatives)
    logging.debug('Saving %d json files...', len(projects))
    for k, v in projects.iteritems():
        save(k + '.json', v)
    logging.debug('Done!')

if __name__ == '__main__':
    logging.basicConfig(stream=sys.stderr, level=logging.DEBUG)
    main(*sys.argv)

