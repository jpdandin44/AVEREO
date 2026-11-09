import {DevelopmentError} from './development-access.mjs';

const loginPage=`<!doctype html><html lang="fr"><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Accès local privé</title><style>body{font:16px/1.6 Arial;max-width:600px;margin:12vh auto;padding:24px;color:#19324c;background:#f6f8fb}h1{font-size:25px}main{background:white;padding:28px;border-radius:14px}input,button{font:inherit;padding:10px;max-width:100%;box-sizing:border-box}p{margin:12px 0}#message{color:#a3293c}</style><main><h1>Espace de développement privé</h1><p>Accès réservé au seul administrateur local autorisé. Aucun suivi n’est chargé avant authentification.</p><label>Fichier d’accès local privé <input id="access" type="file" accept=".json"></label><p>Ce fichier est créé par le lanceur, hors du dépôt. Ne le partage pas. Il n’est ni un compte ni un mot de passe CONNECT.</p><p id="message" role="alert"></p></main><script>document.getElementById('access').addEventListener('change',async event=>{try{const file=event.target.files[0];if(!file||file.size>4096)throw Error();const key=JSON.parse(await file.text());const response=await fetch('/local-developments/session',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({token:key.token})});if(!response.ok)throw Error();location.replace('/?developments');}catch{document.getElementById('message').textContent='Accès refusé ou fichier déjà utilisé. Relancer l’espace privé si nécessaire.';event.target.value='';}});</script></html>`;
async function body(request){
  if((request.headers['content-type']||'').split(';')[0].trim()!=='application/json')throw new DevelopmentError(415,'Format refusé.');
  let bytes=0;const chunks=[];
  for await(const chunk of request){bytes+=chunk.length;if(bytes>65536)throw new DevelopmentError(413,'Requête trop volumineuse.');chunks.push(chunk);}
  try{return JSON.parse(Buffer.concat(chunks).toString('utf8'));}catch{throw new DevelopmentError(400,'JSON invalide.');}
}
export function createDevelopmentMiddleware({access,store,authorize=null,refreshGithub=null}){
  return async function developmentMiddleware(request,response,next){
    const url=new URL(request.url,'http://local.invalid');
    const json=(status,data)=>{response.statusCode=status;response.setHeader('Content-Type','application/json; charset=utf-8');response.end(JSON.stringify(data));};
    response.setHeader('Cache-Control','no-store, private');response.setHeader('X-Content-Type-Options','nosniff');response.setHeader('Referrer-Policy','no-referrer');
    try{
      access.checkTransport(request);
      if(url.pathname==='/local-developments/session'){
        if(request.method!=='POST')throw new DevelopmentError(405,'Méthode refusée.');
        access.checkOrigin(request);const input=await body(request);
        if(!input||typeof input!=='object'||Array.isArray(input)||Object.keys(input).length!==1||typeof input.token!=='string')throw new DevelopmentError(403,'Accès interdit.');
        const cookie=access.login(input.token);
        response.setHeader('Set-Cookie',`${access.cookieName}=${cookie}; HttpOnly; SameSite=Strict; Path=/; Max-Age=3600`);
        return json(200,{authenticated:true});
      }
      let actor;
      try{actor=access.authenticate(request);}catch(error){
        if((url.pathname==='/'||url.pathname==='/index.html')&&request.method==='GET'){
          response.statusCode=401;response.setHeader('Content-Type','text/html; charset=utf-8');response.end(loginPage);return;
        }
        throw error;
      }
      // Toutes les ressources Vite de cet espace sont privées, pas uniquement le menu.
      const identity=authorize&&url.pathname!=='/local-developments/logout'?await authorize(actor):null;
      if(url.pathname.startsWith('/local-review')||url.pathname.startsWith('/local-planning'))throw new DevelopmentError(404,'Ressource indisponible.');
      if(!url.pathname.startsWith('/local-developments/'))return next();
      if(url.pathname==='/local-developments/state'&&request.method==='GET'){const snapshot=store.dashboard?await store.dashboard():{iterations:await store.list(),portfolio:store.portfolio?await store.portfolio():[]};return json(200,{...snapshot,githubRefreshAvailable:typeof refreshGithub==='function',csrf:access.csrf(actor),identity:identity||{scope:'single_global_administrator',mode:actor.demo?'local_fictitious':'local_private_capability',connectRoleVerified:false}});}
      if(url.pathname==='/local-developments/github-refresh'&&request.method==='POST'){access.checkOrigin(request);access.checkCsrf(request,actor);const input=await body(request);if(!input||typeof input!=='object'||Array.isArray(input)||Object.keys(input).length)throw new DevelopmentError(422,'Aucun paramètre GitHub fourni par le navigateur n’est accepté.');if(typeof refreshGithub!=='function')throw new DevelopmentError(503,'Collecte GitHub non configurée.');return json(200,{observation:await refreshGithub()});}
      const id=url.searchParams.get('iteration');
      if(url.pathname==='/local-developments/iteration'&&request.method==='GET')return json(200,{iteration:await store.get(id)});
      if(url.pathname==='/local-developments/proof'&&request.method==='GET'){
        const file=await store.proof(id,url.searchParams.get('proof'));
        const mime={'.md':'text/plain; charset=utf-8','.txt':'text/plain; charset=utf-8','.log':'text/plain; charset=utf-8','.json':'application/json; charset=utf-8','.png':'image/png','.jpg':'image/jpeg','.jpeg':'image/jpeg','.pdf':'application/pdf'}[file.ext];
        if(!mime)throw new DevelopmentError(415,'Type de pièce non pris en charge.');
        if(file.ext==='.png'&&!file.content.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10])))throw new DevelopmentError(415,'Image invalide.');
        if(['.jpg','.jpeg'].includes(file.ext)&&!file.content.subarray(0,2).equals(Buffer.from([255,216])))throw new DevelopmentError(415,'Image invalide.');
        response.setHeader('Content-Type',mime);response.setHeader('Content-Security-Policy',"sandbox; default-src 'none'");
        response.setHeader('Content-Disposition',`${file.ext==='.pdf'?'attachment':'inline'}; filename="${file.name.replace(/[^a-zA-Z0-9_.-]/g,'_')}"`);
        response.end(file.content);return;
      }
      if(url.pathname==='/local-developments/reviews'&&request.method==='POST'){
        access.checkOrigin(request);access.checkCsrf(request,actor);
        return json(200,{iteration:await store.review(id,await body(request),actor)});
      }
      if(url.pathname==='/local-developments/logout'&&request.method==='POST'){
        access.checkOrigin(request);access.checkCsrf(request,actor);access.logout(actor);
        response.setHeader('Set-Cookie',`${access.cookieName}=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0`);return json(200,{loggedOut:true});
      }
      throw new DevelopmentError(404,'Ressource indisponible.');
    }catch(error){json(error instanceof DevelopmentError?error.status:503,{error:error instanceof DevelopmentError?error.message:'Service privé indisponible.'});}
  };
}
