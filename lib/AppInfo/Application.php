<?php
declare(strict_types=1);

namespace OCA\CustomProperties\AppInfo;

use OCA\CustomProperties\Listener\LoadAdditionalScriptsListener;
use OCA\CustomProperties\Listener\SabreAddPluginListener;
use OCA\CustomProperties\Storage\AuthorStorage;
use OCA\Files\Event\LoadAdditionalScriptsEvent;
use OCP\AppFramework\App;
use OCP\AppFramework\Bootstrap\IBootContext;
use OCP\AppFramework\Bootstrap\IBootstrap;
use OCP\AppFramework\Bootstrap\IRegistrationContext;

class Application extends App implements IBootstrap
{
    const APP_ID = 'customproperties';
    const NAMESPACE_URL = "http://owncloud.org/ns";
    const NAMESPACE_PREFIX = "oc";

    public function __construct(array $urlParams = [])
    {
        parent::__construct(self::APP_ID, $urlParams);
    }

    public function register(IRegistrationContext $context): void
    {
        $context->registerEventListener(
            LoadAdditionalScriptsEvent::class,
            LoadAdditionalScriptsListener::class
        );
        $context->registerEventListener(
            'OCA\DAV\Connector\Sabre::addPlugin',
            SabreAddPluginListener::class
        );
    }

    public function boot(IBootContext $context): void
    {
        // NOOP
    }
}
