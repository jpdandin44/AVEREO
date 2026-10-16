"""Private selective transfer against two isolated MariaDB databases; fictitious data only."""
import json
import secrets
import subprocess
import tempfile
import uuid
from pathlib import Path

APP = Path(__file__).resolve().parents[1]


def command(*args):
    return subprocess.check_output(args, text=True, stderr=subprocess.STDOUT).strip()


def run():
    prefix = 'passeport-transfer-' + uuid.uuid4().hex[:10]
    network = prefix + '-net'
    database = prefix + '-db'
    worker = prefix + '-worker'
    created = []
    password = secrets.token_hex(24)
    with tempfile.TemporaryDirectory(prefix=prefix) as temporary:
        root = Path(temporary).resolve()
        for side, environment in [('source', 'preprod'), ('target', 'production')]:
            (root / (side + '.php')).write_text(
                "<?php return [" + f"'environment'=>'{environment}','storage_enabled'=>true,"
                + f"'storage_dsn'=>'mysql:host={database};dbname=passeport_{side};charset=utf8mb4',"
                + f"'storage_user'=>'passeport','storage_password'=>'{password}',"
                + f"'storage_directory'=>'/tmp/{side}-documents'];", encoding='utf-8')
        try:
            command('docker', 'network', 'create', '--internal', network)
            command('docker', 'run', '-d', '--rm', '--name', database, '--network', network,
                    '-e', 'MARIADB_DATABASE=passeport_source', '-e', 'MARIADB_USER=passeport',
                    '-e', 'MARIADB_PASSWORD=' + password, '-e', 'MARIADB_ROOT_PASSWORD=' + password,
                    'mariadb:11.4')
            created.append(database)
            command('docker', 'run', '-d', '--rm', '--name', worker, '--network', network,
                    '--mount', f'type=bind,source={root},target=/configs,readonly',
                    '--mount', f'type=bind,source={APP},target=/app,readonly',
                    'avereo-passeport-connect-test:local')
            created.append(worker)
            bootstrap = "$c=require '/configs/source.php'; for($i=0;$i<120;$i++){try{$db=new PDO(str_replace('dbname=passeport_source;','',$c['storage_dsn']),'root',$c['storage_password']);break;}catch(Throwable){usleep(500000);}} $db->setAttribute(PDO::ATTR_ERRMODE,PDO::ERRMODE_EXCEPTION); $db->exec('CREATE DATABASE passeport_target'); $db->exec(\"GRANT ALL ON passeport_target.* TO 'passeport'@'%'\"); mkdir('/fixture'); foreach(['source','target'] as $side)copy('/configs/'.$side.'.php','/fixture/'.$side.'.php'); foreach(['transfer-property.php'=>'workflows/transfer-property.php','storage.sql'=>'database/storage.sql','test.php'=>'tests/transfer-property.php'] as $name=>$path)copy('/app/'.$path,'/fixture/'.$name); mkdir('/tmp/source-documents',0700); mkdir('/tmp/target-documents',0700);"
            command('docker', 'exec', worker, 'php', '-r', bootstrap)
            try:
                output = command('docker', 'exec', worker, 'php', '-d', 'display_errors=1', '-d', 'log_errors=0', '/fixture/test.php')
            except subprocess.CalledProcessError as error:
                raise RuntimeError(error.output) from None
            result = json.loads(output)
            print(json.dumps(result, ensure_ascii=False))
        finally:
            for container in reversed(created):
                subprocess.run(['docker', 'stop', container], check=True, stdout=subprocess.DEVNULL)
            subprocess.run(['docker', 'network', 'rm', network], check=False,
                           stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)


if __name__ == '__main__':
    run()
