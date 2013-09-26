#!/usr/bin/env python
# -*- coding: utf-8 -*-

"""
Initial import script for CABA representatives.
"""

import csv
import json
import logging
import re
import sys
import unicodedata

_SLUG_STRIP = re.compile(r'[^\w\s-]')
_SLUG_HYPHENATE = re.compile(r'[-\s]+')

_PARTIES = {
	'BpU': 'Bases para la Unión',
	'BApT': 'Buenos Aires para Todos',
	'CC': 'Coalición Cívica - ARI',
	'CP': 'Confianza Pública',
	'FPV': 'Frente para la Victoria',
	'FPyP': 'Frente Progresista y Popular',
	'NE': 'Nuevo Encuentro',
	'PRO': 'Propuesta Republicana',
	'SP': 'Sindical Peronista',
	'MST-SUR': 'MST en Movimiento Proyecto Sur',
	'SUR': 'Proyecto Sur',
	'UCR': 'Unión Cívica Radical'
}

def slugify(value):
    value = unicodedata.normalize('NFKD', value).encode('ascii', 'ignore')
    value = _SLUG_STRIP.sub('', value).strip().lower()
    return _SLUG_HYPHENATE.sub('-', unicode(value))

def main(program, *args):
    representatives = {}
    for line in sys.stdin:
        lastname, suffix = line.decode('utf-8').strip().split(', ')
        firstname, party = suffix.rstrip(')').split(' (')
        representatives[slugify(lastname)] = {
            'nombre': lastname + ', ' + firstname,
            'bloque': _PARTIES.get(party, party),
            'distrito': ''
        }
    json.dump(representatives, sys.stdout, indent=4)

if __name__ == '__main__':
    logging.basicConfig(stream=sys.stderr, level=logging.DEBUG)
    main(*sys.argv)

