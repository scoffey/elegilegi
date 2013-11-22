#!/usr/bin/env python

import datetime
import json
import logging
import os

import webapp2

from controller.main import MainHandler
from model.proyectos import Proyecto

_HERE_DIR = os.path.dirname(__file__)

class ProjectListController(MainHandler):
    TEMPLATE = 'proyectos.html'

    def _get_data(self):
        q = Proyecto.all() \
            .filter('periodo =', 2013) \
            .filter('camara =', 'D') \
            .filter('tipo =', 'de ley') \
            .order('expediente')
        return {'proyectos': q.fetch(limit=100)}

class ProjectInfoController(MainHandler):
    TEMPLATE = 'proyecto.html'

    def _get_data(self):
        key = self.request.path.split('/')[2]
        p = Proyecto.get_by_key_name(key)
        if p is None:
            raise webapp2.exc.HTTPNotFound('Project not found: %s' % key)
        project = dict((i, getattr(p, i)) for i in dir(p) \
                if not i.startswith('_'))
        project['id'] = key
        return project

class ProjectLoadController(MainHandler):
    TEMPLATE = 'proyectos.html'

    def _get_data(self):
        filename = os.path.join(os.path.dirname(_HERE_DIR), \
                'static', 'data', 'proyectos', '2013-hcdn.json')
        with open(filename, 'rb') as stream:
            projects = json.load(stream)
        n = 100
        ids = projects.keys()
        ids.sort()
        results = []
        for i in xrange(0, len(ids), n):
            batch = ids[i:i+n]
            ps = Proyecto.get_by_key_name(batch)
            existing = [p.key().name() for p in ps if p is not None]
            for j in batch:
                if j not in existing:
                    p = self._make_project(j, projects[j])
                    results.append(p)
            if len(results) >= n:
                break
        results.sort(key=lambda p: p.key().name())
        return {'proyectos': results}

    def _make_project(self, _id, p):
        expediente, camara, periodo = _id.split('-')
        fecha = None
        if p['fecha'] is not None:
            fecha = datetime.date(*map(int, p['fecha'].split('-')))
        return Proyecto.get_or_insert(_id,
            periodo=int(periodo),
            tramite=int(p['tramite'] or 0),
            expediente=int(expediente),
            camara=camara.upper(),
            tipo=p['tipo'],
            nombre=p['nombre'],
            sumario=p['sumario'],
            url=p['url'],
            fecha=fecha,
            firmantes=p['firmantes'],
            comisiones=p['comisiones']
        )

app = webapp2.WSGIApplication([
    ('/proyectos', ProjectListController),
    ('/proyectos/_load', ProjectLoadController),
    ('/proyectos/.*', ProjectInfoController),
])
