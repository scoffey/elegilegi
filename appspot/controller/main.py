#!/usr/bin/env python

import base64
import datetime
import hashlib
import hmac
import json
import logging
import os

import webapp2
from google.appengine.ext.webapp import template
from google.appengine.ext.webapp.util import run_wsgi_app

_FB_APP_SECRET = os.environ.get('FB_APP_SECRET')
_HERE_DIR = os.path.dirname(__file__)

def base64_url_decode(s):
    padding_factor = (4 - len(s) % 4) % 4
    s += '=' * padding_factor
    d = dict(zip(map(ord, u'-_'), u'+/'))
    return base64.b64decode(unicode(s).translate(d))

def parse_signed_request(signed_request, secret=_FB_APP_SECRET):
    encoded_sig, payload = signed_request.split('.', 2)
    sig = base64_url_decode(encoded_sig)
    data = json.loads(base64_url_decode(payload))
    if data.get('algorithm').upper() == 'HMAC-SHA256':
        expected_sig = hmac.new(secret, msg=payload, \
                digestmod=hashlib.sha256).digest()
        if sig == expected_sig:
            return data
    return None

class MainHandler(webapp2.RequestHandler):
    TEMPLATE = 'index.html'

    def get(self):
        self._render_template(self.TEMPLATE, self._get_data())

    def post(self):
        signed_request = self.request.get('signed_request')
        if signed_request:
            domain = self.request.host.split(':', 1)[0]
            payload = parse_signed_request(signed_request)
            for k in ('user_id', 'oauth_token'):
                self.response.set_cookie('fb_' + k, payload[k], \
                        max_age=86400, path='/', \
                        domain=domain, secure=True)
        self.get()

    def _render_template(self, filename, data=None):
        path = os.path.join(os.path.dirname(_HERE_DIR), 'view', filename)
        self.response.out.write(template.render(path, data))

    def _get_data(self):
        return {'server_time': str(datetime.datetime.utcnow())}

app = webapp2.WSGIApplication([
    ('/', MainHandler),
])

if __name__ == '__main__':
    run_wsgi_app(app)

