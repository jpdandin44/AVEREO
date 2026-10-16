<?php
declare(strict_types=1);
if(PHP_SAPI!=='cli'){http_response_code(404);exit;}
umask(0077);
try{
 $root='/home/daje3540/public_html';require $root.'/autoload.php';
 $prefix=__DIR__.'/modules/custom/avereo_rapport_oauth';
 require $prefix.'/src/Routing/MaintenanceOauthRouteSubscriber.php';
 $routes=Symfony\Component\Yaml\Yaml::parseFile($root.'/modules/contrib/simple_oauth/simple_oauth.routing.yml');
 $collection=new Symfony\Component\Routing\RouteCollection();
 foreach($routes as$name=>$v)$collection->add($name,new Symfony\Component\Routing\Route($v['path'],$v['defaults']??[],$v['requirements']??[],$v['options']??[],$v['host']??'',$v['schemes']??[],$v['methods']??[],$v['condition']??''));
 $collection->add('private_fixture.home',new Symfony\Component\Routing\Route('/'));
 $selected=['oauth2_token.authorize'=>'/oauth/authorize','oauth2_token.token'=>'/oauth/token','simple_oauth.userinfo'=>'/oauth/userinfo'];
 $checks=[];
 $check=static function(bool$ok,string$label)use(&$checks):void{if(!$ok)throw new RuntimeException($label);$checks[]=$label;};
 $describe=static fn($route)=>['path'=>$route->getPath(),'requirements'=>$route->getRequirements(),'defaults'=>$route->getDefaults(),'options'=>$route->getOptions(),'methods'=>$route->getMethods(),'schemes'=>$route->getSchemes(),'host'=>$route->getHost(),'condition'=>$route->getCondition()];
 $before=[];foreach($collection as$name=>$route)$before[$name]=$describe($route);
 $subscriber=new Drupal\avereo_rapport_oauth\Routing\MaintenanceOauthRouteSubscriber();
 $method=new ReflectionMethod($subscriber,'alterRoutes');$method->invoke($subscriber,$collection);
 foreach($selected as$name=>$path){$route=$collection->get($name);$check($route!==null&&$route->getPath()===$path,'expected_route_present_'.$name);$check($route->getOption('_maintenance_access')===true,'protocol_route_available_in_maintenance_'.$name);
  $after=$describe($route);unset($after['options']['_maintenance_access']);$expected=$before[$name];unset($expected['options']['_maintenance_access']);$check($after===$expected,'authentication_methods_controllers_and_other_options_preserved_'.$name);}
 $untouched=0;foreach($collection as$name=>$route)if(!isset($selected[$name])){$check($describe($route)===$before[$name],'unrelated_route_unchanged_'.$name);$untouched++;}
 $spoof=new Symfony\Component\Routing\RouteCollection();$spoof->add('oauth2_token.token',new Symfony\Component\Routing\Route('/unrelated'));$method->invoke($subscriber,$spoof);$check($spoof->get('oauth2_token.token')->getOption('_maintenance_access')===null,'matching_name_with_other_path_refused');
 $service=Symfony\Component\Yaml\Yaml::parseFile($prefix.'/avereo_rapport_oauth.services.yml');$services=$service['services'];$check(count($services)===1&&$services['avereo_rapport_oauth.maintenance_oauth_routes']['class']===get_class($subscriber),'one_expected_route_subscriber_service');
 $check($services['avereo_rapport_oauth.maintenance_oauth_routes']['tags']===[['name'=>'event_subscriber']],'event_subscriber_tag_only');
 $out=['observedAt'=>gmdate('c'),'status'=>'proposed_oauth_maintenance_routes_isolated_checks_passed','assertions'=>count($checks),'checks'=>$checks,'selectedRoutes'=>$selected,'unrelatedRoutesUnchanged'=>$untouched,'actualInstalledDrupalAndSymfonyClasses'=>true,'liveFilesChanged'=>false,'liveRoutesChanged'=>false,'databaseBootstrapped'=>false,'maintenanceDisabled'=>false,'limitations'=>['Private in-memory route collection only; no live route rebuild, deployment or OAuth end-to-end success proved.','Site-specific authorization and normal deployment controls still required before installation.']];
 $p=__DIR__.'/qualification.json';if(file_exists($p))throw new RuntimeException('New qualification receipt required');file_put_contents($p,json_encode($out,JSON_PRETTY_PRINT|JSON_THROW_ON_ERROR)."\n");chmod($p,0600);
 echo json_encode(array_diff_key($out,['checks'=>true,'selectedRoutes'=>true,'limitations'=>true]),JSON_PRETTY_PRINT|JSON_THROW_ON_ERROR)."\n";
}catch(Throwable$e){fwrite(STDERR,'Proposal qualification refused: '.get_class($e)."\n");exit(1);}
