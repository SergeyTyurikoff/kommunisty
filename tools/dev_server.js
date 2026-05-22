'use strict';
const http = require('http');
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const host = '127.0.0.1';
const port = Number(process.env.KP_PORT || 4173);

const mimeTypes = {
  '.html':'text/html; charset=utf-8',
  '.js':'application/javascript; charset=utf-8',
  '.css':'text/css; charset=utf-8',
  '.json':'application/json; charset=utf-8',
  '.svg':'image/svg+xml',
  '.png':'image/png',
  '.jpg':'image/jpeg',
  '.jpeg':'image/jpeg',
  '.wav':'audio/wav',
  '.csv':'text/csv; charset=utf-8'
};

function safePath(urlPath){
  const clean = decodeURIComponent((urlPath || '/').split('?')[0]);
  const rel = clean === '/' ? '/index.html' : clean;
  const filePath = path.normalize(path.join(root, rel));
  if(!filePath.startsWith(root)) return null;
  return filePath;
}

const server = http.createServer((req, res) => {
  const filePath = safePath(req.url);
  if(!filePath){
    res.writeHead(403);
    res.end('Forbidden');
    return;
  }
  fs.readFile(filePath, (err, data) => {
    if(err){
      res.writeHead(err.code === 'ENOENT' ? 404 : 500, {'Content-Type':'text/plain; charset=utf-8'});
      res.end(err.code === 'ENOENT' ? 'Not found' : 'Server error');
      return;
    }
    const ext = path.extname(filePath).toLowerCase();
    res.writeHead(200, {'Content-Type': mimeTypes[ext] || 'application/octet-stream'});
    res.end(data);
  });
});

server.listen(port, host, () => {
  console.log(`KP server running at http://${host}:${port}`);
});
