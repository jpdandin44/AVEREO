import {createHmac, randomBytes, timingSafeEqual} from 'node:crypto';
import {DevelopmentError} from './development-access.mjs';

const fail = () => { throw new DevelopmentError(403, 'Habilitation privée indisponible ou refusée.'); };
export function signRoleMessage(claims, key) {
  if (typeof key !== 'string' || key.length < 32) throw Error('Clé de canal dédiée requise.');
  const payload = Buffer.from(JSON.stringify(claims)).toString('base64url');
  return {payload, signature:createHmac('sha256',key).update(payload).digest('hex')};
}
export function verifyRoleMessage(envelope, key, {issuer,audience,type,now,fields=[]}) {
  if (!envelope || Object.keys(envelope).sort().join(',') !== 'payload,signature' || typeof envelope.payload !== 'string'
    || envelope.payload.length > 8192 || !/^[A-Za-z0-9_-]+$/.test(envelope.payload) || !/^[a-f0-9]{64}$/.test(envelope.signature||'')) fail();
  const expected = createHmac('sha256',key).update(envelope.payload).digest();
  if (!timingSafeEqual(expected,Buffer.from(envelope.signature,'hex'))) fail();
  let p;try { p=JSON.parse(Buffer.from(envelope.payload,'base64url').toString('utf8')); } catch { fail(); }
  const allowed = ['v','iss','aud','type','iat','exp','nonce',...fields];
  if (!p || typeof p !== 'object' || Array.isArray(p) || Object.keys(p).some(k=>!allowed.includes(k))
    || p.v!==1 || p.iss!==issuer || p.aud!==audience || p.type!==type || !Number.isInteger(p.iat) || !Number.isInteger(p.exp)
    || p.iat>now+5 || p.exp<=now || p.exp<=p.iat || p.exp-p.iat>30 || !/^[a-f0-9]{48}$/.test(p.nonce||'')) fail();
  return p;
}
export function createRoleBridgeClient({url,key,ownerConnectId,fixture=false,fetcher=fetch,now=()=>Date.now()}) {
  const target=new URL(url);
  if (!/^[1-9][0-9]{0,18}$/.test(ownerConnectId||'') || typeof key!=='string' || key.length<32 || target.username || target.password || target.search || target.hash
    || target.pathname!=='/api/v1/developments/authorize'
    || (target.protocol!=='https:' && !(fixture && target.protocol==='http:' && ['127.0.0.1','localhost'].includes(target.hostname)))) throw Error('Cible privée du pont invalide.');
  return async actor => {
    if (!actor || actor.id!==ownerConnectId || !Number.isInteger(actor.authenticatedAt)) fail();
    const at=Math.floor(now()/1000),nonce=randomBytes(24).toString('hex');
    const request=signRoleMessage({v:1,iss:'avereo-projet-developments',aud:'avereo-connect-developments',type:'request',iat:at,exp:at+30,nonce,
      connectId:ownerConnectId,sessionIssuedAt:actor.authenticatedAt},key);
    try {
      const response=await fetcher(target.href,{method:'POST',redirect:'error',signal:AbortSignal.timeout(5000),headers:{'Content-Type':'application/json','Accept':'application/json'},body:JSON.stringify(request)});
      if (!response.ok || !response.body) fail();
      const chunks=[];let size=0;
      for await (const chunk of response.body) { size+=chunk.length;if(size>16384){await response.body.cancel?.().catch(()=>{});fail();}chunks.push(Buffer.from(chunk)); }
      const parsed=JSON.parse(Buffer.concat(chunks).toString('utf8'));
      const p=verifyRoleMessage(parsed.data||parsed,key,{issuer:'avereo-connect-developments',audience:'avereo-projet-developments',type:'response',now:Math.floor(now()/1000),
        fields:['requestNonce','connectId','active','globalAdmin','scope']});
      if(p.requestNonce!==nonce || p.connectId!==ownerConnectId || p.active!==true || p.globalAdmin!==true || p.scope!=='developments:read')fail();
      return {mode:fixture?'local_bridge_fixture':'local_owner_capability_with_live_role_check',connectRoleVerified:!fixture,connectSsoVerified:false,scope:'single_global_administrator',fixture};
    } catch { fail(); }
  };
}
