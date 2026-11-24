<?php

declare(strict_types=1);

// Mini lanceur de tests PHP, sans dépendance (aucun Composer, aucune bibliothèque tierce).
// Usage : php tests/api/run.php [filtre]    — les tests de base de données tournent dans le conteneur (voir docs/local-development.md).

$GLOBALS['vision_tests'] = [];
$GLOBALS['vision_skipped'] = [];

final class VisionSkip extends RuntimeException
{
}

function vision_test(string $name, callable $fn): void
{
    $GLOBALS['vision_tests'][] = ['name' => $name, 'fn' => $fn];
}

/** Interrompt le test courant sans échec (par exemple : pas de base de données disponible). */
function vision_skip(string $reason): never
{
    throw new VisionSkip($reason);
}

function vision_fail(string $message): never
{
    throw new AssertionError($message);
}

function vision_assert_true(mixed $value, string $message = ''): void
{
    if ($value !== true) {
        vision_fail(($message !== '' ? $message . ' : ' : '') . 'true attendu, reçu ' . var_export($value, true));
    }
}

function vision_assert_false(mixed $value, string $message = ''): void
{
    if ($value !== false) {
        vision_fail(($message !== '' ? $message . ' : ' : '') . 'false attendu, reçu ' . var_export($value, true));
    }
}

function vision_assert_same(mixed $expected, mixed $actual, string $message = ''): void
{
    if ($expected !== $actual) {
        vision_fail(
            ($message !== '' ? $message . ' : ' : '')
            . 'attendu ' . var_export($expected, true) . ', reçu ' . var_export($actual, true)
        );
    }
}

/**
 * Vérifie que $fn lève une exception de la classe donnée (et, si $contains est fourni, dont le message le contient).
 */
function vision_assert_throws(callable $fn, string $class = Throwable::class, ?string $contains = null, string $message = ''): void
{
    try {
        $fn();
    } catch (Throwable $exception) {
        if (!($exception instanceof $class)) {
            vision_fail(($message !== '' ? $message . ' : ' : '') . $class . ' attendu, reçu ' . $exception::class . ' (' . $exception->getMessage() . ')');
        }
        if ($contains !== null && !str_contains($exception->getMessage(), $contains)) {
            vision_fail(($message !== '' ? $message . ' : ' : '') . 'message attendu contenant « ' . $contains . ' », reçu « ' . $exception->getMessage() . ' »');
        }
        return;
    }
    vision_fail(($message !== '' ? $message . ' : ' : '') . $class . ' attendu, aucune exception levée');
}

/** Exécute tous les tests enregistrés ; renvoie le code de sortie (0 si tout passe). */
function vision_run_all(): int
{
    $passed = 0;
    $failed = 0;
    $skipped = 0;
    foreach ($GLOBALS['vision_tests'] as $test) {
        try {
            ($test['fn'])();
            $passed++;
            echo '  ok      ' . $test['name'] . PHP_EOL;
        } catch (VisionSkip $skip) {
            $skipped++;
            echo '  ignoré  ' . $test['name'] . ' (' . $skip->getMessage() . ')' . PHP_EOL;
        } catch (Throwable $exception) {
            $failed++;
            echo '  ÉCHEC   ' . $test['name'] . PHP_EOL . '          ' . $exception->getMessage() . PHP_EOL;
        }
    }
    echo PHP_EOL . "tests : $passed réussis, $failed en échec, $skipped ignorés" . PHP_EOL;
    return $failed === 0 ? 0 : 1;
}
