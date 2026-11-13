"""API réelle Apache/PHP/MariaDB ; données et identités fictives, réseau isolé."""
import base64
import hashlib
import hmac
import http.client
import json
import secrets
import shutil
import subprocess
import sys
import tempfile
import time
import uuid
import zipfile
from http.cookies import SimpleCookie
from pathlib import Path

APP=Path(__file__).resolve().parents[1]
IMAGE='avereo-passeport-connect-test:local'

def command(*args):
    return subprocess.check_output(args,text=True,stderr=subprocess.STDOUT).strip()

def run():
    name='passeport-storage-'+uuid.uuid4().hex[:10]
    network=name+'-net'; database=name+'-db'; web=name+'-web'
    created=[]; checks=[]
    def check(value,label):
        assert value,label
        checks.append(label[0] if isinstance(label,tuple) else label)
    with tempfile.TemporaryDirectory(prefix='passeport-storage-') as temporary:
        root=Path(temporary).resolve(); shutil.copytree(APP/'frontend/dist',root/'public')
        password=secrets.token_hex(24); secret=secrets.token_hex(32)
        directory_path=root/'share-directory.json'
        accounts={f'avereo_connect:{i}':{'label':f'Compte fictif {i}','aliases':[hashlib.sha256(f'fixture-{i}'.encode()).hexdigest()],'eligible':i not in [45,46],'invitable':i!=46}for i in [42,43,44,45,46]}
        def directory(age=0):
            directory_path.write_text(json.dumps({'version':1,'environment':'local','generatedAt':int(time.time())-age,'accounts':accounts}))
        directory()
        (root/'config.php').write_text("<?php return "+"["+
            f"'environment'=>'local','connect_portal_url'=>'https://connect-preprod.avereo.fr/','connect_launch_secret'=>'{secret}',"+
            "'connect_launch_nonce_directory'=>'/tmp/nonces','connect_gate_cookie'=>'PI_TEST','connect_gate_session_seconds'=>1800,"+
            f"'storage_enabled'=>true,'storage_dsn'=>'mysql:host={database};dbname=passeport;charset=utf8mb4','storage_user'=>'passeport','storage_password'=>'{password}',"+
            "'document_share_directory'=>'/fixture/share-directory.json','storage_directory'=>'/private-documents','storage_origin'=>'https://passeport-immo.test'];",encoding='utf-8')
        try:
            command('docker','network','create',network)
            command('docker','run','-d','--rm','--name',database,'--network',network,
                '-e','MARIADB_RANDOM_ROOT_PASSWORD=1','-e','MARIADB_DATABASE=passeport',
                '-e','MARIADB_USER=passeport','-e',f'MARIADB_PASSWORD={password}','mariadb:11.4'); created.append(database)
            command('docker','run','-d','--rm','--name',web,'--network',network,'-p','127.0.0.1::80',
                '--mount',f'type=bind,source={root}/public,target=/var/www/html,readonly',
                '--mount',f'type=bind,source={root}/config.php,target=/fixture/config.php,readonly',
                '--mount',f'type=bind,source={directory_path},target=/fixture/share-directory.json,readonly',
                '--mount',f'type=bind,source={APP}/database/storage.sql,target=/fixture/storage.sql,readonly',
                '--mount',f'type=bind,source={APP}/workflows/backup-storage.php,target=/fixture/backup-storage.php,readonly',
                '--mount',f'type=bind,source={APP}/workflows/migrate-document-organisation.php,target=/fixture/migrate-document-organisation.php,readonly',
                '--mount',f'type=bind,source={APP}/workflows/migrate-document-sharing.php,target=/fixture/migrate-document-sharing.php,readonly',
                '--mount',f'type=bind,source={APP}/workflows/scheduled-backup.php,target=/fixture/scheduled-backup.php,readonly',
                '--mount',f'type=bind,source={APP}/workflows/backup-cron.php,target=/fixture/backup-cron.php,readonly',
                '--mount',f'type=bind,source={APP}/tests/scheduled-backup.php,target=/fixture/scheduled-backup-test.php,readonly',
                '-e','AVEREO_CONFIG_FILE=/fixture/config.php',IMAGE); created.append(web)
            port=int(command('docker','port',web,'80/tcp').rsplit(':',1)[1])
            bootstrap="mkdir('/private-documents',0700); chmod('/private-documents',0700); chown('/private-documents','www-data'); $c=require '/fixture/config.php'; for($i=0;$i<60;$i++){try{$p=new PDO($c['storage_dsn'],$c['storage_user'],$c['storage_password']);break;}catch(Throwable){usleep(500000);}} $p->setAttribute(PDO::ATTR_ERRMODE,PDO::ERRMODE_EXCEPTION); $p->exec(preg_replace('/^ *(trashed_at|document_settings|document_shares) [^\\n]*\\n/m','',file_get_contents('/fixture/storage.sql'))); $p->exec(\"INSERT INTO pi_workspaces(owner_id,settings) VALUES ('migration-fixture','{}')\");"
            command('docker','exec',web,'php','-r',bootstrap)
            dry=json.loads(command('docker','exec',web,'php','/fixture/migrate-document-organisation.php','/fixture/config.php','passeport'))
            check(dry['status']=='dry_run' and set(dry['requiredColumns'])=={'trashed_at','document_settings'},'organisation migration defaults to dry run on historical schema')
            wrong=subprocess.run(['docker','exec',web,'php','/fixture/migrate-document-organisation.php','/fixture/config.php','wrong-database','--apply'],capture_output=True)
            check(wrong.returncode!=0,'organisation migration refuses wrong database')
            migrated=json.loads(command('docker','exec',web,'php','/fixture/migrate-document-organisation.php','/fixture/config.php','passeport','--apply'))
            check(migrated['existingRowsPreserved'] and len(migrated['addedColumns'])==2,'historical schema migration preserves all original rows')
            repeated=json.loads(command('docker','exec',web,'php','/fixture/migrate-document-organisation.php','/fixture/config.php','passeport','--apply'))
            check(repeated['addedColumns']==[] and repeated['existingRowsPreserved'],'organisation migration safely idempotent')
            sharing_migration=json.loads(command('docker','exec',web,'php','/fixture/migrate-document-sharing.php','/fixture/config.php','passeport','--apply'))
            check(sharing_migration['status']=='verified','sharing nullable schema installed or verified')
            def request(path,cookie=None,method='GET',body=None,csrf=None,origin='https://passeport-immo.test',content_type='application/json'):
                headers={}
                if cookie: headers['Cookie']=cookie
                if csrf: headers['X-Passeport-CSRF']=csrf
                if origin: headers['Origin']=origin
                if isinstance(body,(dict,list)): body=json.dumps(body).encode()
                if body is not None: headers['Content-Type']=content_type
                connection=http.client.HTTPConnection('127.0.0.1',port,timeout=60)
                connection.request(method,path,body=body,headers=headers)
                response=connection.getresponse(); result=response.status,dict(response.getheaders()),response.read(); connection.close()
                return result
            def data(result): return json.loads(result[2])
            def encode(value): return base64.urlsafe_b64encode(value).decode().rstrip('=')
            def launch(user,identity=True):
                now=int(time.time()); p={'v':1,'app':'passeport-immo','iat':now,'exp':now+90,'nonce':encode(secrets.token_bytes(24)),'remembered':False}
                if identity: p['identity']={'provider':'avereo_connect','id':str(user)}
                payload=encode(json.dumps(p).encode()); ticket=payload+'.'+encode(hmac.new(secret.encode(),payload.encode(),hashlib.sha256).digest())
                result=request('/connect/entry.php?ticket='+ticket)
                if not identity: return result
                assert result[0]==303,result
                return 'PI_TEST='+SimpleCookie(result[1]['Set-Cookie'])['PI_TEST'].value
            for _ in range(40):
                try: request('/'); break
                except (ConnectionError,OSError): time.sleep(.25)
            check(request('/api/workspace')[0]==401,'anonymous API denied')
            check(launch(1,False)[0]==403,'identityless ticket denied')
            cookie=launch(42); second=launch(42); foreign=launch(43)
            csrf=data(request('/api/session',cookie))['csrf']; csrf2=data(request('/api/session',second))['csrf']; foreign_csrf=data(request('/api/session',foreign))['csrf']
            check(b'<meta name="passeport-storage" content="server">' in request('/',cookie)[2],'hosted server mode injected')
            check(data(request('/api/workspace',cookie))['biens']==[],'new account blank workspace')
            workspace={'revision':0,'biens':[{'id':123,'address':'Bien fictif','dossier':{'pieces':[],'attachments':[]}}],'tarifs':{}}
            check(request('/api/workspace',cookie,'PUT',workspace)[0]==403,'missing CSRF denied')
            check(request('/api/workspace',cookie,'PUT',workspace,csrf,origin='https://evil.invalid')[0]==403,'foreign origin denied')
            check(request('/api/workspace',cookie,'PUT',workspace,csrf)[0]==200,'property persisted')
            check(data(request('/api/workspace',second))['biens'][0]['address']=='Bien fictif','independent session sees property')
            check(request('/api/workspace',second,'PUT',workspace,csrf2)[0]==409,'stale browser cannot overwrite')
            check(data(request('/api/workspace',foreign))['biens']==[],'foreign account isolated')
            check(request('/api/biens/123/documents',foreign)[0]==404,'foreign property denied')
            client=data(request('/api/biens/123/client',cookie,'POST',{'name':'Client fictif'},csrf))
            content=b'%PDF-1.4\nThis is a test document.\n%%EOF\n'
            def upload(files,expected=None):
                boundary='test'+uuid.uuid4().hex; body=b''
                for key,value in [('category','plans'),('expectedCount',str(expected if expected is not None else len(files)))]:
                    body+=f'--{boundary}\r\nContent-Disposition: form-data; name="{key}"\r\n\r\n{value}\r\n'.encode()
                for filename,bytes_ in files:
                    body+=f'--{boundary}\r\nContent-Disposition: form-data; name="files[]"; filename="{filename}"\r\nContent-Type: application/pdf\r\n\r\n'.encode()+bytes_+b'\r\n'
                body+=f'--{boundary}--\r\n'.encode()
                return request('/api/biens/123/documents',cookie,'POST',body,csrf,content_type='multipart/form-data; boundary='+boundary)
            result=upload([('plan.pdf',content)]); check(result[0]==201,('upload accepted',result[0],result[2]))
            doc=data(result)['added'][0]; path='/api/biens/123/documents/'+doc['id']
            check(data(upload([('copie.pdf',content)]))['duplicates']==['copie.pdf'],'SHA duplicate prevented')
            check(upload([('other.pdf',content+b'2'),('invalid.pdf',b'invalid')])[0]==422,'invalid batch refused atomically')
            check(upload([('other.pdf',content+b'2')],2)[0]==422,'truncated batch refused')
            check(len(data(request('/api/biens/123/documents',second))['documents'])==1,'independent session sees exact document count')
            downloaded=request(path+'/file',second)
            check(downloaded[0]==200 and hashlib.sha256(downloaded[2]).hexdigest()==doc['sha256'],'independent session downloads exact bytes')
            check('attachment;' in downloaded[1]['Content-Disposition'] and 'sandbox' in downloaded[1]['Content-Security-Policy'],'download is inert attachment')
            check(request(path+'/file',foreign)[0]==404,'foreign download denied')
            check(request(path,foreign,'PATCH',{'archived':True},foreign_csrf)[0]==404,'foreign edit denied')
            check(request('/api/biens/123/client',cookie,'POST',{'name':'Other client'},csrf)[0]==409,'client invariant retained')
            result=request(path,cookie,'PATCH',{'title':'Plan conservé','archived':True},csrf)
            check(result[0]==200 and data(result)['archivedAt'] is not None,'archive persisted')
            check(data(request('/api/biens/123/documents',second))['documents'][0]['title']=='Plan conservé','metadata shared across sessions')
            check(request(path,second,'PATCH',{'archived':False},csrf2)[0]==200,'archive reversible')
            settings={'revision':0,'categories':{'plans':{'icon':'leaf','color':'#123456'}},'order':{'plans':[doc['id']]}}
            check(request('/api/biens/123/document-settings',cookie,'PUT',settings)[0]==403,'organisation requires CSRF')
            check(request('/api/biens/123/document-settings',foreign,'PUT',settings,foreign_csrf)[0]==404,'foreign organisation refused')
            result=request('/api/biens/123/document-settings',cookie,'PUT',settings,csrf)
            check(result[0]==200 and data(result)['revision']==1,'appearance and order persisted')
            check(data(request('/api/biens/123/documents',second))['settings']['categories']['plans']==settings['categories']['plans'],'appearance shared across independent sessions')
            check(request('/api/biens/123/document-settings',second,'PUT',settings,csrf2)[0]==409,'stale organisation cannot overwrite newer settings')
            invalid={**settings,'revision':1,'order':{'plans':['a'*32]}}
            check(request('/api/biens/123/document-settings',cookie,'PUT',invalid,csrf)[0]==422,'foreign document order reference refused')
            invalid={**settings,'revision':1,'categories':{'plans':{'icon':'script','color':'url(evil)'}}}
            check(request('/api/biens/123/document-settings',cookie,'PUT',invalid,csrf)[0]==422,'unsafe appearance values refused')
            check(request(path,cookie,'DELETE',{'confirm':True})[0]==403,'permanent deletion requires CSRF')
            check(request(path,cookie,'DELETE',{},csrf)[0]==422,'permanent deletion requires explicit confirmation')
            check(request(path,cookie,'DELETE',{'confirm':True},csrf)[0]==409,'active document cannot be permanently deleted')
            archived_doc=data(request(path,cookie,'PATCH',{'archived':True},csrf))
            trashed_doc=data(request(path,cookie,'PATCH',{'trashed':True},csrf))
            check(trashed_doc['trashedAt'] and trashed_doc['archivedAt']==archived_doc['archivedAt'],'trash preserves archive state and metadata')
            check(data(request('/api/biens/123/documents',second))['documents'][0]['trashedAt']==trashed_doc['trashedAt'],'trash state shared across independent sessions')
            check(request(path,cookie,'PATCH',{'title':'not allowed'},csrf)[0]==409,'trashed document cannot be edited silently')
            check(upload([('new.pdf',content+b'new'),('trash-copy.pdf',content)])[0]==409,'reimport of trash duplicate refuses entire batch with actionable error')
            check(len(data(request('/api/biens/123/documents',second))['documents'])==1,'trash duplicate leaves no partial import')
            trash_backup=json.loads(command('docker','exec',web,'php','/fixture/backup-storage.php','/fixture/config.php','/tmp/private-backup-trash'))
            check(trash_backup['documents']==1 and trash_backup['temporaryRowRestore']=='passed','trash and organisation included in backup and temporary restore')
            restored=data(request(path,second,'PATCH',{'trashed':False},csrf2))
            check(restored['trashedAt'] is None and restored['archivedAt']==archived_doc['archivedAt'] and request(path+'/file',second)[2]==content,'restore keeps original archive state and exact bytes')
            request(path,cookie,'PATCH',{'archived':False},csrf)
            temporary=data(upload([('purge.pdf',content+b'purge')]))['added'][0]
            purge_path='/api/biens/123/documents/'+temporary['id']
            request(purge_path,cookie,'PATCH',{'trashed':True},csrf)
            check(request(purge_path,foreign,'DELETE',{'confirm':True},foreign_csrf)[0]==404,'foreign purge refused')
            def sql(statement):
                code="$c=require '/fixture/config.php';$p=new PDO($c['storage_dsn'],$c['storage_user'],$c['storage_password']);$p->setAttribute(PDO::ATTR_ERRMODE,PDO::ERRMODE_EXCEPTION);$p->exec("+json.dumps(statement)+");"
                return command('docker','exec',web,'php','-r',code)
            sql("CREATE TRIGGER fixture_fail_purge BEFORE DELETE ON pi_documents FOR EACH ROW SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT='Fixture purge failure'")
            check(request(purge_path,cookie,'DELETE',{'confirm':True},csrf)[0]==503,'failed SQL purge reports failure')
            check(request(purge_path+'/file',second)[2]==content+b'purge','failed SQL purge restores original private blob')
            sql('DROP TRIGGER fixture_fail_purge')
            check(request(purge_path,cookie,'DELETE',{'confirm':True},csrf)[0]==200,'confirmed trash purge succeeds')
            check(request(purge_path+'/file',second)[0]==404 and request(purge_path,second,'PATCH',{'trashed':False},csrf2)[0]==404,'purged document is neither downloadable nor restorable')
            absent=command('docker','exec',web,'php','-r',f"echo is_file('/private-documents/{temporary['id']}.blob')?'exists':'absent';")
            check(absent=='absent','permanent purge removes original blob')
            reimported=data(upload([('again.pdf',content+b'purge')]))['added'][0]
            check(reimported['id']!=temporary['id'],'purged content can be imported as a new document')
            again='/api/biens/123/documents/'+reimported['id'];request(again,cookie,'PATCH',{'trashed':True},csrf);request(again,cookie,'DELETE',{'confirm':True},csrf)
            check(request(path+'/file',second)[2]==content,'purge preserves unrelated document')
            # Soft deletion keeps every private blob and document record for recovery.
            empty={'revision':1,'biens':[],'tarifs':{}}
            check(request('/api/workspace',cookie,'PUT',empty,csrf)[0]==200 and request(path+'/file',cookie)[0]==404,'deleted property hidden')
            workspace['revision']=2
            check(request('/api/workspace',cookie,'PUT',workspace,csrf)[0]==200 and request(path+'/file',cookie)[2]==content,'soft deleted property recoverable without file loss')
            archive_fixtures=json.loads((APP/'tests/fixtures/archives.json').read_text(encoding='utf-8'))
            for fixture in archive_fixtures:
                bytes_=base64.b64decode(fixture['base64'])
                uploaded=upload([(fixture['name'],bytes_)])
                check(uploaded[0]==201,('archive upload accepted: '+fixture['name'],uploaded[0],uploaded[2]))
                compressed=data(uploaded)['added'][0]
                check(compressed['mime']==fixture['mime'],'canonical archive MIME: '+fixture['name'])
                compressed_path='/api/biens/123/documents/'+compressed['id']+'/file'
                downloaded=request(compressed_path,second)
                check(downloaded[0]==200 and downloaded[2]==bytes_,'independent session exact archive download: '+fixture['name'])
                check('attachment;' in downloaded[1]['Content-Disposition'] and 'sandbox' in downloaded[1]['Content-Security-Policy'],'archive inert attachment: '+fixture['name'])
                check(request(compressed_path,foreign)[0]==404,'foreign archive download denied: '+fixture['name'])
            expected_documents=1+len(archive_fixtures)
            check(upload([('nouveau.pdf',content+b'new'),('faux.zip',b'not an archive')])[0]==422,'mixed batch with fake archive rejected atomically')
            check(len(data(request('/api/biens/123/documents',second))['documents'])==expected_documents,'rejected archive batch leaves document count unchanged')
            check(data(upload([('copie.zip',base64.b64decode(archive_fixtures[0]['base64']))]))['duplicates']==['copie.zip'],'archive deduplicated by actual bytes')
            check(request('/api/storage.php',cookie)[0]==404 and request('/connect/session.php',cookie)[0]==403,'implementation endpoints blocked')
            backup=json.loads(command('docker','exec',web,'php','/fixture/backup-storage.php','/fixture/config.php','/tmp/private-backup-test'))
            check(backup['documents']==expected_documents and backup['fileReadback']=='passed' and backup['temporaryRowRestore']=='passed','private snapshot restores documents including compressed archives')
            scheduled=json.loads(command('docker','exec',web,'php','/fixture/scheduled-backup-test.php',str(expected_documents)))
            check(scheduled['assertions']==22,'scheduled backup safety, rotation and environment isolation')
            # Real 173 MiB archive, after the rotation suite to avoid copying it on every rotation case.
            large_archive=root/'rapport-entier.zip'
            with zipfile.ZipFile(large_archive,'w',compression=zipfile.ZIP_STORED) as archive:
                with archive.open('rapport-fictif.txt','w') as member:
                    block=b'0'*(1024*1024)
                    for _ in range(173): member.write(block)
            large_bytes=large_archive.read_bytes()
            large_uploaded=upload([('rapport-entier.zip',large_bytes)])
            check(large_uploaded[0]==201,('173 MiB archive uploaded whole',large_uploaded[0],large_uploaded[2]))
            large_doc=data(large_uploaded)['added'][0]
            check(large_doc['size']==len(large_bytes),'large archive original size retained')
            large_download=request('/api/biens/123/documents/'+large_doc['id']+'/file',second)
            check(large_download[0]==200 and hashlib.sha256(large_download[2]).digest()==hashlib.sha256(large_bytes).digest(),'173 MiB archive exact in independent session')
            large_backup=json.loads(command('docker','exec',web,'php','/fixture/backup-storage.php','/fixture/config.php','/tmp/private-backup-large-test'))
            check(large_backup['documents']==expected_documents+1 and large_backup['fileReadback']=='passed' and large_backup['temporaryRowRestore']=='passed','large archive backup and temporary restoration passed')
            # Real HTTP sharing: fixtures only, no public URL grants, all mutations scoped to the owner.
            directory()
            check(request('/api/biens/123/shares',foreign)[0]==404,'foreign account cannot list or manage owner shares')
            check(request('/api/share-recipient',cookie,'POST',{'bienId':'123','recipient':'fixture-43'})[0]==403,'recipient lookup requires CSRF')
            resolved=data(request('/api/share-recipient',cookie,'POST',{'bienId':'123','recipient':'fixture-43'},csrf))
            check(resolved['recipient']=='avereo_connect:43' and resolved['ready'],'exact eligible CONNECT recipient resolved')
            grant_body={'recipient':'fixture-43','expectedRecipient':resolved['recipient'],'revision':0,'confirm':True}
            check(request('/api/biens/123/shares',cookie,'POST',{**grant_body,'expectedRecipient':'avereo_connect:44'},csrf)[0]==409,'recipient rebind between review and confirmation denied')
            check(request('/api/biens/123/shares',cookie,'POST',{**grant_body,'confirm':False},csrf)[0]==422,'sharing requires explicit confirmation')
            granted=request('/api/biens/123/shares',cookie,'POST',grant_body,csrf)
            check(granted[0]==201,'owner grants confirmed read-only access')
            grant=data(granted)['grants'][0]['id'];shared='/api/shared/'+grant
            check(request('/api/biens/123/shares',cookie,'POST',grant_body,csrf)[0]==409,'stale share update cannot overwrite a concurrent change')
            check(data(request('/api/shared',foreign))['shares'][0]['id']==grant,'recipient discovers property in own shared-document list')
            received=data(request(shared,foreign));visible=[d for d in data(request('/api/biens/123/documents',cookie))['documents']if not d['archivedAt'] and not d['trashedAt']]
            check(received['readOnly'] and len(received['documents'])==len(visible),'recipient receives only active document list')
            check('clientId'not in received['documents'][0] and 'dossier'not in received['bien'],'shared payload excludes client references and private property model')
            file_id=visible[0]['id'];shared_file=shared+'/documents/'+file_id+'/file'
            original=request('/api/biens/123/documents/'+file_id+'/file',cookie)
            check(request(shared_file,foreign)[2]==original[2],'shared attachment retains original bytes')
            stranger=launch(44);stranger_csrf=data(request('/api/session',stranger))['csrf']
            check(request(shared,stranger)[0]==404 and request(shared_file,stranger)[0]==404,'another CONNECT account cannot use copied share reference')
            for method in ['PUT','POST','PATCH','DELETE']:
                check(request(shared,foreign,method,{},foreign_csrf)[0]==405,'read-only share denies '+method)
            check(request('/api/biens/123/documents/'+file_id,foreign,'PATCH',{'title':'Forbidden'},foreign_csrf)[0]==404,'share never grants original owner mutation routes')
            document_path='/api/biens/123/documents/'+file_id
            check(request(document_path,cookie,'PATCH',{'archived':True},csrf)[0]==200,'fixture archived by owner')
            check(request(shared_file,foreign)[0]==404,'archived file is no longer shared')
            check(request(document_path,cookie,'PATCH',{'trashed':True},csrf)[0]==200,'fixture trashed by owner')
            check(request(shared_file,foreign)[0]==404,'trashed file is no longer shared')
            check(request(document_path,cookie,'PATCH',{'trashed':False},csrf)[0]==200,'fixture restored after sharing boundary test')
            check(request(shared_file,foreign)[0]==404,'restoring an archived fixture keeps it outside the active share')
            check(request(document_path,cookie,'PATCH',{'archived':False},csrf)[0]==200,'fixture returns to original active state')
            accounts['avereo_connect:43']['eligible']=False;directory()
            check(request(shared,foreign)[0]==404,'revoked CONNECT entitlement closes existing share')
            accounts['avereo_connect:43']['eligible']=True;directory(181)
            check(request(shared,foreign)[0]==503,'stale CONNECT projection fails closed')
            directory();revoke=request('/api/biens/123/shares/'+grant,cookie,'DELETE',{'revision':1},csrf)
            check(revoke[0]==200,'owner revokes share')
            check(request(shared,foreign)[0]==404 and request(shared_file,foreign)[0]==404,'revocation denies next list and download')
            pending=launch(45);pending_csrf=data(request('/api/session',pending))['csrf']
            pending_body={'recipient':'fixture-45','expectedRecipient':'avereo_connect:45','revision':2,'confirm':True}
            prepared=request('/api/biens/123/shares',cookie,'POST',pending_body,csrf)
            check(prepared[0]==201 and not data(prepared)['grants'][-1]['ready'],'pending activation share is explicitly prepared but not open')
            pending_share='/api/shared/'+data(prepared)['grants'][-1]['id']
            check(request(pending_share,pending)[0]==404,'pending activation cannot read documents despite a prepared grant')
            accounts['avereo_connect:45']['eligible']=True;directory()
            check(request(pending_share,pending)[0]==200,'normal CONNECT activation can enable the prepared named share')
            check(request('/api/share-recipient',cookie,'POST',{'bienId':'123','recipient':'fixture-46'},csrf)[0]==422,'account without Passeport entitlement cannot be invited')
            sharing_backup=json.loads(command('docker','exec',web,'php','/fixture/backup-storage.php','/fixture/config.php','/tmp/private-backup-sharing'))
            check(sharing_backup['temporaryRowRestore']=='passed','grants and revocation retained by four-table backup restore')
            command('docker','exec',web,'php','-r',f"file_put_contents('/private-documents/{doc['id']}.blob','corrupted');")
            check(request(path+'/file',cookie)[0]==503,'altered blob not returned')
            print(json.dumps({'assertions':len(checks),'checks':checks,'scheduledBackup':scheduled,'database':'MariaDB 11.4','isolated':True},ensure_ascii=False))
        finally:
            for container in reversed(created): subprocess.run(['docker','stop',container],check=True,stdout=subprocess.DEVNULL)
            subprocess.run(['docker','network','rm',network],check=False,stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL)

if __name__=='__main__':
    run()
    # Same private-storage qualification, in separate databases with fictitious data.
    subprocess.run([sys.executable,str(APP/'tests/check-transfer-property.py')],check=True)
