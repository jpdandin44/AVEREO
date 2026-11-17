<?php
declare(strict_types=1);
require dirname(__DIR__).'/src/autoload.php';

if (PHP_SAPI!=='cli') { http_response_code(404); exit; }
$options=getopt('',['catalogue-file:','document-root:']);
$file=$options['catalogue-file']??'';$rawRoot=$options['document-root']??null;
$public=is_string($rawRoot)&&$rawRoot!==''?realpath($rawRoot):false;
if (!is_string($file) || $file==='' || $public===false || !is_dir($public)) {
    fwrite(STDERR,"Indiquez --catalogue-file et --document-root avec les chemins absolus qualifiés.\n");exit(1);
}
$_SERVER['DOCUMENT_ROOT']=$public;
try {
    new \Avereo\Connect\Administration\ProfileCatalog($file);
    $handle=@fopen($file,'x');
    if ($handle===false) throw new RuntimeException('Le catalogue existe ou son répertoire est indisponible ; aucun remplacement.');
    try {
        if (!chmod($file,0600)) throw new RuntimeException('Protection du catalogue impossible.');
        $data=json_encode(\Avereo\Connect\Administration\ProfileCatalog::initial(),JSON_THROW_ON_ERROR|JSON_UNESCAPED_UNICODE);
        if (fwrite($handle,$data)!==strlen($data)) throw new RuntimeException('Initialisation incomplète ; vérifier le fichier privé avant activation.');
    } finally { fclose($handle); }
    echo "Catalogue initial créé : trois types sans droit, aucune affectation.\n";
} catch(Throwable $error) {fwrite(STDERR,$error->getMessage()."\n");exit(1);}
