"""Optional end-to-end profile checks against the dedicated localhost CONNECT fixture."""
import copy
import http.client
import json
import secrets
from urllib.parse import urlsplit


def qualify_profile_permissions(*, admin_url, req, enter, mysql, database, fixture, check):
    url = urlsplit(admin_url)
    assert url.scheme == 'http' and url.hostname == '127.0.0.1' and url.port and not url.username and not url.password
    assert url.path in ('', '/') and not url.query and not url.fragment

    def admin(path, method='GET', body=None):
        connection = http.client.HTTPConnection(url.hostname, url.port, timeout=20)
        headers = {'Origin': admin_url.rstrip('/'), 'Cookie': 'profiles_fixture_actor=1', 'X-CSRF-Token': 'local-ui-csrf'}
        if body is not None:
            headers['Content-Type'] = 'application/json'
        connection.request(method, path, None if body is None else json.dumps(body), headers)
        response = connection.getresponse(); payload = json.loads(response.read()); connection.close()
        assert response.status == 200, (response.status, payload)
        return payload['data']

    listing = admin('/api/v1/admin/profiles')
    profile_id = listing['assignments']['2']

    def actions(values):
        current = admin('/api/v1/admin/profiles')
        profile = next(p for p in current['profiles'] if p['id'] == profile_id)
        body = {key: value for key, value in profile.items() if key != 'id'}
        body.update(revision=current['revision'], active=True, applications=['rapport'], reportActions=values)
        admin('/api/v1/admin/profiles/' + profile_id, 'PUT', body)

    before = mysql('SELECT public_id,owner_provider,owner_id,HEX(payload_json) FROM rapport_reports ORDER BY public_id;', database)
    source = copy.deepcopy(fixture)
    source['reference_dossier'] = 'RECETTE-PROFILS-DROITS-20261117'
    report_id = secrets.token_hex(16)
    payload = json.dumps(source, ensure_ascii=False, separators=(',', ':')).encode()
    mysql("INSERT INTO rapport_reports(public_id,title,reference_code,address,payload_json,payload_bytes,owner_provider,owner_id,owner_email,created_by_id,updated_by_id) VALUES ('"
          + report_id + "','Dossier complet fictif','RECETTE-PROFILS-DROITS-20261117','Adresse fictive',CONVERT(0x"
          + payload.hex() + " USING utf8mb4)," + str(len(payload)) + ",'avereo_connect','2','','2','2');", database)
    cookie = enter(2)
    path = '/api/reports.php?id=' + report_id
    actions(['read', 'export'])
    opened = req(path, cookie)
    check('Managed reader reopens complete server payload', opened[0] == 200 and json.loads(opened[2])['report']['payload'] == source)
    content = json.dumps({'id': report_id, 'report': source}).encode()
    headers = {'Content-Type': 'application/json'}
    check('Managed reader cannot update by direct API', req('/api/reports.php', cookie, 'POST', content, headers)[0] == 403)
    check('Managed reader cannot create by direct API', req('/api/reports.php', cookie, 'POST', json.dumps({'report': source}).encode(), headers)[0] == 403)
    check('Managed reader cannot delete by direct API', req(path, cookie, 'DELETE')[0] == 403)
    check('Allowed complete JSON download', req(path + '&download=1', cookie)[0] == 200)
    check('Allowed official client export authorization', req('/api/auth.php?action=authorize-export', cookie, 'POST', b'{}', headers)[0] == 200)
    actions(['read'])
    check('Same open session loses JSON export after profile edit', req(path + '&download=1', cookie)[0] == 403)
    check('Same open session loses official Word export authorization', req('/api/auth.php?action=authorize-export', cookie, 'POST', b'{}', headers)[0] == 403)
    user = json.loads(req('/api/auth.php?action=me', cookie)[2])['user']
    check('Fresh user response exposes current restricted actions', user['profileAccess']['actions'] == ['read'])
    actions(['read', 'create', 'update', 'delete', 'export'])
    changed = copy.deepcopy(source); changed['titre'] = 'Modification autorisée — recette'
    written = req('/api/reports.php', cookie, 'POST', json.dumps({'id': report_id, 'report': changed}).encode(), headers)
    check('Explicitly allowed update succeeds', written[0] == 200)
    check('Allowed update readback is exact', json.loads(req(path, cookie)[2])['report']['payload'] == changed)
    foreign = mysql("SELECT public_id FROM rapport_reports WHERE owner_id='101' LIMIT 1;", database).decode().strip()
    check('Profile cannot grant another owner read access', req('/api/reports.php?id=' + foreign, cookie)[0] == 404)
    check('Profile cannot grant another owner write access', req('/api/reports.php', cookie, 'POST', json.dumps({'id': foreign, 'report': source}).encode(), headers)[0] == 403)
    created = req('/api/reports.php', cookie, 'POST', json.dumps({'report': source}).encode(), headers)
    check('Explicitly allowed create succeeds', created[0] == 200)
    created_id = json.loads(created[2])['report']['id']
    owner = mysql("SELECT owner_id FROM rapport_reports WHERE public_id='" + created_id + "';", database).strip()
    check('Created dossier belongs to CONNECT identity', owner == b'2')
    check('Explicitly allowed delete succeeds', req('/api/reports.php?id=' + created_id, cookie, 'DELETE')[0] == 200)
    restored = req('/api/reports.php', cookie, 'POST', content, headers)
    check('Full fixture restored after permitted update', restored[0] == 200)
    actions(['read', 'export'])
    fresh = enter(2)
    check('Fresh session reopens complete server content', json.loads(req(path, fresh)[2])['report']['payload'] == source)
    check('Fresh session retains profile and source owner', json.loads(req('/api/auth.php?action=me', fresh)[2])['user']['profileAccess']['profile']['id'] == profile_id
          and mysql("SELECT owner_id FROM rapport_reports WHERE public_id='" + report_id + "';", database).strip() == b'2')
    after = mysql("SELECT public_id,owner_provider,owner_id,HEX(payload_json) FROM rapport_reports WHERE public_id<>'" + report_id + "' ORDER BY public_id;", database)
    check('Existing fictitious source rows and owners remain exact', before == after)
    return {'profileId': profile_id, 'account': 2, 'reportId': report_id, 'reference': source['reference_dossier'],
            'admin': admin_url, 'newSessionCompletePayloadExact': True, 'sourceRowsAndOwnersExact': True}
