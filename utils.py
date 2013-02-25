
from google.appengine.ext.ndb import Key
from google.appengine.api import users

from jerry.app_engine import Provider
import config

import hmac
import hashlib
import binascii
import webapp2
import json
import urllib
import os



def _get_user():
    user = users.get_current_user()
    if not user:
        webapp2.abort(400, "User needs to be logged in")
    return user


def verify_user(func):
    def wrapped(self, *args, **kwargs):
        self.user = _get_user()
        return func(self, *args, **kwargs)
    return wrapped


def understand_post(func):
    def wrapped(self, *args, **kwargs):
        params = self.request.POST
        if not params:
            params = json.loads(self.request.body)
        return func(self, params, *args, **kwargs)
    return wrapped


def as_json(fun):
    def wrapped(handler, *args, **kwargs):
        handler.response.content_type = "application/json"
        wrap_it = not handler.request.params.get("_raw")
        debug = not handler.request.params.get("_debug")
        try:
            res = fun(handler, *args, **kwargs)
            if wrap_it:
                res = {"status": "success", "result": res}
            handler.response.write(json.dumps(res))
        except webapp2.HTTPException, exc:
            if debug:
                raise
            handler.response.status = exc.code
            handler.response.write(json.dumps({
                "status": "error",
                "message": "{}".format(exc.message)
            }))
        except Exception, exc:
            if debug:
                raise
            handler.response.status = 500
            handler.response.write(json.dumps({
                "status": "error",
                "message": "{}".format(exc.message)
            }))
    return wrapped

_jerry = Provider(**config.jerry)

def get_jerry_profile(key):
    return _jerry.signin(user_id=key)


def verified_api_request(func):
    # def wrapped(handler, *args, **kwargs):
    #     handler.user = _get_user()
    #     return func(handler, *args, **kwargs)
    return as_json(func)
