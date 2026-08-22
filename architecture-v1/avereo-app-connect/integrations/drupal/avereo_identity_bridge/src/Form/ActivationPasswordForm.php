<?php

declare(strict_types=1);

namespace Drupal\avereo_identity_bridge\Form;

use Drupal\Core\Entity\EntityTypeManagerInterface;
use Drupal\Core\Form\FormBase;
use Drupal\Core\Form\FormStateInterface;
use Drupal\user\UserInterface;
use Symfony\Component\DependencyInjection\ContainerInterface;
use Symfony\Component\HttpFoundation\RequestStack;

final class ActivationPasswordForm extends FormBase
{
    public function __construct(
        private readonly EntityTypeManagerInterface $entityTypeManagerService,
        private readonly RequestStack $requestStackService,
    ) {
    }

    public static function create(ContainerInterface $container): self
    {
        return new self(
            $container->get('entity_type.manager'),
            $container->get('request_stack'),
        );
    }

    public function getFormId(): string
    {
        return 'avereo_identity_bridge_activation_password';
    }

    public function buildForm(array $form, FormStateInterface $formState): array
    {
        $activation = $this->activation();
        if ($activation === null) {
            throw new \Symfony\Component\HttpKernel\Exception\AccessDeniedHttpException(
                'Le lien d’activation est invalide ou expiré.',
            );
        }

        $form['intro'] = [
            '#markup' => '<p>Définissez votre mot de passe AVEREO. '
                . 'Il remplacera définitivement l’ancien mot de passe.</p>',
        ];
        $form['password'] = [
            '#type' => 'password_confirm',
            '#title' => $this->t('Nouveau mot de passe'),
            '#required' => true,
        ];
        $form['rules'] = [
            '#markup' => '<p>Utilisez au moins 12 caractères avec des lettres et un chiffre.</p>',
        ];
        $form['actions'] = ['#type' => 'actions'];
        $form['actions']['submit'] = [
            '#type' => 'submit',
            '#value' => $this->t('Définir mon mot de passe'),
            '#button_type' => 'primary',
        ];
        return $form;
    }

    public function validateForm(array &$form, FormStateInterface $formState): void
    {
        $password = $this->password($formState);
        if (
            strlen($password) < 12
            || preg_match('/\p{L}/u', $password) !== 1
            || preg_match('/\d/', $password) !== 1
        ) {
            $formState->setErrorByName(
                'password',
                $this->t('Le mot de passe doit contenir au moins 12 caractères, une lettre et un chiffre.'),
            );
        }
    }

    public function submitForm(array &$form, FormStateInterface $formState): void
    {
        $activation = $this->activation();
        if ($activation === null) {
            throw new \Symfony\Component\HttpKernel\Exception\AccessDeniedHttpException(
                'Le lien d’activation est invalide ou expiré.',
            );
        }
        $account = $this->entityTypeManagerService->getStorage('user')->load($activation['uid']);
        if (!$account instanceof UserInterface || $account->isBlocked()) {
            throw new \Symfony\Component\HttpKernel\Exception\AccessDeniedHttpException(
                'Le compte AVEREO est indisponible.',
            );
        }
        $account->setPassword($this->password($formState));
        $account->activate();
        $account->save();

        $session = $this->requestStackService->getCurrentRequest()?->getSession();
        $session?->remove('avereo_identity_bridge_activation');
        $session?->set('avereo_identity_bridge_activation_complete', [
            'connectUserId' => $activation['connectUserId'],
        ]);
        $formState->setRedirect('avereo_identity_bridge.account_ready');
    }

    /** @return null|array{uid: int, connectUserId: int, expiresAt: int} */
    private function activation(): ?array
    {
        $value = $this->requestStackService
            ->getCurrentRequest()
            ?->getSession()
            ->get('avereo_identity_bridge_activation');
        $uid = is_array($value) ? (int) ($value['uid'] ?? 0) : 0;
        $connectUserId = is_array($value) ? (int) ($value['connectUserId'] ?? 0) : 0;
        $expiresAt = is_array($value) ? (int) ($value['expiresAt'] ?? 0) : 0;
        return $uid > 0 && $connectUserId > 0 && $expiresAt >= time()
            ? ['uid' => $uid, 'connectUserId' => $connectUserId, 'expiresAt' => $expiresAt]
            : null;
    }

    private function password(FormStateInterface $formState): string
    {
        $value = $formState->getValue('password');
        if (is_array($value)) {
            return (string) ($value['pass1'] ?? '');
        }
        return (string) $value;
    }
}
