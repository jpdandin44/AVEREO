<?php
declare(strict_types=1);
if (PHP_SAPI !== 'cli') { http_response_code(404); exit; }
const PASSEPORT_CRON_BEGIN='# BEGIN AVEREO PASSEPORT IMMO PREPROD BACKUP';
const PASSEPORT_CRON_END='# END AVEREO PASSEPORT IMMO PREPROD BACKUP';

function passeport_cron_append(string $existing, string $command, bool $qualify=true): string
{
    if (str_contains($existing,PASSEPORT_CRON_BEGIN) || str_contains($existing,PASSEPORT_CRON_END)
        || preg_match('/passeport.*(?:scheduled-backup|backup-storage)/i',$existing)) throw new RuntimeException('Existing backup task requires inspection');
    if (str_contains($command,"\n") || str_contains($command,'%')) throw new RuntimeException('Cron command guard');
    $separator=$existing!=='' && !str_ends_with($existing,"\n") ? "\n" : '';
    return $existing.$separator.PASSEPORT_CRON_BEGIN."\n20 * * * * ".$command."\n"
        .($qualify ? '* * * * * '.$command." # initial-qualification\n" : '').PASSEPORT_CRON_END."\n";
}

function passeport_cron_finalize(string $current, string $command): string
{
    $start=strpos($current,PASSEPORT_CRON_BEGIN."\n"); $end=strpos($current,PASSEPORT_CRON_END."\n");
    if ($start===false || $end===false || $end<$start || substr_count($current,PASSEPORT_CRON_BEGIN)!==1 || substr_count($current,PASSEPORT_CRON_END)!==1) throw new RuntimeException('Managed cron block guard');
    $block=substr($current,$start,$end+strlen(PASSEPORT_CRON_END."\n")-$start);
    $expected=passeport_cron_append('',$command,true);
    if ($block!==$expected && $block!==passeport_cron_append('',$command,false)) throw new RuntimeException('Managed cron block changed');
    return substr($current,0,$start).passeport_cron_append('',$command,false).substr($current,$end+strlen(PASSEPORT_CRON_END."\n"));
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
    umask(0077); $options=getopt('',['finalize']);
    $home='/home/daje3540'; $bin=$home.'/.avereo/passeport-immo-preprod/backups/bin';
    $root=$home.'/private/passeport-immo-backups/preprod';
    if (realpath($root)!==$root || realpath($bin)!==$bin || is_link($root) || is_link($bin)) throw new RuntimeException('Hosted paths guard');
    $command='AVEREO_BACKUP_TRIGGER=cron /opt/alt/php83/usr/bin/php '.escapeshellarg($bin.'/scheduled-backup.php')
        .' --config='.escapeshellarg($home.'/.avereo/passeport-immo-preprod/config.php')
        .' --root='.escapeshellarg($root).' --schema='.escapeshellarg($bin.'/storage.sql').' --keep=30 >> '.escapeshellarg($root.'/scheduler.log').' 2>&1';
    $before=passeport_crontab_read();
    if (array_key_exists('finalize',$options)) {
        $latest=json_decode(file_get_contents($root.'/latest.json'),true,64,JSON_THROW_ON_ERROR);
        if (($latest['trigger'] ?? '')!=='cron' || ($latest['proof']['temporaryRowRestore'] ?? '')!=='passed') throw new RuntimeException('Real cron success required');
        $after=passeport_cron_finalize($before,$command);
        $operation='finalized';
    } else {
        if (is_file($root.'/cron-installation.json')) throw new RuntimeException('Existing installation receipt');
        $after=passeport_cron_append($before,$command,true); $operation='installed_with_qualification';
    }
    $id=gmdate('Ymd\THis\Z').'-'.bin2hex(random_bytes(4));
    $backup=$root.'/crontab-before-'.$operation.'-'.$id.'.txt';
    file_put_contents($backup,$before); chmod($backup,0600);
    passeport_crontab_write($after,$root.'/crontab-'.$operation.'-'.$id.'.txt');
    $receipt=['operation'=>$operation,'observedAt'=>gmdate('c'),'schedule'=>'daily 03:20 Europe/Paris with hourly catch-up',
        'retentionSuccessfulCopies'=>30,'beforeSha256'=>hash('sha256',$before),'afterSha256'=>hash('sha256',$after),
        'otherCronLinesPreserved'=>true,'qualificationEntryPresent'=>$operation!=='finalized','command'=>$command];
    file_put_contents($root.'/cron-'.$operation.'.json',json_encode($receipt,JSON_PRETTY_PRINT|JSON_UNESCAPED_SLASHES|JSON_THROW_ON_ERROR)."\n");
    chmod($root.'/cron-'.$operation.'.json',0600);
    if ($operation==='installed_with_qualification') {
        file_put_contents($root.'/cron-installation.json',json_encode($receipt,JSON_THROW_ON_ERROR)); chmod($root.'/cron-installation.json',0600);
    }
    echo json_encode($receipt,JSON_UNESCAPED_SLASHES|JSON_THROW_ON_ERROR)."\n";
}
