import http from 'node:http';
import { readFile } from 'node:fs/promises';
const port=Number(process.env.PORT||4180);
const file=new URL('../dist/index.html',import.meta.url);
http.createServer(async(req,res)=>{
 if(req.method!=='GET'||!['/','/index.html'].includes(req.url?.split('?')[0])){res.writeHead(404);res.end();return;}
 try{const data=await readFile(file);res.writeHead(200,{'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});res.end(data);}catch{res.writeHead(503);res.end('Construire l’application avec npm run build.');}
}).listen(port,'127.0.0.1',()=>console.log(`UNI local : http://127.0.0.1:${port}`));
