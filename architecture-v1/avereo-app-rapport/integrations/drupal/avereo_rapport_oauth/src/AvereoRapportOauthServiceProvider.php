<?php

declare(strict_types=1);

namespace Drupal\avereo_rapport_oauth;

use Drupal\Core\DependencyInjection\ContainerBuilder;
use Drupal\Core\DependencyInjection\ServiceProviderBase;

/**
 * Enregistre les claims AVEREO dans le normaliseur OpenID Connect.
 */
final class AvereoRapportOauthServiceProvider extends ServiceProviderBase {

  /**
   * {@inheritdoc}
   */
  public function alter(ContainerBuilder $container): void {
    if (!$container->hasParameter('simple_oauth.openid.claims')) {
      return;
    }

    $claims = $container->getParameter('simple_oauth.openid.claims');
    if (!is_array($claims)) {
      return;
    }

    foreach (['roles', 'client_id'] as $claim) {
      if (!in_array($claim, $claims, TRUE)) {
        $claims[] = $claim;
      }
    }
    $container->setParameter('simple_oauth.openid.claims', $claims);
  }

}
