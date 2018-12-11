import cherrypy
import os

class Reykunyu(object):
    """Weptseng fte ralpiveng aylì'ut leNa'vi."""

    aylìu = [
        {
            "na'vi": "kaltxì",
            "fnel": "n",
            "lì'upam": "kal-TXÌ",
            "sìralpeng": {
                "en": "hello",
                "de": "hallo",
                "nl": "hallo",
                "fr": "bonjour"
            },
            "aysätare": ["kxì/n"]
        }
    ]

    def kanom_sìeyngit(self, tìpawm):
        sìeyngit = []
        for lìu in self.aylìu:
            if lìu["na'vi"] == tìpawm:
                sìeyngit.append(lìu)
        return sìeyngit

    @cherrypy.expose
    @cherrypy.tools.json_out()
    def fwew(self, tìpawm=''):
        """
        Txina fya'o fte fwivew aylì'ut.
        tìpawm -- aylì'u a new fwivew
        """
        return {
            "tìpawm": tìpawm,
            "sì'eyng": self.kanom_sìeyngit(tìpawm)
        }

if __name__ == '__main__':

    # aysyon vefyayä
    conf = {
        '/': {
            'tools.staticdir.on': True,
            'tools.staticdir.root': os.path.abspath(os.getcwd()),
            'tools.staticdir.dir': 'fraporu',
            'tools.staticdir.index': 'txin.html'
        }
    }

    # vefyati sngeykä'i
    cherrypy.quickstart(Reykunyu(), '/', conf)

