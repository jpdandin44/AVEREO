"""Private multi-project checks, called inside the real PHP HTTP fixture."""
import copy
import json


def verify(request, check, token, project, private):
    def workspace(method='GET', body=None, user='1', **kwargs):
        return request(method, body, token, user=user, route='workspace', **kwargs)

    original = (private / 'current.json').read_bytes()
    status, catalog, _ = workspace()
    check(status == 200 and len(catalog['projects']) == 1 and catalog['projects'][0]['id'] == 'principal', 'existing planning discovered')
    check(not (private / 'workspace.json').exists() and (private / 'current.json').read_bytes() == original, 'GET leaves existing planning and catalogue unchanged')
    check(workspace(user=None)[0] == 401 and workspace(user='2')[0] == 403, 'catalogue private to owner')
    check(workspace(user='expired')[0] == 401, 'catalogue expired session rejected')
    check(workspace('POST', {'action': 'create', 'revision': 0, 'project': project}, origin_header='https://other.invalid')[0] == 403, 'catalogue origin protected')
    check(request('POST', {'revision': 0, 'action': 'create', 'project': project}, route='workspace')[0] == 403, 'catalogue CSRF required')
    check(workspace('DELETE')[0] == 405, 'no permanent deletion')

    def change(action, **values):
        nonlocal catalog
        code, result, _ = workspace('POST', dict(revision=catalog['revision'], action=action, **values))
        check(code == 200, 'workspace ' + action + ' succeeds: ' + str(result.get('error', '')))
        catalog = result
        return result

    imported = copy.deepcopy(project)
    imported['name'] = '<script>Un dossier indépendant</script>'
    created = change('create', project=imported, client='Client fictif')['createdId']
    check(created.startswith('p-') and len(catalog['projects']) == 2, 'independent opaque project id')
    check(request(path='?project=' + created)[1]['project'] == imported, 'full imported document preserved')
    check((private / 'current.json').read_bytes() == original, 'creation never replaces principal')
    check(request(path='?project=../current.json')[0] == 404 and request(path='?project[]=principal')[0] == 404, 'path traversal and array identifier refused')
    check(request(path='?project=p-' + 'a' * 32)[0] == 404, 'unknown project refused')
    check(request(path='?project=' + created, user='2')[0] == 403, 'another account cannot read a known id')
    changed = dict(imported, name='Titre actualisé')
    body = {'revision': 1, 'project': changed}
    check(request('PUT', body, token, path='?project=' + created)[1]['revision'] == 2, 'independent project save')
    check(request('PUT', body, token, path='?project=' + created)[0] == 409, 'independent project revision conflict')
    check(request(path='?project=' + created + '&version=previous')[1]['project'] == imported, 'per-project previous backup')
    check((private / 'current.json').read_bytes() == original, 'other planning still byte identical')
    check(next(p for p in workspace()[1]['projects'] if p['id'] == created)['name'] == changed['name'], 'list title derived from saved planning')
    stale = catalog['revision']
    change('preferences', preferences={'zoom': 'days', 'collapsed': False})
    check(workspace()[1]['preferences'] == {'zoom': 'days', 'collapsed': False}, 'preferences recovered by independent request')
    check(workspace('POST', {'revision': stale, 'action': 'archive', 'id': created})[0] == 409, 'stale catalogue cannot archive')
    change('client', id=created, client='Référence corrigée')
    change('archive', id=created)
    check(next(p for p in catalog['projects'] if p['id'] == created)['archivedAt'] is not None, 'archive remains listed')
    check(request('PUT', {'revision': 2, 'project': imported}, token, path='?project=' + created)[0] == 409, 'archived project rejects stale tab writes')
    check(request(path='?project=' + created)[1]['project'] == changed, 'archive retains full planning')
    change('restore', id=created)
    check(request('PUT', {'revision': 2, 'project': imported}, token, path='?project=' + created)[1]['revision'] == 3, 'restored project writable')
    change('archive', id='principal')
    check(request('PUT', {'revision': 3, 'project': project}, token)[0] == 409, 'legacy tab cannot write archived principal')
    change('restore', id='principal')
    check(workspace('POST', {'revision': catalog['revision'], 'action': 'preferences', 'preferences': {'zoom': 'invalid', 'collapsed': True}})[0] == 422, 'invalid preference refused')
    path = private / 'workspace.json'; before = path.read_bytes()
    path.write_text('{broken', encoding='utf-8')
    check(workspace()[0] == 503 and request()[0] == 503, 'corrupt catalogue fails closed')
    check(workspace('POST', {'revision': catalog['revision'], 'action': 'create', 'project': project})[0] == 503, 'corrupt catalogue not overwritten')
    path.write_bytes(before)
    check(workspace()[0] == 200 and (private / 'current.json').read_bytes() == original, 'catalogue copy restored with original planning unchanged')
