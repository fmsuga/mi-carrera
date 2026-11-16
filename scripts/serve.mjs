import http from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';
const root = process.cwd();
const types = {'.html':'text/html','.js':'text/javascript','.css':'text/css','.svg':'image/svg+xml','.png':'image/png','.webmanifest':'application/manifest+json'};
http.createServer(async(req,res) => {
  try {
    const url = new URL(req.url,'http://localhost');
    const pathname = decodeURIComponent(url.pathname).replace(/^\/mi-carrera(?=\/)/,'');
    const file = path.resolve(root,'.' + (pathname.endsWith('/') ? pathname + 'index.html' : pathname));
    if (!file.startsWith(root + path.sep) || /(?:^|[\\/])\./.test(path.relative(root,file))) throw new Error();
    res.setHeader('Content-Type',types[path.extname(file)] || 'text/plain');
    res.setHeader('Cache-Control','no-store');
    res.end(await fs.readFile(file));
  } catch { res.writeHead(404); res.end('Not found'); }
}).listen(4173,'127.0.0.1',() => console.log('Local: http://127.0.0.1:4173/mi-carrera/'));
