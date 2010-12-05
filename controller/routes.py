#!/usr/bin/env python

from controller.base import LoaderHandler, QueryHandler

routes = [
    ('/api/loader', LoaderHandler),
    ('/api/query', QueryHandler),
]

