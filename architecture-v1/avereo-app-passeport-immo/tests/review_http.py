"""Real private review lifecycle, PDF identity and isolation in the disposable MariaDB fixture."""
import hashlib
import io
import json
import secrets
import zipfile
import os
import subprocess
import tempfile
from pathlib import Path


def run(request, check, owner, second, reviewer, csrf, reviewer_csrf, sql, backup, accounts, directory, client, browser_origin=None, config_path=None):
    def data(response):
        return json.loads(response[2])

    def pdf(text):
        stream=('BT /F1 12 Tf 60 740 Td ('+text.replace('(', r'\(').replace(')', r'\)')+') Tj ET').encode('latin-1',errors='replace')
        objects=[b'<< /Type /Catalog /Pages 2 0 R >>',b'<< /Type /Pages /Kids [3 0 R] /Count 1 >>',b'<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 5 0 R >> >> /Contents 4 0 R >>',b'<< /Length '+str(len(stream)).encode()+b' >>\nstream\n'+stream+b'\nendstream',b'<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>']
        content=b'%PDF-1.4\n'; offsets=[0]
        for i,obj in enumerate(objects,1):
            offsets.append(len(content));content+=str(i).encode()+b' 0 obj\n'+obj+b'\nendobj\n'
        xref=len(content);content+=b'xref\n0 6\n0000000000 65535 f \n'
        for offset in offsets[1:]:content+=f'{offset:010d} 00000 n \n'.encode()
        return content+b'trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n'+str(xref).encode()+b'\n%%EOF\n'

    def package(series, identity=None, note='Initial', corrupt=False, reference='REVUE-FICTIVE', legacy=False):
        identity = identity or secrets.token_hex(16)
        report = {'titre': 'Mission revue', 'reference_dossier': reference, 'reviewSeriesId': series,
                  'observations': [{'id': 'o1', 'observations': note, 'photos': []}], 'ecoute': {'notes': 'SOURCE PRIVEE'}, 'plans': []}
        files = {'dossier-rapport.json': json.dumps(report).encode()}
        for kind in ['client', 'expert']:
            word = io.BytesIO()
            with zipfile.ZipFile(word, 'w') as archive:
                archive.writestr('[Content_Types].xml', '<Types/>')
                archive.writestr('word/document.xml', '<document>Word ' + kind + ' ' + note + '</document>')
            files['rapport-' + kind + '.docx'] = word.getvalue()
            if legacy:
                files['rapport-' + kind + '.pdf'] = pdf(kind + ' ' + note)
        manifest = {'schema': 'avereo-rapport-review', 'version': 1 if legacy else 2, 'id': identity, 'seriesId': series,
                    'title': 'Mission revue fictive', 'reference': reference, 'createdAt': '2026-11-25T10:00:00Z',
                    'validatedByProfessional': False, 'originals': [],
                    'entries': [{'path': name, 'bytes': len(content), 'sha256': hashlib.sha256(content).hexdigest()} for name, content in files.items()]}
        if corrupt:
            files['rapport-client.docx'] += b'changed'
        out = io.BytesIO()
        with zipfile.ZipFile(out, 'w', compression=zipfile.ZIP_STORED) as archive:
            archive.writestr('manifest.json', json.dumps(manifest))
            for name, content in files.items():
                archive.writestr(name, content)
        return out.getvalue(), manifest, files

    workspace = data(request('/api/workspace', owner))
    workspace['biens'].append({'id': 'review-fixture', 'address': 'Bien fictif relecture', 'type': 'Maison', 'size': 100, 'composition': {'chambres': 2, 'sdb': 1, 'sejour': 1, 'cuisine': 1, 'garage': 0}, 'dossier': {'pieces': [], 'attachments': []}})
    check(request('/api/workspace', owner, 'PUT', workspace, csrf)[0] == 200, 'review fixture property created independently')
    base = '/api/biens/review-fixture'
    check(request(base + '/client', owner, 'POST', {'name': 'Client fictif revue'}, csrf)[0] == 200, 'review fixture linked to its own client')
    check(request(base + '/shares', owner, 'POST', {'recipient': 'fixture-44', 'expectedRecipient': 'avereo_connect:44', 'revision': 0, 'confirm': True}, csrf)[0] == 201, 'client sharing exists before private review')

    def submit(content, recipient='fixture-42', expected='avereo_connect:42', revision=None, token=csrf):
        if revision is None:
            revision = data(request(base + '/report-reviews', owner))['revision']
        boundary = secrets.token_hex(16)
        body = b''
        for key, value in [('recipient', recipient), ('expectedRecipient', expected), ('revision', str(revision)), ('confirm', 'true')]:
            body += f'--{boundary}\r\nContent-Disposition: form-data; name="{key}"\r\n\r\n{value}\r\n'.encode()
        body += f'--{boundary}\r\nContent-Disposition: form-data; name="review"; filename="mission.review.avereo.zip"\r\nContent-Type: application/zip\r\n\r\n'.encode() + content
        body += f'\r\n--{boundary}--\r\n'.encode()
        return request(base + '/report-reviews', owner, 'POST', body, token, content_type='multipart/form-data; boundary=' + boundary)

    def change(item, action, cookie=owner, token=csrf, **extra):
        body = {'revision': item['revision'], 'action': action, 'confirm': True,
                'wordSha256': {kind: item['files']['rapport-' + kind + '.docx']['sha256'] for kind in ['client', 'expert']}}
        body.update(extra)
        return request('/api/report-reviews/' + item['id'], cookie, 'PATCH', body, token)

    series = secrets.token_hex(16)
    content, manifest, files = package(series)
    check(submit(content, token='wrong')[0] == 403, 'review upload requires CSRF')
    check(submit(content, expected='avereo_connect:43')[0] == 409, 'reviewer identity rechecked at confirmation')
    check(submit(package(series, corrupt=True)[0])[0] == 422, 'altered review package rejected')
    result = submit(content)
    check(result[0] == 201, ('self review explicitly nominated', result[0], result[2]))
    item = data(result)['review']
    client_share = data(request('/api/shared', client))['shares'][0]['id']
    shared_path = '/api/shared/' + client_share
    check(data(request(shared_path, client))['documents'] == [], 'ordinary client share sees no submitted review document')
    check(request('/api/report-reviews/' + item['id'] + '/file/client', client)[0] == 404, 'client share grants no review access')
    check(submit(content)[0] == 201 and len(data(request(base + '/report-reviews', owner))['reviews']) == 1, 'retry is idempotent without duplicating review')
    check(data(request(base + '/documents', owner))['documents'] == [], 'private submission adds no active client document')
    path = '/api/report-reviews/' + item['id']
    check(request(path + '/file/source', second)[2] == content, 'new independent owner session gets exact private source')
    check(request(path + '/file/word-client', reviewer)[0] == 404, 'unassigned expert cannot read private PDF')
    check(change(item, 'publish', shareRevision=1)[0] == 403, 'unapproved PDF cannot be published')
    check(change(item, 'corrections', comment='')[0] == 422, 'refusal requires a reason')
    wrong = {'client': 'f' * 64, 'expert': item['files']['rapport-expert.docx']['sha256']}
    check(change(item, 'approve', wordSha256=wrong)[0] == 409, 'approval rejects a different Word fingerprint')
    corrected = change(item, 'corrections', comment='Constat o1, page 1 : préciser la mesure.')
    check(corrected[0] == 200, 'self nominated expert can request corrections explicitly')
    old = data(corrected)['review']
    newer, newer_manifest, newer_files = package(series, note='Mesure corrigée')
    submitted = submit(newer, recipient='fixture-43', expected='avereo_connect:43')
    check(submitted[0] == 201, 'corrected version submitted to a second expert')
    latest = data(submitted)['review']
    check(change(old, 'approve')[0] == 409, 'decision on superseded version refused')
    check(submit(package(series, identity=latest['id'], note='Other')[0], recipient='fixture-43', expected='avereo_connect:43')[0] == 409, 'version identity cannot overwrite bytes')
    latest_path = '/api/report-reviews/' + latest['id']
    check(request(latest_path + '/file/word-expert', reviewer)[2] == newer_files['rapport-expert.docx'], 'nominated second expert reads exact expert Word')
    check(request(latest_path + '/file/source', reviewer)[0] == 404, 'nominated reviewer never receives complete private source')
    check(request(base + '/documents', reviewer)[0] == 404, 'nomination grants no property ownership')
    check(change(latest, 'approve')[0] == 403, 'owner cannot substitute for the nominated second expert')
    accounts['avereo_connect:43']['eligible'] = False
    directory()
    check(request(latest_path + '/file/word-client', reviewer)[0] != 200, 'CONNECT revocation closes review access in an existing session')
    accounts['avereo_connect:43']['eligible'] = True
    directory(age=190)
    check(request(latest_path + '/file/word-client', reviewer)[0] == 503, 'stale CONNECT directory closes private review access')
    directory()
    final_content = pdf('Client final from approved Word')
    def attach(item, content=final_content, cookie=owner, token=csrf, from_word=None, confirm='true'):
        boundary=secrets.token_hex(16);body=b''
        for key,value in [('revision',str(item['revision'])),('fromWordSha256',from_word or item['decision']['wordSha256']['client']),('confirmLayout',confirm)]:
            body+=f'--{boundary}\r\nContent-Disposition: form-data; name="{key}"\r\n\r\n{value}\r\n'.encode()
        body+=f'--{boundary}\r\nContent-Disposition: form-data; name="pdf"; filename="final.pdf"\r\nContent-Type: application/pdf\r\n\r\n'.encode()+content+f'\r\n--{boundary}--\r\n'.encode()
        return request('/api/report-reviews/'+item['id']+'/pdf',cookie,'POST',body,token,content_type='multipart/form-data; boundary='+boundary)
    check(attach(latest,from_word='f'*64)[0]==403,'PDF cannot be attached before Word approval')
    approved_response = change(latest, 'approve', reviewer, reviewer_csrf, comment='Contenu des deux Word relu.')
    check(approved_response[0] == 200, 'nominated second expert approves exact Word files')
    approved = data(approved_response)['review']
    check(change(approved, 'publish', shareRevision=1)[0] == 403, 'Word approval alone does not publish or prepare a PDF')
    check(attach(approved,cookie=reviewer,token=reviewer_csrf)[0]==403,'reviewer approval grants no right to prepare final PDF')
    check(attach(approved,from_word='f'*64)[0]==409,'final PDF must reference the exact approved client Word')
    check(attach(approved,confirm='false')[0]==422,'layout and content control confirmation required')
    check(attach(approved,content=b'not-a-pdf')[0]==422,'invalid PDF refused without changing Word approval')
    ready_response=attach(approved)
    check(ready_response[0]==201,'owner prepares PDF only after Word validation')
    ready=data(ready_response)['review']
    check(data(attach(ready))['alreadyPrepared'],'exact PDF retry is idempotent')
    final_content=pdf('Client final from approved Word - adjusted pagination')
    ready_response=attach(ready,content=final_content)
    check(ready_response[0]==201,'layout-only replacement creates another private immutable PDF')
    ready=data(ready_response)['review']
    check(len(ready['finalPdfs'])==2 and ready['decision']==approved['decision'],'PDF layout versions preserve Word decision and earlier PDF')
    check(request(latest_path+'/file/final',owner)[2]==final_content,'owner previews the current final PDF privately')
    check(request(latest_path+'/file/final',reviewer)[0]==404,'Word reviewer receives no private final PDF preparation right')
    check(data(request(base+'/documents',owner))['documents']==[],'final PDF preparation still exposes no client document')
    approved=ready
    check(change(approved, 'publish', reviewer, reviewer_csrf, shareRevision=1)[0] == 403, 'approval grants no publication or owner rights')
    check(change(approved, 'publish', shareRevision=0)[0] == 409, 'publication requires fresh recipient scope')
    sql("CREATE TRIGGER fixture_fail_review BEFORE UPDATE ON pi_biens FOR EACH ROW SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT='Fixture review failure'")
    try:
        check(change(approved, 'publish', shareRevision=1)[0] == 503, 'publication failure is reported')
    finally:
        sql('DROP TRIGGER fixture_fail_review')
    check(data(request(base + '/documents', owner))['documents'] == [], 'failed publication rolls back public document')
    published_response = change(approved, 'publish', shareRevision=1)
    check(published_response[0] == 200, 'owner confirms separate publication')
    published = data(published_response)['review']
    docs = data(request(base + '/documents', second))['documents']
    check(len(docs) == 1 and docs[0]['id'] == published['documentId'] and docs[0]['mime'] == 'application/pdf', 'only final client PDF becomes an active document')
    check(request(base + '/documents/' + published['documentId'] + '/file', second)[2] == final_content, 'published PDF bytes equal the expert approved bytes')
    check(len(data(request(shared_path, client))['documents']) == 1 and request(shared_path + '/documents/' + published['documentId'] + '/file', client)[2] == final_content, 'client share receives only the exact approved client PDF after publication')
    check(request(latest_path + '/file/word-expert', client)[0] == 404 and request(latest_path + '/file/source', client)[0] == 404, 'client publication exposes neither expert PDF nor complete source')
    check(change(approved, 'publish', shareRevision=1)[0] == 409, 'stale repeated publication cannot create another document')
    frozen_source = request(latest_path + '/file/source', owner)[2]
    check(frozen_source == newer, 'published review retains exact source and expert files privately')
    self_content, _, _ = package(secrets.token_hex(16), note='Auto-validation explicite')
    self_item = data(submit(self_content))['review']
    self_decision = change(self_item, 'approve', comment='Mes deux PDF relus.')
    check(self_decision[0] == 200 and data(self_decision)['review']['decision']['by'] == 'avereo_connect:42', 'author explicitly nominated as reviewer can approve their own exact Word files')
    check(len(data(request(base + '/documents', owner))['documents']) == 1, 'self approval remains private until separate publication')
    proof = backup()
    check(proof['temporaryRowRestore'] == 'passed' and proof['fileReadback'] == 'passed', 'backup and temporary restore cover private reviews and final PDF')
    cancel_content, _, _ = package(secrets.token_hex(16), note='Retrait')
    pending = data(submit(cancel_content, recipient='fixture-43', expected='avereo_connect:43'))['review']
    check(change(pending, 'cancel')[0] == 200, 'owner can withdraw a pending nomination')
    check(request('/api/report-reviews/' + pending['id'] + '/file/word-client', reviewer)[0] == 404, 'withdrawn nomination no longer grants PDF access')
    check(change(pending, 'approve', reviewer, reviewer_csrf)[0] == 409, 'withdrawal invalidates a stale decision')
    legacy_content,_,_=package(secrets.token_hex(16),legacy=True,note='Ancienne décision PDF')
    legacy_item=data(submit(legacy_content))['review']
    index=len(data(request(base+'/report-reviews',owner))['reviews'])-1
    sql("UPDATE pi_biens SET report_reviews=JSON_SET(report_reviews,'$.items["+str(index)+"].status','approved','$.items["+str(index)+"].decision',JSON_OBJECT('action','approve','at','2026-11-25T10:00:00Z','by','avereo_connect:42','basis','pdf','pdfSha256',JSON_OBJECT('client','old'))) WHERE owner_id='avereo_connect:42' AND bien_id='review-fixture'")
    legacy_state=next(x for x in data(request(base+'/report-reviews',owner))['reviews'] if x['id']==legacy_item['id'])
    check(not legacy_state['wordApproved'] and legacy_state['decision']['basis']=='pdf','historical PDF approval is retained without becoming Word approval')
    check(change(legacy_state,'publish',shareRevision=1)[0]==403,'historical PDF approval cannot bypass Word validation')
    check(attach(legacy_state,from_word='f'*64)[0]==403,'historical PDF approval cannot enable post-Word PDF preparation')
    if os.environ.get('PASSEPORT_REVIEW_BROWSER_PACKAGE'):
        with tempfile.TemporaryDirectory(prefix='passeport-browser-review-') as temp:
            root=Path(temp);reference='REVUE-NAV-'+secrets.token_hex(4);series=secrets.token_hex(16)
            initial,_,_=package(series,reference=reference,note='Version navigateur initiale')
            corrected,_,_=package(series,reference=reference,note='Version navigateur corrigee')
            (root/'initial.review.avereo.zip').write_bytes(initial);(root/'corrected.review.avereo.zip').write_bytes(corrected);(root/'final.pdf').write_bytes(pdf('Client final browser after Word approval'))
            (root/'seed.json').write_text(json.dumps({'origin':browser_origin,'ownerCookie':owner,'reviewerCookie':reviewer,'clientCookie':client,'reference':reference,'initial':str(root/'initial.review.avereo.zip'),'corrected':str(root/'corrected.review.avereo.zip'),'finalPdf':str(root/'final.pdf')}),encoding='utf-8')
            config_file=Path(config_path);original_config=config_file.read_bytes()
            configured=original_config.replace(b"'storage_origin'=>'https://passeport-immo.test'",("'storage_origin'=>'"+browser_origin+"'").encode())
            assert configured!=original_config
            try:
                config_file.write_bytes(configured)
                subprocess.run(['node',str(Path(__file__).with_name('reviews.browser.mjs')),str(root/'seed.json')],check=True)
            finally:
                config_file.write_bytes(original_config)
            check(True,'browser correction, approval, PDF rendering and publication lifecycle passed')
