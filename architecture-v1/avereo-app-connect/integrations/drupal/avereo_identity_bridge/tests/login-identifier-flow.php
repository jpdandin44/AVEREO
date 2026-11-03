<?php
declare(strict_types=1);

namespace Drupal\Core\Entity { interface EntityStorageInterface {} }
namespace Drupal\Core\Form {
    interface FormStateInterface {}
    final class FormState implements FormStateInterface {
        public array $errors=[];
        public function __construct(public array $values) {}
        public function getValue($key) { return $this->values[$key]??null; }
        public function setValue($key,$value) { $this->values[$key]=$value;return $this; }
        public function setErrorByName($key,$message) { $this->errors[$key]=(string)$message;return $this; }
    }
}
namespace {
    use Drupal\Core\Entity\EntityStorageInterface;
    use Drupal\Core\Form\FormState;
    use Drupal\avereo_identity_bridge\Authentication\LoginIdentifierResolver;

    function t($message) { return $message; }
    final class Drupal {
        public static object $entities;
        public static function entityTypeManager() { return self::$entities; }
    }
    $checks=[];
    function checkLogin(bool $ok,string $name):void {
        global $checks;
        if(!$ok)throw new RuntimeException($name);
        $checks[]=$name;
    }
    final class FakeUsers implements EntityStorageInterface {
        public array $rows=[];
        public function getQuery() {
            return new class($this) {
                private string $field;private string $value;private int $limit=2;
                public function __construct(private FakeUsers $users){}
                public function accessCheck($value){if($value!==false)throw new RuntimeException('Lookup must be internal');return $this;}
                public function condition($field,$value){$this->field=$field;$this->value=$value;return $this;}
                public function range($start,$limit){$this->limit=$limit;return $this;}
                public function execute(){return array_slice(array_keys(array_filter($this->users->rows,fn($r)=>strcasecmp($r[$this->field],$this->value)===0)),0,$this->limit);}
            };
        }
        public function load($id){
            if(!isset($this->rows[$id]))return null;
            return new class($this->rows[$id]) {
                public function __construct(private array $row){}
                public function getAccountName(){return $this->row['name'];}
            };
        }
    }
    require dirname(__DIR__).'/src/Authentication/LoginIdentifierResolver.php';
    require dirname(__DIR__).'/avereo_identity_bridge.module';
    $users=new FakeUsers();
    $users->rows=[1=>['name'=>'client-test','mail'=>'client@example.invalid','status'=>1],2=>['name'=>'legacy-admin','mail'=>'owner@example.invalid','status'=>1]];
    Drupal::$entities=new class($users){public function __construct(private $users){}public function getStorage($type){return $this->users;}};
    $resolver=new LoginIdentifierResolver($users);
    checkLogin($resolver->resolve('client-test')==='client-test','readable native login preserved');
    checkLogin($resolver->resolve('client@example.invalid')==='client-test','email resolves to same native username');
    checkLogin($resolver->resolve(' CLIENT@EXAMPLE.INVALID ')==='client-test','email case and surrounding whitespace accepted');
    checkLogin($resolver->resolve('legacy-admin')==='legacy-admin','existing technical or admin username preserved');
    checkLogin($resolver->resolve('unknown@example.invalid')==='unknown@example.invalid','unknown email left to native credential rejection');
    checkLogin($resolver->resolve('')==='','empty input left to native required validation');
    checkLogin($resolver->resolve(str_repeat('x',255))===null,'oversized identifier rejected');
    $before=$users->rows;
    $users->rows[1]['status']=0;
    checkLogin($resolver->resolve('client@example.invalid')==='client-test','blocked status remains for native Drupal rejection');
    $users->rows=$before;
    $users->rows[3]=['name'=>'duplicate','mail'=>'CLIENT@example.invalid','status'=>1];
    checkLogin($resolver->resolve('client@example.invalid')===null,'duplicate email refuses ambiguous identity');
    $users->rows=$before;
    $users->rows[3]=['name'=>'client@example.invalid','mail'=>'different@example.invalid','status'=>1];
    checkLogin($resolver->resolve('client@example.invalid')===null,'username email cross-account collision refused');
    $users->rows=[1=>['name'=>'same@example.invalid','mail'=>'same@example.invalid','status'=>1]];
    checkLogin($resolver->resolve('same@example.invalid')==='same@example.invalid','same-account username and email remain unambiguous');
    $users->rows=$before;
    $form=['name'=>['#maxlength'=>60],'pass'=>['#type'=>'password','#required'=>true],'#validate'=>['::validateAuthentication','::validateFinal'],'#submit'=>['::submitForm']];
    $state=new FormState(['name'=>'client@example.invalid','pass'=>'fixture-only-secret']);
    avereo_identity_bridge_form_user_login_form_alter($form,$state);
    checkLogin($form['name']['#maxlength']===254,'full email length accepted');
    checkLogin((string)$form['name']['#title']==='Identifiant ou adresse e-mail','label announces both supported choices');
    checkLogin($form['#validate']===['avereo_identity_bridge_login_identifier_validate','::validateAuthentication','::validateFinal'],'resolver precedes unchanged native authentication and flood validation');
    checkLogin($form['#submit']===['::submitForm'] && $form['pass']===['#type'=>'password','#required'=>true],'native submit and password field unchanged');
    avereo_identity_bridge_login_identifier_validate($form,$state);
    checkLogin($state->values===['name'=>'client-test','pass'=>'fixture-only-secret'] && $state->errors===[],'only submitted identifier normalized');
    $users->rows[3]=['name'=>'collision','mail'=>'client@example.invalid','status'=>1];
    $state=new FormState(['name'=>'client@example.invalid','pass'=>'fixture-only-secret']);
    avereo_identity_bridge_login_identifier_validate($form,$state);
    checkLogin(isset($state->errors['name']) && $state->getValue('name')==='' && $state->getValue('pass')==='fixture-only-secret','ambiguous input prevents native authentication without reading password');
    unset($users->rows[3]);
    checkLogin($users->rows===$before,'resolution does not rename save or change any account');
    echo json_encode(['passed'=>count($checks),'checks'=>$checks,'scope'=>'resolver and form integration with Drupal doubles; no password validation bypass or email'],JSON_UNESCAPED_UNICODE).PHP_EOL;
}
