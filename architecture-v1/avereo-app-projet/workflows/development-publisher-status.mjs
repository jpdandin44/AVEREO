import {createHmac,timingSafeEqual} from 'node:crypto';
export const publisherStatusFields=['schema','version','mode','status','startedAt','finishedAt','lastSuccessAt','githubObservedAt','sourcesReceivedAt','sourceDigest','sequence','intervalSeconds','errorCode','credentialExpiresAt'];
const date=x=>x===null||typeof x==='string'&&Number.isFinite(Date.parse(x));
export function validatePublisherStatus(value){
 if(!value||Object.keys(value).sort().join(',')!==publisherStatusFields.slice().sort().join(',')||value.schema!=='avereo-private-publisher-status'||value.version!==1||value.mode!=='scheduled'
  ||!['ok','failed'].includes(value.status)||!['startedAt','finishedAt','lastSuccessAt','githubObservedAt','sourcesReceivedAt','credentialExpiresAt'].every(k=>date(value[k]))
  ||!value.startedAt||!value.finishedAt||!Number.isSafeInteger(value.sequence)||value.sequence<1||!Number.isInteger(value.intervalSeconds)||value.intervalSeconds<60||value.intervalSeconds>3600
  ||!/^[a-f0-9]{64}$/.test(value.sourceDigest)||!['', 'publication_failed'].includes(value.errorCode))throw Error('État du publicateur invalide.');
 return value;
}
export function signPublisherStatus(value,key){validatePublisherStatus(value);if(typeof key!=='string'||key.length<32)throw Error('Clé privée requise.');const payload=JSON.stringify(value);return{payload,signature:createHmac('sha256',key).update(payload).digest('hex')};}
export function readPublisherStatus(raw,key){
 const e=JSON.parse(raw);if(Object.keys(e).sort().join(',')!=='payload,signature'||typeof e.payload!=='string'||Buffer.byteLength(e.payload)>8192||!/^[a-f0-9]{64}$/.test(e.signature||''))throw Error('État non authentifié.');
 if(!timingSafeEqual(Buffer.from(e.signature,'hex'),createHmac('sha256',key).update(e.payload).digest()))throw Error('État non authentifié.');
 return validatePublisherStatus(JSON.parse(e.payload));
}
