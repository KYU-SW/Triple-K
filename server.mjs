import http from 'node:http';
import {readFile} from 'node:fs/promises';
const types={html:'text/html',css:'text/css',mjs:'text/javascript'};
http.createServer(async(req,res)=>{try{const path=new URL(req.url,'http://localhost').pathname;const file=path==='/'?'index.html':path.slice(1);if(!['index.html','app.mjs','rules.mjs','style.css'].includes(file)){res.writeHead(404).end();return;}const body=await readFile(new URL('./dist/'+file,import.meta.url));res.writeHead(200,{'Content-Type':types[file.split('.').pop()]+'; charset=utf-8'}).end(body);}catch{res.writeHead(500).end();}}).listen(4173,'127.0.0.1',()=>console.log('http://localhost:4173'));
