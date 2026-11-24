<?php
declare(strict_types=1);
namespace Avereo\Connect\Developments;

/** Retain live replay claims; only expired, well-formed private files can be removed. */
final class NonceStore
{
    public function __construct(private readonly string $directory, private readonly ?\Closure $clock = null) {}

    public function claim(string $nonce, int $expires): bool
    {
        $now = $this->clock === null ? time() : ($this->clock)();
        if (!preg_match('/^[a-f0-9]{48}$/D', $nonce) || $expires <= $now || $expires > $now + 35) return false;
        $lockPath = $this->directory . '/.nonce.lock';
        if (is_link($lockPath)) return false;
        $lock = @fopen($lockPath, 'c');
        if ($lock === false) return false;
        try {
            if (!@chmod($lockPath, 0600) || !flock($lock, LOCK_EX)) return false;
            $files = glob($this->directory . '/*.used');
            if ($files === false) return false;
            $retained = 0;
            foreach ($files as $file) {
                $expired = false;
                if (preg_match('/^[a-f0-9]{64}\.used$/D', basename($file)) && !is_link($file) && is_file($file)
                    && filesize($file) > 0 && filesize($file) <= 12) {
                    $value = @file_get_contents($file);
                    $expired = is_string($value) && preg_match('/^[1-9][0-9]{0,10}$/D', $value)
                        && (int)$value < $now - 5;
                }
                if (!$expired || !@unlink($file)) $retained++;
            }
            if ($retained >= 4096) return false;
            $path = $this->directory . '/' . hash('sha256', $nonce) . '.used';
            $handle = @fopen($path, 'x');
            if ($handle === false) return false;
            $bytes = (string)$expires;
            $written = fwrite($handle, $bytes);
            fclose($handle);
            if ($written !== strlen($bytes) || !@chmod($path, 0600)) {
                @unlink($path);
                return false;
            }
            return true;
        } finally {
            flock($lock, LOCK_UN);
            fclose($lock);
        }
    }
}
