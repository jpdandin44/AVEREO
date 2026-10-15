<?php
declare(strict_types=1);
if (PHP_SAPI !== 'cli') { http_response_code(404); exit; }
function passeport_cron_markers(string $environment): array
{
    if (!in_array($environment,['preprod','production'],true)) throw new RuntimeException('Known hosted environment required');
    $label='AVEREO PASSEPORT IMMO '.strtoupper($environment).' BACKUP';
    return ['# BEGIN '.$label,'# END '.$label];
}

function passeport_cron_append(string $existing, string $command, bool $qualify=true, string $environment='preprod'): string
{
    [$begin,$end]=passeport_cron_markers($environment);
    if (str_contains($existing,$begin) || str_contains($existing,$end)) throw new RuntimeException('Existing backup task requires inspection');
    // A complete block belonging to the other environment is retained byte for byte.
    [$otherBegin,$otherEnd]=passeport_cron_markers($environment==='preprod' ? 'production' : 'preprod');
    $unmanaged=preg_replace('/^'.preg_quote($otherBegin,'/').'\n.*?^'.preg_quote($otherEnd,'/').'\n/ms','',$existing,-1,$blocks);
    if ($blocks>1 || str_contains($unmanaged,$otherBegin) || str_contains($unmanaged,$otherEnd)
        || preg_match('/passeport.*(?:scheduled-backup|backup-storage)/i',$unmanaged)) throw new RuntimeException('Existing backup task requires inspection');
    if (str_contains($command,"\n") || str_contains($command,'%')) throw new RuntimeException('Cron command guard');
    $separator=$existing!=='' && !str_ends_with($existing,"\n") ? "\n" : '';
    return $existing.$separator.$begin."\n20 * * * * ".$command."\n"
        .($qualify ? '* * * * * '.$command." # initial-qualification\n" : '').$end."\n";
}

function passeport_cron_finalize(string $current, string $command, string $environment='preprod'): string
{
    [$begin,$finish]=passeport_cron_markers($environment);
    $start=strpos($current,$begin."\n"); $end=strpos($current,$finish."\n");
    if ($start===false || $end===false || $end<$start || substr_count($current,$begin)!==1 || substr_count($current,$finish)!==1) throw new RuntimeException('Managed cron block guard');
    $block=substr($current,$start,$end+strlen($finish."\n")-$start);
    $expected=passeport_cron_append('',$command,true,$environment);
    if ($block!==$expected && $block!==passeport_cron_append('',$command,false,$environment)) throw new RuntimeException('Managed cron block changed');
    return substr($current,0,$start).passeport_cron_append('',$command,false,$environment).substr($current,$end+strlen($finish."\n"));
}

function passeport_crontab_read(): string
{
    $lines=[]; $code=0; exec('crontab -l 2>/dev/null',$lines,$code);
    if ($code!==0) throw new RuntimeException('Existing crontab could not be read; no replacement allowed');
    // crontab -l normalizes its own final newline; compare all other bytes after this normalization.
    return $lines ? implode("\n",$lines)."\n" : '';
}

function passeport_crontab_write(string $text, string $privateFile): void
{
    if (file_exists($privateFile) || file_put_contents($privateFile,$text)!==strlen($text)) throw new RuntimeException('New private crontab file required');
    chmod($privateFile,0600); $out=[]; $code=0;
    exec('crontab '.escapeshellarg($privateFile).' 2>/dev/null',$out,$code);
    if ($code!==0 || passeport_crontab_read()!==$text) throw new RuntimeException('Crontab install/readback failed');
}

if (realpath($_SERVER['SCRIPT_FILENAME'] ?? '')===__FILE__) {
    umask(0077); $options=getopt('',['finalize','environment:']);
    $environment=(string)($options['environment'] ?? 'preprod');
    passeport_cron_markers($environment);
    $home='/home/daje3540'; $application=$environment==='production' ? 'passeport-immo' : 'passeport-immo-preprod';
    $bin=$home.'/.avereo/'.$application.'/backups/bin';
    $root=$home.'/private/passeport-immo-backups/'.$environment;
    if (realpath($root)!==$root || realpath($bin)!==$bin || is_link($root) || is_link($bin)) throw new RuntimeException('Hosted paths guard');
    $configPath=$home.'/.avereo/'.$application.'/config.php';
    if (!is_file($configPath) || is_link($configPath)) throw new RuntimeException('Private configuration required');
    $config=require $configPath;
    if (($config['environment'] ?? '')!==$environment) throw new RuntimeException('Configuration environment mismatch');
    $command='AVEREO_BACKUP_TRIGGER=cron /opt/alt/php83/usr/bin/php '.escapeshellarg($bin.'/scheduled-backup.php')
        .' --config='.escapeshellarg($configPath)
        .' --root='.escapeshellarg($root).' --schema='.escapeshellarg($bin.'/storage.sql').' --keep=30 >> '.escapeshellarg($root.'/scheduler.log').' 2>&1';
    $before=passeport_crontab_read();
    if (array_key_exists('finalize',$options)) {
        $latest=json_decode(file_get_contents($root.'/latest.json'),true,64,JSON_THROW_ON_ERROR);
        if (($latest['trigger'] ?? '')!=='cron' || ($latest['proof']['temporaryRowRestore'] ?? '')!=='passed') throw new RuntimeException('Real cron success required');
        $after=passeport_cron_finalize($before,$command,$environment);
        $operation='finalized';
    } else {
        if (is_file($root.'/cron-installation.json')) throw new RuntimeException('Existing installation receipt');
        $after=passeport_cron_append($before,$command,true,$environment); $operation='installed_with_qualification';
    }
    $id=gmdate('Ymd\THis\Z').'-'.bin2hex(random_bytes(4));
    $backup=$root.'/crontab-before-'.$operation.'-'.$id.'.txt';
    file_put_contents($backup,$before); chmod($backup,0600);
    passeport_crontab_write($after,$root.'/crontab-'.$operation.'-'.$id.'.txt');
    $receipt=['operation'=>$operation,'environment'=>$environment,'observedAt'=>gmdate('c'),'schedule'=>'daily 03:20 Europe/Paris with hourly catch-up',
        'retentionSuccessfulCopies'=>30,'beforeSha256'=>hash('sha256',$before),'afterSha256'=>hash('sha256',$after),
        'otherCronLinesPreserved'=>true,'qualificationEntryPresent'=>$operation!=='finalized','command'=>$command];
    file_put_contents($root.'/cron-'.$operation.'.json',json_encode($receipt,JSON_PRETTY_PRINT|JSON_UNESCAPED_SLASHES|JSON_THROW_ON_ERROR)."\n");
    chmod($root.'/cron-'.$operation.'.json',0600);
    if ($operation==='installed_with_qualification') {
        file_put_contents($root.'/cron-installation.json',json_encode($receipt,JSON_THROW_ON_ERROR)); chmod($root.'/cron-installation.json',0600);
    }
    echo json_encode($receipt,JSON_UNESCAPED_SLASHES|JSON_THROW_ON_ERROR)."\n";
}
