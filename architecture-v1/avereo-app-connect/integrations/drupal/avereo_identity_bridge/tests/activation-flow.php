<?php

declare(strict_types=1);

namespace Drupal\Core\Controller {
    abstract class ControllerBase
    {
    }
}

namespace Drupal\user {
    interface UserInterface
    {
        public function getPassword(): ?string;
    }

    final class ActivationFlowTestUser implements UserInterface
    {
        public bool $activated = false;
        public bool $saved = false;

        public function __construct(private ?string $password)
        {
        }

        public function getPassword(): ?string
        {
            return $this->password;
        }

        public function setPassword(string $password): self
        {
            $this->password = $password;
            return $this;
        }

        public function activate(): self
        {
            $this->activated = true;
            return $this;
        }

        public function save(): void
        {
            $this->saved = true;
        }
    }
}

namespace {
    use Drupal\avereo_identity_bridge\Controller\AccountActivationController;
    use Drupal\user\ActivationFlowTestUser;

    require dirname(__DIR__) . '/src/Controller/AccountActivationController.php';
    require dirname(__DIR__) . '/avereo_identity_bridge.module';

    function assertActivationFlow(bool $condition, string $message): void
    {
        if (!$condition) {
            throw new RuntimeException($message);
        }
    }

    $reflection = new ReflectionClass(AccountActivationController::class);
    $controller = $reflection->newInstanceWithoutConstructor();

    $requiresPassword = $reflection->getMethod('requiresPasswordInitialization');
    assertActivationFlow(
        $requiresPassword->invoke($controller, new ActivationFlowTestUser(null)) === true,
        'Un compte sans mot de passe doit suivre le parcours d’initialisation.',
    );
    assertActivationFlow(
        $requiresPassword->invoke($controller, new ActivationFlowTestUser('$2y$10$existing-hash')) === false,
        'Le mot de passe créé lors de l’inscription doit être conservé.',
    );

    $prepareAccount = $reflection->getMethod('prepareAccountForActivation');
    $existingAccount = new ActivationFlowTestUser('$2y$10$existing-hash');
    $prepareAccount->invoke($controller, $existingAccount, false);
    assertActivationFlow(
        $existingAccount->getPassword() === '$2y$10$existing-hash'
            && $existingAccount->activated
            && $existingAccount->saved,
        'L’approbation doit activer le compte sans remplacer son mot de passe.',
    );

    $accountWithoutPassword = new ActivationFlowTestUser(null);
    $prepareAccount->invoke($controller, $accountWithoutPassword, true);
    assertActivationFlow(
        is_string($accountWithoutPassword->getPassword())
            && strlen($accountWithoutPassword->getPassword()) === 64
            && $accountWithoutPassword->activated
            && $accountWithoutPassword->saved,
        'Un compte sans mot de passe doit recevoir un secret initial non transmissible.',
    );

    $recordMode = $reflection->getMethod('recordRequiresPasswordInitialization');
    assertActivationFlow(
        $recordMode->invoke($controller, null) === true,
        'Un ancien jeton doit rester compatible avec le parcours historique.',
    );
    assertActivationFlow(
        $recordMode->invoke($controller, ['requiresPasswordInitialization' => false]) === false,
        'Un jeton de confirmation ne doit pas ouvrir le formulaire de mot de passe.',
    );

    $destination = $reflection->getMethod('activationDestinationRoute');
    assertActivationFlow(
        $destination->invoke($controller, false) === 'avereo_identity_bridge.account_ready',
        'Un compte avec mot de passe doit revenir directement vers CONNECT.',
    );
    assertActivationFlow(
        $destination->invoke($controller, true) === 'avereo_identity_bridge.account_password',
        'Un compte sans mot de passe doit ouvrir le formulaire sécurisé.',
    );

    $existingPasswordMail = [];
    avereo_identity_bridge_mail('account_activation', $existingPasswordMail, [
        'display_name' => 'Compte existant',
        'activation_link' => 'https://identity.example/avereo/account/activate/token',
        'requires_password_initialization' => false,
        'support_email' => 'contact@avereo.fr',
    ]);
    $existingPasswordBody = implode("\n", $existingPasswordMail['body'] ?? []);
    assertActivationFlow(
        str_contains($existingPasswordBody, 'mot de passe choisi lors de l’inscription reste inchangé'),
        'L’e-mail doit confirmer la conservation du mot de passe existant.',
    );

    $initialPasswordMail = [];
    avereo_identity_bridge_mail('account_activation', $initialPasswordMail, [
        'display_name' => 'Compte administré',
        'activation_link' => 'https://identity.example/avereo/account/activate/token',
        'requires_password_initialization' => true,
        'support_email' => 'contact@avereo.fr',
    ]);
    $initialPasswordBody = implode("\n", $initialPasswordMail['body'] ?? []);
    assertActivationFlow(
        str_contains($initialPasswordBody, 'définir votre premier mot de passe'),
        'Un compte sans mot de passe doit recevoir le parcours d’initialisation.',
    );

    $routing = file_get_contents(dirname(__DIR__) . '/avereo_identity_bridge.routing.yml');
    assertActivationFlow(
        is_string($routing)
            && str_contains($routing, "_form: '\\Drupal\\avereo_identity_bridge\\Form\\ActivationPasswordForm'"),
        'La route du formulaire doit utiliser _form et non _controller.',
    );

    fwrite(STDOUT, "OK activation Drupal : mot de passe conservé et route formulaire valide.\n");
}
