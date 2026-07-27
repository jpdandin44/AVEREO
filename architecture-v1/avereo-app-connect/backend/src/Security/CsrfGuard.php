<?php

declare(strict_types=1);

namespace Avereo\Connect\Security;

use Avereo\Connect\Http\ApiException;
use Avereo\Connect\Http\Request;

final class CsrfGuard
{
    public static function assertValid(Request $request, string $expectedToken): void
    {
        $received = $request->header('x-csrf-token') ?? '';
        if ($expectedToken === '' || $received === '' || !hash_equals($expectedToken, $received)) {
            throw new ApiException(403, 'CSRF_REJECTED', 'Le jeton CSRF est absent ou invalide.');
        }
    }
}
