from google.appengine.ext import ndb


class Hat(ndb.Model):
    added = ndb.DateTimeProperty('a', auto_now_add=True)
    what = ndb.StringProperty('wa')
    what_link = ndb.StringProperty('wal', required=False)
    where = ndb.StringProperty('we')
    preposition = ndb.StringProperty('p')
    where_link = ndb.StringProperty('wel', required=False)
    since = ndb.StringProperty('s', required=False)
    until = ndb.StringProperty('u', required=False)

    def as_json(self):
        return dict([(x, getattr(self, x)) \
            for x in ('what', 'what_link', 'where', 'where_link', 'since', 'preposition', 'until')])


class Profile(ndb.Model):
    # keyname is profile id string
    added = ndb.DateTimeProperty('a', auto_now_add=True)
    last_change = ndb.DateTimeProperty('c', auto_now=True)
    owner_email = ndb.StringProperty('o')
    edit_key = ndb.StringProperty('e')
    theme = ndb.StringProperty('t')
    images = ndb.StringProperty('i', repeated=True)
    current_hats = ndb.StructuredProperty(Hat, repeated=True)
    former_hats = ndb.StructuredProperty(Hat, repeated=True)
