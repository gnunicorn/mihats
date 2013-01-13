from google.appengine.ext import ndb


class Hat(ndb.Model):
    added = ndb.DateTimeProperty('a', auto_now_add=True)
    what = ndb.StringProperty('wa')
    what_link = ndb.StringProperty('wal', required=False)
    where = ndb.StringProperty('we')
    where_link = ndb.StringProperty('wel', required=False)
    since = ndb.DateTimeProperty('s', required=False)
    until = ndb.DateTimeProperty('u', required=False)


class Profile(ndb.Model):
    # keyname is profile id string
    owner_email = ndb.StringProperty('o')
    edit_key = ndb.StringProperty('e')
    current_hats = ndb.StructuredProperty(Hat)
    former_hats = ndb.StructuredProperty(Hat)
