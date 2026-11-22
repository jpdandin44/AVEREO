"""Guarded delivery of the frozen read-only sharing candidate, preproduction only."""
import argparse
import importlib.util
import json
from pathlib import Path
import subprocess

HERE=Path(__file__).resolve().parent
spec=importlib.util.spec_from_file_location('sharing_release_base',HERE/'release-archives-preproduction.py')
release=importlib.util.module_from_spec(spec);spec.loader.exec_module(release)
release.ARTIFACT='a406058fc6986814c1f087159480891c2307cbcba637b727b45f8723384b4f7f'
release.COMPANION_BASELINES={}
release.allowed_write=lambda name:name in ('index.html','api/index.php','api/sharing.php') or name.startswith('assets/')
BASELINES={'api/index.php':'ab52c3d619374a33ceccf71b325938303b1d30f4d97849fd996e9a6e7bfa2d26','index.html':'23af320ba12a7d0133de6e61ca3f9ff0831c062794ec706fa7875095ba94b904'}
original_validate=release.validate_scope

def validate(work,plan=None):
    manifest,candidates=original_validate(work,plan)
    if plan:
        for name,op in plan['applications']['passeport-immo']['operations'].items():
            if name in BASELINES and op['action']!='preserve':release.engine.require(op['before'].get('sha256_lf')==BASELINES[name],'Reviewed corbeille baseline differs: '+name)
            if name=='api/sharing.php':release.engine.require(op['action']=='create' and op['before']['exists'] is False,'New sharing endpoint must not overwrite an existing file')
            if not release.allowed_write(name):release.engine.require(op['before'].get('sha256_lf')==manifest['applications']['passeport-immo']['files'][name]['sha256'],'Protected runtime differs: '+name)
    return manifest,candidates
release.validate_scope=validate

def qualification(work,action):
    p=subprocess.run([release.engine.PHP,str(work/'qualify-sharing-preproduction.php'),str(work),action],stdout=subprocess.PIPE,stderr=subprocess.PIPE)
    release.engine.require(p.returncode==0,'Private sharing qualification failed: '+p.stderr.decode('utf-8','replace')[:240]);return json.loads(p.stdout)

def order(item):
    name=item[0]
    return (0 if name=='api/sharing.php' else 2 if name=='api/index.php' else 3 if name=='index.html' else 1,name)

def perform(action,work):
    if action=='prepare':
        release.engine.require(json.loads((work/'services-public.json').read_text())['status']=='ready','Private CONNECT projection service required')
        result=release.perform('prepare',work);_,candidates=validate(work)
        target=work/'candidate-public';target.mkdir(mode=0o700)
        for name,content in candidates['passeport-immo'].items():
            p=target/name;p.parent.mkdir(mode=0o700,parents=True,exist_ok=True);p.write_bytes(content);p.chmod(0o600)
        schema=release.engine.HOME/'.avereo/passeport-immo-preprod/backups/bin/storage.sql'
        plan=json.loads((work/'plan.json').read_text());plan['backupSchemaBefore']=release.engine.record(schema)
        release.engine.write_json(work/'plan.json',plan);(work/'recovery/backup-schema.sql').write_bytes(schema.read_bytes());(work/'recovery/backup-schema.sql').chmod(0o600)
        qualification(work,'rehearse');return result
    plan=json.loads((work/'plan.json').read_text());_,candidates=validate(work,plan)
    release.engine.require(json.loads((work/'sharing-rehearse-public.json').read_text())['status']=='passed','Copy rehearsal missing')
    qualification(work,'verify')
    release.engine.require(release.external_guards()==plan['externalGuards'],'Production, configuration or unrelated scheduler drift')
    if action=='verify':release.engine.verify_installed(work,plan);return {'status':'installed_files_verified'}
    release.engine.require(not(work/'delivery.json').exists(),'Delivery already recorded');release.engine.verify_preflight(work,plan)
    writes=[]
    try:
        for name,op in sorted(plan['applications']['passeport-immo']['operations'].items(),key=order):
            if op['action']=='preserve':continue
            target=release.TARGET/name;release.engine.require(release.engine.record(target)==op['before'],'Concurrent public file change')
            release.engine.atomic_write(target,candidates['passeport-immo'][name],op['after']['mode']);writes.append(name)
        result=release.engine.verify_installed(work,plan)
        schema=release.engine.HOME/'.avereo/passeport-immo-preprod/backups/bin/storage.sql'
        release.engine.require(release.engine.record(schema)==plan['backupSchemaBefore'],'Backup schema changed concurrently')
        release.engine.atomic_write(schema,(work/'storage.sql').read_bytes(),0o600)
        release.engine.require(release.external_guards()==plan['externalGuards'],'External guard drift')
        result.update(status='delivered_verified',observedAt=release.engine.now(),writes=writes,backupSchemaUpdated=True)
        release.engine.write_json(work/'delivery.json',result);return {'status':'delivered_verified','writtenFiles':len(writes),'backupSchemaUpdated':True}
    except BaseException:
        for name in reversed(writes):
            op=plan['applications']['passeport-immo']['operations'][name];target=release.TARGET/name
            if release.engine.record(target)!=op['after']:raise RuntimeError('Rollback conflict; inspect before further changes')
            if op['before']['exists']:release.engine.atomic_write(target,(work/'recovery/passeport-immo/public'/name).read_bytes(),op['before']['mode'])
            else:target.unlink()
        raise

if __name__=='__main__':
    p=argparse.ArgumentParser(description=__doc__);p.add_argument('action',choices=['prepare','apply','verify']);p.add_argument('--work',type=Path,required=True);p.add_argument('--authorized-artifact');a=p.parse_args();w=a.work
    release.engine.require(w.parent==release.engine.HOME/'private' and w.name.startswith('preprod-rapport-passeport-archives-partage-') and w.resolve()==w and w.is_dir(),'Dedicated private staging required')
    if a.action=='apply':release.engine.require(a.authorized_artifact==release.ARTIFACT,'Explicit frozen artifact required')
    release.engine.os.umask(0o077);print(json.dumps(perform(a.action,w)))
