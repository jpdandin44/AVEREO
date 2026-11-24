"""Additional checks in the disposable two-account localhost fixture, never hosted."""
import copy
import json


def qualify_technical_reports(*, req, enter, save, mysql, database, fixture, check, config, write_config):
    snapshot = mysql('SELECT public_id,owner_provider,owner_id,HEX(payload_json) FROM rapport_reports ORDER BY public_id;', database)
    technical = copy.deepcopy(fixture)
    technical.update(categorie='Expertise & Visite technique', profil_metier='', sous_categorie='',
                     mission_technique={'objet':'Mission fictive technique','perimetre':'Façade','limites':'Sans sondage'})
    technical['observations'][0].update(mesures_techniques='12 mm fictifs', references_techniques='https://example.org/',
                                        verifications_techniques='Contrôle fictif', limites_techniques='Visuel')
    created_ids = []
    try:
        ordinary, admin = enter(101), enter(1)
        check('Technical capability absent without grant', json.loads(req('/api/auth.php?action=me', ordinary)[2])['user']['reportCapabilities']['technicalReport'] is False)
        check('Technical create denied server-side without grant', save(ordinary, technical)[0] == 403)
        spoof = copy.deepcopy(technical); spoof.update(profil_metier='architecte', reportCapabilities={'technicalReport':True})
        check('Declared profession and forged payload grant no technical access', save(ordinary, spoof)[0] == 403)
        unclassified=copy.deepcopy(technical);unclassified.pop('categorie')
        check('Missing category cannot bypass technical creation guard',save(ordinary,unclassified)[0]==403)
        unclassified['categorie']='unknown'
        check('Unknown category cannot bypass technical creation guard',save(ordinary,unclassified)[0]==403)
        config['technical_report_connect_user_ids'] = ['101']; write_config()
        check('Explicit CONNECT identity receives technical capability', json.loads(req('/api/auth.php?action=me', ordinary)[2])['user']['reportCapabilities']['technicalReport'] is True)
        other = enter(102)
        check('Grant never spreads to another CONNECT account', save(other, technical)[0] == 403)
        result = save(ordinary, technical); check('Explicit grant permits technical creation', result[0] == 200)
        report_id = json.loads(result[2])['report']['id']; created_ids.append(report_id)
        check('New technical owner is authenticated identity', mysql("SELECT owner_id FROM rapport_reports WHERE public_id='"+report_id+"';", database).strip() == b'101')
        fresh = enter(101)
        opened = req('/api/reports.php?id='+report_id,fresh)
        check('Fresh server session retains all technical fields and media', json.loads(opened[2])['report']['payload'] == technical)
        check('Technical dossier remains private from other account', req('/api/reports.php?id='+report_id,other)[0] == 404)
        config['technical_report_connect_user_ids'] = []; write_config()
        check('Grant revocation stops new technical copies', save(fresh, technical)[0] == 403)
        check('Existing technical dossier still follows historical update rights', save(fresh, technical, report_id)[0] == 200)
        global_report = copy.deepcopy(fixture); global_report['categorie']='Visite Globale'
        result=save(fresh,global_report);check('Global creation stays available without technical grant',result[0]==200)
        global_id=json.loads(result[2])['report']['id'];created_ids.append(global_id)
        check('Unauthorized global-to-technical conversion refused',save(fresh,technical,global_id)[0]==403)
        invalid=copy.deepcopy(technical);invalid['mission_technique']['objet']=[]
        check('Malformed technical fields rejected without mutation',save(fresh,invalid,report_id)[0]==400)
        invalid=copy.deepcopy(technical);invalid['observations'][0]['mesures_techniques']=None
        check('Explicit null technical text rejected',save(fresh,invalid,report_id)[0]==400)
        check('Administrator keeps technical creation capability',json.loads(req('/api/auth.php?action=me',admin)[2])['user']['reportCapabilities']['technicalReport'] is True)
        return {'status':'passed','newSessionPayloadExact':True,'serverAuthorizationTested':True}
    finally:
        config.pop('technical_report_connect_user_ids',None);write_config()
        for report_id in created_ids:
            req('/api/reports.php?id='+report_id,enter(1),'DELETE')
        check('Existing source rows and owners exact after technical recipe',snapshot==mysql('SELECT public_id,owner_provider,owner_id,HEX(payload_json) FROM rapport_reports ORDER BY public_id;',database))
