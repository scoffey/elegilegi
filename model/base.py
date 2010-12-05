#!/usr/bin/env python

from google.appengine.ext import db

class Proyecto(db.Model):
    id = db.StringProperty()
    nombre = db.StringProperty()
    acta = db.StringProperty()
    origen = db.StringProperty()
    periodo = db.IntegerProperty()
    tipo_votacion = db.StringProperty()
    sesion = db.IntegerProperty()
    fecha = db.DateProperty()

class Legislador(db.Model):
    id = db.IntegerProperty()
    nombre = db.StringProperty()
    apellido = db.StringProperty()
    bloque = db.StringProperty()
    provincia = db.StringProperty()
    camara = db.StringProperty()

class Votacion(db.Model):
    proyecto = db.ReferenceProperty(Proyecto)
    legislador = db.ReferenceProperty(Legislador)
    voto = db.IntegerProperty()

