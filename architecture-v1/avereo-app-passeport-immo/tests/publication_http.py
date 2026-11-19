"""Real HTTP publication/privacy/rollback checks, called in the isolated storage fixture."""
import hashlib
import io
import json
import secrets
import zipfile


def run(request, check, owner, second, recipient, csrf, recipient_csrf, sql, backup):
    def data(result):
        return json.loads(result[2])

    def package(identity=None, compression=zipfile.ZIP_STORED, altered=False, original=False):
        identity=identity or secrets.token_hex(16)
        word=io.BytesIO()
        with zipfile.ZipFile(word,'w') as z:
            z.writestr('[Content_Types].xml','<Types/>')
            z.writestr('word/document.xml','<document>Restitution client publique '+identity+'</document>')
        report={'titre':'Rapport fictif complet','reference_dossier':'TEST-PUBLICATION','observations':[{'id':'o1','observations':'Constat fictif','photos':[]}], 'ecoute':{'notes':'NOTES PRIVEES EXCLUES DU PARTAGE'},'plans':[],'signature':'signature-fictive'}
        files={'dossier-rapport.json':json.dumps(report).encode(),'rapport-client.docx':word.getvalue()}
        originals=[]
        if original:
            name='originaux/'+'b'*32+'.png';content=b'original-fictif'
            report['observations'][0]['photos']=[{'id':'p1','src':'data:image/png;base64,Y29waWU=','original':{'id':'b'*32,'reportId':'c'*32,'mime':'image/png','bytes':len(content),'sha256':hashlib.sha256(content).hexdigest()}}]
            files['dossier-rapport.json']=json.dumps(report).encode();files[name]=content
            originals=[{'observationIndex':0,'photoIndex':0,'path':name,'mime':'image/png'}]
        manifest={'schema':'avereo-rapport-publication','version':1,'id':identity,'title':'Rapport fictif','reference':'TEST-PUBLICATION','createdAt':'2026-11-19T10:00:00Z','validatedByProfessional':True,'originals':originals,'entries':[{'path':p,'bytes':len(b),'sha256':hashlib.sha256(b).hexdigest()}for p,b in files.items()]}
        if altered:files['dossier-rapport.json']+=b' '
        stream=io.BytesIO()
        with zipfile.ZipFile(stream,'w',compression=compression) as z:
            z.writestr('manifest.json',json.dumps(manifest))
            for name,content in files.items():z.writestr(name,content)
        return stream.getvalue(),manifest

    workspace=data(request('/api/workspace',owner));workspace['biens'].append({'id':'publication-fixture','address':'Adresse fictive publication','dossier':{}})
    check(request('/api/workspace',owner,'PUT',workspace,csrf)[0]==200,'publication creates only its fictitious property')
    base='/api/biens/publication-fixture'
    check(request(base+'/client',owner,'POST',{'name':'Client fictif publication'},csrf)[0]==200,'publication property linked to its own client')
    path=base+'/report-publications'
    def upload(content, cookie=owner, token=csrf, confirm=True):
        boundary='publication-'+secrets.token_hex(12)
        body=(f'--{boundary}\r\nContent-Disposition: form-data; name="confirm"\r\n\r\n{str(confirm).lower()}\r\n--{boundary}\r\nContent-Disposition: form-data; name="publication"; filename="fixture.avereo.zip"\r\nContent-Type: application/zip\r\n\r\n').encode()+content+f'\r\n--{boundary}--\r\n'.encode()
        return request(path,cookie,'POST',body,token,content_type='multipart/form-data; boundary='+boundary)

    content,manifest=package(original=True)
    boundary='ordinary-'+secrets.token_hex(8)
    ordinary=(f'--{boundary}\r\nContent-Disposition: form-data; name="category"\r\n\r\nautres\r\n--{boundary}\r\nContent-Disposition: form-data; name="expectedCount"\r\n\r\n1\r\n--{boundary}\r\nContent-Disposition: form-data; name="files[]"; filename="renamed.zip"\r\nContent-Type: application/zip\r\n\r\n').encode()+content+f'\r\n--{boundary}--\r\n'.encode()
    check(request(base+'/documents',owner,'POST',ordinary,csrf,content_type='multipart/form-data; boundary='+boundary)[0]==422,'ordinary upload refuses private Rapport source even if archive renamed')
    check(request(path,recipient)[0]==404,'recipient cannot list private report publications')
    check(upload(content,token=None)[0]==403,'publication requires CSRF')
    check(upload(content,confirm=False)[0]==422,'publication requires explicit sharing confirmation')
    check(upload(content,cookie=recipient,token=recipient_csrf)[0]==404,'recipient cannot publish in another owner property')
    grant=data(request(base+'/shares',owner,'POST',{'recipient':'fixture-43','expectedRecipient':'avereo_connect:43','revision':0,'confirm':True},csrf))['grants'][0]['id']
    shared='/api/shared/'+grant
    before=data(request('/api/biens/123/documents',owner))
    published=upload(content)
    check(published[0]==201,('full private report published',published[0],published[2]))
    record=data(published)['publication'];source=path+'/'+record['id']+'/source'
    check(not data(published)['alreadyPublished'],'new version is recorded once')
    check(data(upload(content))['alreadyPublished'],'identical retry is idempotent')
    document=base+'/documents/'+record['documentId']
    check(request(document,owner,'PATCH',{'archived':True},csrf)[0]==200,'final restitution can use existing archive controls')
    check(upload(content)[0]==409,'retry never silently restores an archived final restitution')
    check(request(document,owner,'PATCH',{'archived':False},csrf)[0]==200,'final restitution restored explicitly')
    changed,_=package(identity=manifest['id'])
    check(upload(changed)[0]==409,'same version with changed bytes cannot overwrite archive')
    check(data(request(path,second))['publications']==[record],'new independent session reopens version metadata')
    check(request(source,second)[2]==content,'new independent session downloads exact full private package')
    check(request(source,recipient)[0]==404,'shared recipient cannot download private package')
    check(request(base+'/documents/'+record['id']+'/file',recipient)[0]==404,'private publication id is not an ordinary shared document id')
    check(request('/api/shared/'+grant+'/documents/'+record['id']+'/file',recipient)[0]==404,'shared attachment route cannot reach complete source')
    check(request('/api/biens/123/report-publications/'+record['id']+'/source',owner)[0]==404,'same owner cannot bind source to another property')
    received=data(request(shared,recipient))
    check(len(received['documents'])==1 and received['documents'][0]['id']==record['documentId'],'pre-existing named share receives only final restitution')
    check(b'NOTES PRIVEES' not in request(shared,recipient)[2],'shared metadata excludes private notes and source manifest')
    check(request(shared+'/documents/'+record['documentId']+'/file',recipient)[2] in [zipfile.ZipFile(io.BytesIO(content)).read('rapport-client.docx')],'shared recipient gets exact client Word only')
    for bad in [package(compression=zipfile.ZIP_DEFLATED)[0],package(altered=True)[0],b'not-a-zip']:
        check(upload(bad)[0]==422,'invalid or altered archive leaves publication unchanged')
    check(len(data(request(path,owner))['publications'])==1,'invalid archive imports never create a partial version')
    sql("CREATE TRIGGER fixture_fail_publication BEFORE UPDATE ON pi_biens FOR EACH ROW SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT='Fixture publication failure'")
    try:check(upload(package()[0])[0]==503,'SQL publication failure is reported')
    finally:sql('DROP TRIGGER fixture_fail_publication')
    check(len(data(request(path,owner))['publications'])==1 and len(data(request(base+'/documents',owner))['documents'])==1,'SQL publication failure rolls back final document and private version')
    check(data(request('/api/biens/123/documents',second))==before,'publication preserves unrelated existing documents and client')
    proof=backup()
    check(proof['fileReadback']=='passed' and proof['temporaryRowRestore']=='passed','backup includes private publication bytes and restores source metadata')
    check(request(base+'/shares/'+grant,owner,'DELETE',{'revision':1},csrf)[0]==200,'publication share revoked normally')
    check(request(shared,recipient)[0]==404 and request(source,second)[2]==content,'revocation closes final restitution but preserves owner private copy')
