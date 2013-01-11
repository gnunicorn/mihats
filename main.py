#!/usr/bin/env python

import webapp2
import models

from utils import verified_api_request


class MainHello(webapp2.RequestHandler):

    @verified_api_request
    def get(self):
        return {"access": "granted"}

    @verified_api_request
    def post(self):
        return {"access": "granted"}

app = webapp2.WSGIApplication([
    ('./*', MainHello)
], debug=True)
