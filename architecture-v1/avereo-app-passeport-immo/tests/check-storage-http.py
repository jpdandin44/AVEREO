"""API réelle Apache/PHP/MariaDB ; données et identités fictives, réseau isolé."""
import base64
import hashlib
import hmac
import http.client
import json
import secrets
import shutil
import subprocess
import tempfile
import time
import uuid
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
        (root/'config.php').write_text("<?php return "+"["+
            f"'environment'=>'local','connect_portal_url'=>'https://connect-preprod.avereo.fr/','connect_launch_secret'=>'{secret}',"+
            "'connect_launch_nonce_directory'=>'/tmp/nonces','connect_gate_cookie'=>'PI_TEST','connect_gate_session_seconds'=>1800,"+
            f"'storage_enabled'=>true,'storage_dsn'=>'mysql:host={database};dbname=passeport;charset=utf8mb4','storage_user'=>'passeport','storage_password'=>'{password}',"+
            "'storage_directory'=>'/private-documents','storage_origin'=>'https://passeport-immo.test'];",encoding='utf-8')
        try:
            command('docker','network','create',network)
            command('docker','run','-d','--rm','--name',database,'--network',network,
                '-e','MARIADB_RANDOM_ROOT_PASSWORD=1','-e','MARIADB_DATABASE=passeport',
                '-e','MARIADB_USER=passeport','-e',f'MARIADB_PASSWORD={password}','mariadb:11.4'); created.append(database)
            command('docker','run','-d','--rm','--name',web,'--network',network,'-p','127.0.0.1::80',
                '--mount',f'type=bind,source={root}/public,target=/var/www/html,readonly',
                '--mount',f'type=bind,source={root}/config.php,target=/fixture/config.php,readonly',
                '--mount',f'type=bind,source={APP}/database/storage.sql,target=/fixture/storage.sql,readonly',
                '--mount',f'type=bind,source={APP}/workflows/backup-storage.php,target=/fixture/backup-storage.php,readonly',
                '-e','AVEREO_CONFIG_FILE=/fixture/config.php',IMAGE); created.append(web)
            port=int(command('docker','port',web,'80/tcp').rsplit(':',1)[1])
            bootstrap="mkdir('/private-documents',0700); chmod('/private-documents',0700); chown('/private-documents','www-data'); $c=require '/fixture/config.php'; for($i=0;$i<60;$i++){try{$p=new PDO($c['storage_dsn'],$c['storage_user'],$c['storage_password']);break;}catch(Throwable){usleep(500000);}} $p->setAttribute(PDO::ATTR_ERRMODE,PDO::ERRMODE_EXCEPTION); $p->exec(file_get_contents('/fixture/storage.sql'));"
            command('docker','exec',web,'php','-r',bootstrap)
            def request(path,cookie=None,method='GET',body=None,csrf=None,origin='https://passeport-immo.test',content_type='application/json'):
                headers={}
                if cookie: headers['Cookie']=cookie
                if csrf: headers['X-Passeport-CSRF']=csrf
                if origin: headers['Origin']=origin
                if isinstance(body,(dict,list)): body=json.dumps(body).encode()
                if body is not None: headers['Content-Type']=content_type
                connection=http.client.HTTPConnection('127.0.0.1',port,timeout=15)
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
            # Soft deletion keeps every private blob and document record for recovery.
            empty={'revision':1,'biens':[],'tarifs':{}}
            check(request('/api/workspace',cookie,'PUT',empty,csrf)[0]==200 and request(path+'/file',cookie)[0]==404,'deleted property hidden')
            workspace['revision']=2
            check(request('/api/workspace',cookie,'PUT',workspace,csrf)[0]==200 and request(path+'/file',cookie)[2]==content,'soft deleted property recoverable without file loss')
            check(request('/api/storage.php',cookie)[0]==404 and request('/connect/session.php',cookie)[0]==403,'implementation endpoints blocked')
            backup=json.loads(command('docker','exec',web,'php','/fixture/backup-storage.php','/fixture/config.php','/tmp/private-backup-test'))
            check(backup['documents']==1 and backup['fileReadback']=='passed' and backup['temporaryRowRestore']=='passed','private snapshot row restoration and file readback')
            command('docker','exec',web,'php','-r',f"file_put_contents('/private-documents/{doc['id']}.blob','corrupted');")
            check(request(path+'/file',cookie)[0]==503,'altered blob not returned')
            print(json.dumps({'assertions':len(checks),'checks':checks,'database':'MariaDB 11.4','isolated':True},ensure_ascii=False))
        finally:
            for container in reversed(created): subprocess.run(['docker','stop',container],check=True,stdout=subprocess.DEVNULL)
            subprocess.run(['docker','network','rm',network],check=False,stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL)

if __name__=='__main__': run()
