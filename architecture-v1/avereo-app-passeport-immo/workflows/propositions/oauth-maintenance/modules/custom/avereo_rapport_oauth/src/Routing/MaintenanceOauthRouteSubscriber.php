<?php

declare(strict_types=1);

namespace Drupal\avereo_rapport_oauth\Routing;

use Drupal\Core\Routing\RouteSubscriberBase;
use Symfony\Component\Routing\RouteCollection;

/** Keeps the existing OAuth protocol available while public pages are closed. */
final class MaintenanceOauthRouteSubscriber extends RouteSubscriberBase
{
    protected function alterRoutes(RouteCollection $collection): void
    {
        $protocolRoutes = [
            'oauth2_token.authorize' => '/oauth/authorize',
            'oauth2_token.token' => '/oauth/token',
            'simple_oauth.userinfo' => '/oauth/userinfo',
        ];
        foreach ($protocolRoutes as $name => $path) {
            $route = $collection->get($name);
            if ($route !== null && $route->getPath() === $path) {
                // Authentication, permissions, methods and controllers stay intact.
                $route->setOption('_maintenance_access', true);
            }
        }
    }
}
