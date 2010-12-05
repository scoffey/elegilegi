#!/usr/bin/env python

from datetime import date
import json
import os

from google.appengine.ext import webapp
from google.appengine.ext.webapp import template

from model.base import Proyecto, Legislador, Votacion

class LoaderHandler(webapp.RequestHandler):
    """ Handles GET and POST requests to /api/loader API """

    def get(self):
        output = template.render('assets/templates/loader.html', {})
        self.response.out.write(output)

    def post(self):
        data = json.loads(self.request.get('content', '') or '[]')
        for proyecto in data.get('proyectos', []):
            if proyecto.get('sumario_texto') and \
                    proyecto.get('camara_origen_expediente'):
                t = self.load(proyecto, data)
                u = [dict((j, getattr(i, j)) for j in dir(i)) for i in t]
                self.response.out.write('\n'.join(repr(i) for i in u))
                # TODO

    def load(self, proyecto, data):
        proyecto = Proyecto(
            id=proyecto.get('camara_origen_expediente'),
            acta=data.get('acta_descripcion'),
            nombre=proyecto.get('sumario_texto'),
            origen=proyecto.get('origen'),
            periodo=data.get('periodo_numero'),
            tipo_votacion=data.get('votacion_tipo'),
            sesion=data.get('sesion_numero'),
            fecha=date(*(int(i) for i in data.get('fecha').split('-'))),
        )
        legislador = Legislador(
            id=data.get('diputado_id'),
            nombre=None,
            apellido=data.get('diputado_nombre'),
            bloque=data.get('bloque_nombre'),
            provincia=data.get('provincia_nombre'),
            camara='Diputados'
        )
        proyecto.put()
        legislador.put()
        votodict = {'afirmativo': 1, 'negativo': -1, 'abstencion': 0}
        votacion = Votacion(
            proyecto=proyecto.key(),
            legislador=legislador.key(),
            voto = votodict.get(data.get('voto').strip().lower(), None)
        )
        votacion.put()
        return (proyecto, legislador, votacion)

class QueryHandler(webapp.RequestHandler):
    """ Handles GET and POST requests to /api/query API """

    def get(self):
        votos = dict((i, self.request.get(i)) for i in \
                self.request.arguments())
        #p = Proyecto.all()[0] # NEGRO
        #self.response.out.write(p.id)
        # TODO

