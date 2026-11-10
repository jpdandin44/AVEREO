<?php
declare(strict_types=1);
namespace Avereo\Connect\Administration;

/** Private projection; the file lock serializes database changes and projection publication. */
final class TrialPolicyStore
{
    public function __construct(private readonly string $path)
    {
        if (!preg_match('~^(?:/|[A-Za-z]:[\\\\/])~', $path) || str_contains($path,'://')
            || !is_dir(dirname($path)) || is_link($path)) throw new \InvalidArgumentException('Chemin de politique privée invalide.');
        $parent = realpath(dirname($path));
        $root = realpath((string)($_SERVER['DOCUMENT_ROOT'] ?? ''));
        if ($root !== false && $root !== '' && $parent !== false
            && str_starts_with(strtolower(str_replace('\\','/',$parent)).'/', rtrim(strtolower(str_replace('\\','/',$root)),'/').'/')) {
            throw new \InvalidArgumentException('La politique doit rester hors du répertoire public.');
        }
    }

    public function locked(callable $operation): mixed
    {
        $lock = fopen($this->path.'.lock','c');
        if ($lock === false || !flock($lock,LOCK_EX)) throw new \RuntimeException('Politique privée indisponible.');
        @chmod($this->path.'.lock',0600);
        try { return $operation(); }
        finally { flock($lock,LOCK_UN); fclose($lock); }
    }

    public function set(int $id, array $rule): void
    {
        if (!is_file($this->path)) throw new \RuntimeException('Politique absente ; restauration requise avant modification.');
        $policy = null;
        if (is_file($this->path)) {
            if (filesize($this->path)>65536) throw new \RuntimeException('Politique trop volumineuse.');
            $policy = json_decode((string)file_get_contents($this->path),true,16,JSON_THROW_ON_ERROR);
            if (!is_array($policy) || ($policy['version']??null)!==1 || !is_array($policy['accounts']??null)) throw new \RuntimeException('Politique privée invalide.');
        }
        $policy['accounts'][(string)$id]=$rule;
        $bytes=json_encode($policy,JSON_THROW_ON_ERROR|JSON_UNESCAPED_SLASHES);
        if (strlen($bytes)>65536) throw new \RuntimeException('Politique trop volumineuse.');
        $temporary=$this->path.'.'.bin2hex(random_bytes(8)).'.tmp';
        try {
            if (file_put_contents($temporary,$bytes,LOCK_EX)!==strlen($bytes)) throw new \RuntimeException('Écriture de politique impossible.');
            @chmod($temporary,0600);
            if (!rename($temporary,$this->path)) throw new \RuntimeException('Publication de politique impossible.');
        } finally { if (is_file($temporary)) unlink($temporary); }
    }

    /** Read under the same exclusive lock used to publish an application change. */
    public function priorRule(int $id): ?array
    {
        if (!is_file($this->path) || filesize($this->path)>65536) throw new \RuntimeException('Politique indisponible.');
        $policy = json_decode((string)file_get_contents($this->path),true,16,JSON_THROW_ON_ERROR);
        if (($policy['version'] ?? null)!==1 || !is_array($policy['accounts'] ?? null)) throw new \RuntimeException('Politique invalide.');
        return $policy['accounts'][(string)$id] ?? null;
    }

    public function deny(int $id): void
    {
        $this->set($id,['status'=>'revoked','not_before'=>0,'not_after'=>PHP_INT_MAX,'applications'=>[]]);
    }
}
