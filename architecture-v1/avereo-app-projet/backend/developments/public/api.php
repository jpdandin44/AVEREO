<?php
declare(strict_types=1);
require __DIR__.'/bootstrap.php';
development_entry(is_string($_GET['route']??null)?$_GET['route']:'state');
