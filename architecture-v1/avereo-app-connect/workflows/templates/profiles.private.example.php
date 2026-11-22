<?php
// Template only: keep outside every public root. No real identifier or secret.
return [
    'enabled' => false,
    'owner_connect_id' => 0,
    'catalogue_file' => __DIR__ . '/profiles-catalogue.json',
    'identity_issuer' => '',
    'identity_url' => '', // Same configured issuer, exact /avereo/profiles/authorization path.
    'identity_key' => '', // New dedicated random key, at least 32 bytes; never a launch/OAuth key.
];
