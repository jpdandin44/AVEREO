"""Real PHP HTTP checks; only the DB connector is replaced by private SQLite.

No hosted credentials, browser session, external service or client data is used.
The deployed API SQL and ownership checks are preserved byte for byte.
"""
from pathlib import Path
import base64,hashlib,hmac,http.client,json,os,secrets,shutil,socket,sqlite3,subprocess,tempfile,time

APP=Path(__file__).resolve().parents[1]
PHP=shutil.which('php');assert PHP
parent=Path(tempfile.gettempdir()).resolve()
scratch=parent/('avereo-trial-http-'+secrets.token_hex(6));scratch.mkdir()
assert scratch.resolve().parent==parent
root=scratch/'web';shutil.copytree(APP/'frontend/dist',root)
db=scratch/'reports.sqlite';cx=sqlite3.connect(db)
cx.execute('''CREATE TABLE rapport_reports (public_id TEXT PRIMARY KEY,title TEXT,reference_code TEXT,address TEXT,
payload_json TEXT,payload_bytes INTEGER,owner_provider TEXT,owner_id TEXT,owner_email TEXT,created_by_id TEXT,
updated_by_id TEXT,created_at TEXT DEFAULT CURRENT_TIMESTAMP,updated_at TEXT DEFAULT CURRENT_TIMESTAMP)''')
cx.commit();cx.close()
original=(root/'api/bootstrap.php').read_text(encoding='utf-8')
start=original.index('function api_pdo(array $config): PDO');end=original.index('function api_read_json_body',start)
connector='''function api_pdo(array $config): PDO {
    $pdo = new PDO('sqlite:' . $config['test_sqlite_file'], null, null, [
        PDO::ATTR_ERRMODE=>PDO::ERRMODE_EXCEPTION, PDO::ATTR_DEFAULT_FETCH_MODE=>PDO::FETCH_ASSOC]);
    $pdo->sqliteCreateFunction('NOW', static fn (...$args) => gmdate('Y-m-d H:i:s'), -1);
    return $pdo;
}

'''
patched=original[:start]+connector+original[end:]
(root/'api/bootstrap.php').write_text(patched,encoding='utf-8')
assert patched[:start]==original[:start] and patched[start+len(connector):]==original[end:]
assert (root/'api/reports.php').read_bytes()==(APP/'frontend/public/api/reports.php').read_bytes()
policy=scratch/'policy.json';keys={a:secrets.token_hex(32) for a in ['rapport','rga']}
with socket.socket() as s:s.bind(('127.0.0.1',0));port=s.getsockname()[1]
origin=f'http://127.0.0.1:{port}'
def phpstr(s):return "'"+str(s).replace('\\','\\\\').replace("'","\\'")+"'"
for app in keys:
 cfg={'environment':'local','auth_mode':'connect_gateway','test_sqlite_file':str(db),
 'connect_portal_url':origin,'connect_launch_secret':keys[app],
 'connect_gate_cookie':'AVEREO_'+app.upper()+'_GATE',
 'connect_launch_nonce_directory':str(scratch/(app+'-nonces')),
 'connect_trial_access_file':str(policy),'connect_gate_session_seconds':1800}
 (scratch/(app+'.php')).write_text('<?php return ['+','.join(phpstr(k)+'=>'+phpstr(v) for k,v in cfg.items())+'];',encoding='utf-8')
env=dict(os.environ,AVEREO_CONFIG_FILE=str(scratch/'rapport.php'),AVEREO_RGA_CONFIG_FILE=str(scratch/'rga.php'))
ext=Path(PHP).parent/'ext/php_pdo_sqlite.dll'
cmd=[PHP]+(['-d','extension='+str(ext)] if os.name=='nt' else [])+['-S',f'127.0.0.1:{port}','-t',str(root)]
log=(scratch/'server.log').open('w',encoding='utf-8')
server=subprocess.Popen(cmd,env=env,stdout=log,stderr=log)
checks=[]
def check(name,ok):
 if not ok:raise AssertionError(name)
 checks.append(name)
def req(path,cookie='',method='GET',body=None):
 c=http.client.HTTPConnection('127.0.0.1',port,timeout=5)
 headers={'Cookie':cookie,'Origin':origin,'Sec-Fetch-Dest':'iframe','Content-Type':'application/json'}
 c.request(method,path,None if body is None else json.dumps(body),headers)
 r=c.getresponse();out=(r.status,dict(r.getheaders()),r.read());c.close();return out
def b64(raw):return base64.urlsafe_b64encode(raw).rstrip(b'=').decode()
def ticket(app,id):
 now=int(time.time());p={'v':1,'app':app,'iat':now,'exp':now+90,'nonce':secrets.token_urlsafe(24),
 'identity':{'provider':'avereo_connect','id':str(id)}}
 enc=b64(json.dumps(p,separators=(',',':')).encode());return enc+'.'+b64(hmac.new(keys[app].encode(),enc.encode(),hashlib.sha256).digest())
