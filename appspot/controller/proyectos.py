#!/usr/bin/env python

import json
import os

import webapp2

from controller.main import MainHandler

_HERE_DIR = os.path.dirname(__file__)

class ProjectListController(MainHandler):
    TEMPLATE = 'proyectos.html'

class ProjectInfoController(MainHandler):
    TEMPLATE = 'proyecto.html'

    def _get_data(self):
        _id = self.request.path.split('/')[2]
        filename = os.path.join(os.path.dirname(_HERE_DIR), \
                'static', 'data', 'proyectos', _id + '.json')
        try:
            with open(filename, 'rb') as stream:
                project = json.load(stream)
        except Exception:
            raise webapp2.exc.HTTPNotFound('Project not found: %s' % _id)
        return project

app = webapp2.WSGIApplication([
    ('/proyectos', ProjectListController),
    ('/proyectos/.*', ProjectInfoController),
])
