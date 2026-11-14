"""Install a private, read-only CONNECT metadata refresh for Passeport preproduction."""
import argparse
import hashlib
import json
from pathlib import Path
import shutil
import subprocess
import os
import tempfile

HOME=Path('/home/daje3540');PHP='/opt/alt/php83/usr/bin/php'
def digest(value):return hashlib.sha256(value).hexdigest()
def require(value,message):
    if not value:raise ValueError(message)
def cron():
    r=subprocess.run(['crontab','-l'],stdout=subprocess.PIPE,stderr=subprocess.PIPE);require(r.returncode==0,'Existing scheduler unreadable');return r.stdout
def write(path,content):
    fd,name=tempfile.mkstemp(prefix='.sharing-',dir=str(path.parent))
    with os.fdopen(fd,'wb')as f:f.write(content);f.flush();os.fsync(f.fileno())
    os.chmod(name,0o600);os.replace(name,str(path))

def configuration_code(config,aliases,directory):
    return '$c=require '+json.dumps(str(config))+';$before=$c;$aliases=json_decode(file_get_contents('+json.dumps(str(aliases))+'),true,32,JSON_THROW_ON_ERROR);$c["document_share_directory"]='+json.dumps(str(directory))+';$c["document_share_aliases"]=$aliases;$check=$c;unset($check["document_share_directory"],$check["document_share_aliases"]);unset($before["document_share_directory"],$before["document_share_aliases"]);if($check!==$before)exit(3);echo "<?php".PHP_EOL."return ".var_export($c,true).";".PHP_EOL;'

def prepare(work):
    require(work.resolve()==work and work.parent==HOME/'private' and work.name.startswith('preprod-rapport-passeport-archives-partage-'),'Dedicated private staging')
    require(not(work/'services-public.json').exists(),'Services already prepared')
    config=HOME/'.avereo/passeport-immo-preprod/config.php';private=HOME/'.avereo/passeport-immo-preprod/sharing'
    require(config.resolve()==config and config.is_file() and private.parent.resolve()==private.parent and not private.exists(),'Fresh private service directory')
    aliases=json.loads((work/'recipient-aliases-private.json').read_text());require(isinstance(aliases,dict),'Explicit private alias mapping required')
    before=config.read_bytes();before_cron=cron();write(work/'configuration-before-private.php',before);write(work/'scheduler-before-private.txt',before_cron)
    private.mkdir(mode=0o700);write(private/'export-share-directory.php',(work/'export-share-directory.php').read_bytes())
    directory=private/'accounts.json';after_cron=None;changed_config=None
    try:
        # Only two non-secret metadata settings change; all existing values are retained.
        code=configuration_code(config,work/'recipient-aliases-private.json',directory)
        changed_config=subprocess.check_output([PHP,'-r',code],stderr=subprocess.PIPE);require(changed_config.startswith(b'<?php\n') and config.read_bytes()==before,'Private configuration changed concurrently');write(config,changed_config)
        command=[PHP,str(private/'export-share-directory.php'),str(HOME/'connect-preprod.avereo.fr'),str(HOME/'private/connect-preprod/config.php'),str(config),str(directory)]
        result=json.loads(subprocess.check_output(command))
        require(result['status']=='exported','Projection export failed')
        start=b'# BEGIN AVEREO PASSEPORT IMMO PREPROD SHARE DIRECTORY';finish=b'# END AVEREO PASSEPORT IMMO PREPROD SHARE DIRECTORY'
        require(start not in before_cron and finish not in before_cron,'Existing projection service requires inspection')
        import shlex
        line='* * * * * '+' '.join(shlex.quote(a) for a in command)+' >> '+shlex.quote(str(private/'scheduler.log'))+' 2>&1'
        require('%' not in line and '\n' not in line,'Scheduler command guard')
        after_cron=before_cron+(b'\n' if before_cron and not before_cron.endswith(b'\n') else b'')+start+b'\n'+line.encode()+b'\n'+finish+b'\n'
        require(cron()==before_cron,'Scheduler changed concurrently');write(work/'scheduler-after-private.txt',after_cron)
        subprocess.run(['crontab',str(work/'scheduler-after-private.txt')],check=True);require(cron()==after_cron,'Scheduler readback differs')
        receipt={'status':'ready','configurationBeforeSha256':digest(before),'configurationAfterSha256':digest(changed_config),'existingConfigurationValuesPreserved':True,'schedulerBeforeSha256':digest(before_cron),'schedulerAfterSha256':digest(after_cron),'existingSchedulerBytesPreserved':True,'addedSchedulerEntries':1,'newCredentials':False,'connectDatabaseRowsChanged':False,'projection':result}
        write(work/'services-public.json',(json.dumps(receipt,indent=2)+'\n').encode());return receipt
    except BaseException:
        if after_cron is not None and cron()==after_cron:subprocess.run(['crontab',str(work/'scheduler-before-private.txt')],check=True)
        if changed_config is not None and config.read_bytes()==changed_config:write(config,before)
        raise

if __name__=='__main__':
    p=argparse.ArgumentParser(description=__doc__);p.add_argument('--work',type=Path,required=True);a=p.parse_args();__import__('os').umask(0o077);print(json.dumps(prepare(a.work)))
