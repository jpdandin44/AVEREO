import {createHmac,randomBytes,timingSafeEqual} from 'node:crypto';

export class DevelopmentError extends Error {
  constructor(status,message){super(message);this.status=status;}
}
const fail=(status,message)=>{throw new DevelopmentError(status,message);};
const equal=(a,b)=>{if(typeof a!=='string'||typeof b!=='string')return false;const left=Buffer.from(a),right=Buffer.from(b);return left.length===right.length&&timingSafeEqual(left,right);};
export function createDevelopmentAccess({adminId,origin,secret=randomBytes(48).toString('hex'),bootstrap=randomBytes(32).toString('hex'),now=()=>Date.now(),ttl=3600,demo=false,cookieName='avereo_developments_local'}) {
  if(typeof adminId!=='string'||!/^[1-9][0-9]{0,18}$/.test(adminId)||!/^http:\/\/127\.0\.0\.1:[0-9]+$/.test(origin||'')||secret.length<32||bootstrap.length<32) throw new Error('Configuration privée administrateur local invalide.');
  if(typeof cookieName!=='string'||!/^avereo_developments_local(?:_[0-9]{4,5})?$/.test(cookieName))throw new Error('Nom de session locale invalide.');
  let used=false;
  const revoked=new Set();
  const sign=payload=>{const data=Buffer.from(JSON.stringify(payload)).toString('base64url');return data+'.'+createHmac('sha256',secret).update(data).digest('base64url');};
  function principal(cookie){
    if(typeof cookie!=='string'||cookie.length>4096)fail(401,'Accès privé requis.');
    const [encoded,signature,...extra]=cookie.split('.');
    if(extra.length||!encoded||!signature||!equal(signature,createHmac('sha256',secret).update(encoded).digest('base64url')))fail(401,'Accès privé requis.');
    let value;try{value=JSON.parse(Buffer.from(encoded,'base64url').toString('utf8'));}catch{fail(401,'Accès privé requis.');}
    if(!Number.isInteger(value.exp)||!Number.isInteger(value.iat)||value.exp-value.iat>ttl||value.exp<=value.iat||value.exp<=Math.floor(now()/1000)||value.iat>Math.floor(now()/1000)+5||typeof value.sid!=='string'||!/^[a-f0-9]{48}$/.test(value.sid)||revoked.has(value.sid))fail(401,'Session locale expirée.');
    if(value.id!==adminId||value.role!=='global_admin'||value.provider!=='local_private_administrator')fail(403,'Accès interdit.');
    return {id:value.id,role:value.role,provider:value.provider,demo,sid:value.sid,authenticatedAt:value.iat};
  }
  return {
    cookieName,origin,
    checkTransport(request){
      if(request.headers.host!==new URL(origin).host||!['127.0.0.1','::1','::ffff:127.0.0.1'].includes(request.socket.remoteAddress))fail(403,'Accès interdit.');
      if(request.headers.origin&&request.headers.origin!==origin)fail(403,'Origine refusée.');
      if(['cross-site','same-site'].includes(request.headers['sec-fetch-site']))fail(403,'Origine refusée.');
    },
    login(token){
      if(used||!equal(token,bootstrap))fail(403,'Accès interdit.');
      used=true;
      const iat=Math.floor(now()/1000),sid=randomBytes(24).toString('hex');
      return sign({id:adminId,role:'global_admin',provider:'local_private_administrator',iat,exp:iat+ttl,sid});
    },
    authenticate(request){
      this.checkTransport(request);
      const raw=(request.headers.cookie||'').split(';').map(s=>s.trim()).find(s=>s.startsWith(cookieName+'='));
      return principal(raw?.slice(raw.indexOf('=')+1));
    },
    checkOrigin(request){if(request.headers.host!==new URL(origin).host||request.headers.origin!==origin)fail(403,'Origine refusée.');},
    csrf(actor){return createHmac('sha256',secret).update('development-csrf:'+actor.sid).digest('hex');},
    checkCsrf(request,actor){if(!equal(request.headers['x-development-token'],this.csrf(actor)))fail(403,'Confirmation de session requise.');},
    logout(actor){revoked.add(actor.sid);},
    // Pas d'identité/rôle fourni par le navigateur ; l'accès local est une capacité
    // privée attribuée par le lanceur. Ce n'est pas une preuve de rôle CONNECT.
  };
}
