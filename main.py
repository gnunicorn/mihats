#!/usr/bin/env python

from google.appengine.ext.ndb import Key
from utils import verified_api_request, understand_post
from uuid import uuid4

import webapp2
import models


class CheckProfile(webapp2.RequestHandler):
    @verified_api_request
    def get(self):
        profile_name = self.request.GET.get("profile_name").lower()
        if not profile_name:
            raise ValueError("No 'profile_name' given to check for.")
        profile = Key(models.Profile, profile_name).get()
        return profile is not None


class CheckEditRights(webapp2.RequestHandler):
    @verified_api_request
    def get(self):
        profile_name = self.request.GET.get("profile_name").lower()
        edit_key = self.request.GET.get("key")

        if not profile_name or not edit_key:
            raise ValueError("please specify your 'profile_name' and your 'key'")

        profile = Key(models.Profile, profile_name).get()
        if not profile:
            raise ValueError("Profile unknown.")
        return profile.edit_key == edit_key


class CreateProfile(webapp2.RequestHandler):

    @verified_api_request
    @understand_post
    def post(self, params):
        profile_name = params.get("profile_name").lower()
        email = params.get("email").lower()
        if not profile_name or not email:
            raise ValueError("Please specify 'profile_name' and 'email'.")
        key = Key(models.Profile, profile_name)
        if key.get() is not None:
            raise ValueError("Profile already exists.")

        profile = models.Profile(key=key, owner_email=email, edit_key=uuid4().hex)
        profile.put()
        return {"profile_name": profile_name, "key": profile.edit_key}


class EditProfile(webapp2.RequestHandler):

    @verified_api_request
    def get(self):
        profile_name = self.request.GET.get("profile_name").lower()
        key = Key(models.Profile, profile_name)
        model = key.get()
        if not model:
            raise webapp2.abort("Profile not found", code=404)
        return {"profile_name": key.string_id(), }


class MainHello(webapp2.RequestHandler):

    @verified_api_request
    def get(self):
        return {"access": "granted"}

    @verified_api_request
    def post(self):
        return {"access": "granted"}

app = webapp2.WSGIApplication([
    ('/api/v1/profile/exists', CheckProfile),
    ('/api/v1/profile/can_edit', CheckEditRights),
    ('/api/v1/profile/create', CreateProfile),
    ('/api/v1/profile/', EditProfile),
    ('./*', MainHello)
], debug=True)