def enter(app,id):
 path='/connect/entry.php' if app=='rapport' else '/rga/entry.php'
 r=req(path+'?ticket='+ticket(app,id));check(app+' trial entry '+str(id),r[0]==303)
 return r[1]['Set-Cookie'].split(';')[0]
def window(status='active',expired=False):
 now=int(time.time());policy.write_text(json.dumps({'version':1,'accounts':{'42':{'status':status,
 'not_before':now-1000,'not_after':now-1 if expired else now+1000,'applications':['rapport','rga']}}}),encoding='utf-8')
try:
 for _ in range(80):
  try:
   with socket.create_connection(('127.0.0.1',port),timeout=.1):break
  except OSError:
   assert server.poll() is None,'PHP fixture failed';time.sleep(.05)
 window();a=enter('rapport',42);b=enter('rapport',43);rga=enter('rga',42)
 for id,cookie,title in [('a'*32,a,'Trial A'),('b'*32,b,'Trial B')]:
  r=req('/api/reports.php',cookie,'POST',{'id':id,'report':{'titre':title,'observations':[]}})
  check('Create private report '+title,r[0]==200)
 listing=json.loads(req('/api/reports.php',a)[2]);check('A list contains only A',[r['id'] for r in listing['reports']]==['a'*32])
 listing=json.loads(req('/api/reports.php',b)[2]);check('B list contains only B',[r['id'] for r in listing['reports']]==['b'*32])
 # Place a matching report beyond the first 50 rows and verify scope before LIMIT.
 with sqlite3.connect(db) as fixture:
  fixture.execute("UPDATE rapport_reports SET address='Rue des Tests', updated_at='2020-01-01', reference_code='REF_100%' WHERE public_id=?", ('a'*32,))
  fixture.executemany("""INSERT INTO rapport_reports (public_id,title,owner_provider,owner_id,updated_at)
    SELECT ?,?,owner_provider,owner_id,'2026-01-01' FROM rapport_reports WHERE public_id=?""",
    [(f'{n:032x}', 'Report '+str(n), 'a'*32) for n in range(52)])
 def results(path):return json.loads(req('/api/reports.php?'+path,a)[2])['reports']
 check('Five most recent in deterministic order',[r['id'] for r in results('limit=5')]==[f'{n:032x}' for n in range(51,46,-1)])
 check('Expanded list capped at 50',len(results('limit=50'))==50)
 for term in ['rue%20des%20tests','REF_100%25','Trial%20A']:
  check('Search before limit: '+term,[r['id'] for r in results('limit=5&q='+term)]==['a'*32])
 check('Wildcard remains literal',len(results('q=%25'))==1 and len(results('q=_'))==1)
 check('Search cannot return another account',not results('q=Trial%20B'))
 with sqlite3.connect(db) as fixture:
  fixture.executemany("DELETE FROM rapport_reports WHERE public_id=?",[(f'{n:032x}',) for n in range(52)])
 check('A cannot read B by id',req('/api/reports.php?id='+'b'*32,a)[0]==404)
 check('A cannot overwrite B',req('/api/reports.php',a,'POST',{'id':'b'*32,'report':{'titre':'intrusion','observations':[]}})[0]==403)
 req('/api/reports.php?id='+'b'*32,a,'DELETE')
 check('A cannot delete B',req('/api/reports.php?id='+'b'*32,b)[0]==200)
 check('Active RGA map works',req('/rga/carte.php',rga)[0]==200)
 check('Rapport cookie cannot open RGA',req('/rga/carte.php',a)[0]==403)
 window(expired=True)
 for method,path,body in [('GET','/api/reports.php',None),('POST','/api/reports.php',{'id':'a'*32,'report':{'titre':'expired','observations':[]}}),('DELETE','/api/reports.php?id='+'a'*32,None)]:
  check('Expired open session blocks API '+method,req(path,a,method,body)[0]==403)
 check('Expired Rapport page denied',req('/index.php',a)[0]==303)
 check('Expired RGA open session denied',req('/rga/carte.php',rga)[0]==403)
 check('Expired RGA access false',json.loads(req('/rga/access.php',rga)[2])=={'authorized':False})
 check('Expired new Rapport ticket denied',req('/connect/entry.php?ticket='+ticket('rapport',42))[0]==403)
 check('Expired new RGA ticket denied',req('/rga/entry.php?ticket='+ticket('rga',42))[0]==403)
 check('Other account keeps access',req('/api/reports.php',b)[0]==200)
 window('revoked')
 check('Manual revocation stops existing Rapport session',req('/api/reports.php',a)[0]==403)
 check('Manual revocation stops existing RGA session',req('/rga/carte.php',rga)[0]==403)
 print(json.dumps({'status':'passed','checks':checks,'count':len(checks),
 'database':'private temporary SQLite; connector replaced only in fixture','productionOrPreproductionWrites':False}))
finally:
 server.terminate();server.wait(timeout=10);log.close()
 assert scratch.resolve().parent==parent and scratch.name.startswith('avereo-trial-http-')
 shutil.rmtree(scratch)
