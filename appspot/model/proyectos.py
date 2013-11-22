#!/usr/bin/env python

from google.appengine.ext import db

class Proyecto(db.Model):
    periodo = db.IntegerProperty()
    tramite = db.IntegerProperty()
    expediente = db.IntegerProperty()
    camara = db.StringProperty()
    tipo = db.StringProperty()
    nombre = db.StringProperty()
    sumario = db.TextProperty()
    url = db.StringProperty()
    fecha = db.DateProperty()
    firmantes = db.StringListProperty()
    comisiones = db.StringListProperty()

