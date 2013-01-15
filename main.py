#!/usr/bin/env python

from google.appengine.ext.ndb import Key
from utils import verified_api_request, understand_post
from uuid import uuid4

import webapp2
import models


class ProfileBase:
    def _get_profile(self, params):
        try:
            profile_name = self.request.GET.get("profile_name").lower()
            if not profile_name:
                raise ValueError()
            key = Key(models.Profile, profile_name)
            model = key.get()
            if not model:
                raise ValueError()
            return model
        except (KeyError, ValueError):
            raise webapp2.abort(404, "Profile not found")

    def _can_edit(self, model, params):
        edit_key = params.get("key")

        if not edit_key:
            raise ValueError("Missing 'key' to verify editing")

        return model.edit_key == edit_key

    def _render_model(self, model):
        return {"profile_name": model.key.string_id(),
                "theme": model.theme,
                "images": model.images,
                "current_hats": [x.as_json() for x in model.current_hats],
                "former_hats": [x.as_json() for x in model.former_hats]}


class CheckProfile(ProfileBase, webapp2.RequestHandler):
    @verified_api_request
    def get(self):
        try:
            model = self._get_profile(self.request.GET)
        except Exception:
            return False
        else:
            return model is not None


class CheckEditRights(ProfileBase, webapp2.RequestHandler):
    @verified_api_request
    def get(self):
        profile = self._get_profile(self.request.GET)
        return self._can_edit(profile, self.request.GET)


class CreateProfile(webapp2.RequestHandler):

    @verified_api_request
    @understand_post
    def post(self, params):
        try:
            model = self._get_model(params)
        except Exception:
            pass
        else:
            if model:
                raise webapp2.abort(400, "Profile already exists")

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


class EditProfile(ProfileBase, webapp2.RequestHandler):

    @verified_api_request
    def get(self):
        return self._render_model(self._get_profile(self.request.GET))

    @verified_api_request
    @understand_post
    def post(self, params):
        model = self._get_profile(params)
        if not self._can_edit(model, params):
            raise webapp2.abort(403, "wrong key specified. Editing denied.")
        to_save = False
        for x in ("theme", "current_hats", "former_hats"):
            attr = params.get(x)
            if attr:
                to_save = True
                setattr(model, x, attr)

        if to_save:
            model.put()
        return self._render_model(model)


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
