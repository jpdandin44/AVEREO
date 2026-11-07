<?php
declare(strict_types=1);
namespace Avereo\Projet\Developments;
final class Failure extends \RuntimeException
{
    public function __construct(public readonly int $status){parent::__construct('Espace privé indisponible.');}
}
