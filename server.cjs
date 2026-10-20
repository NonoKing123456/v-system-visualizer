const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const { spawn } = require('node:child_process');
const files = new Map([
  ['/', ['index.html', 'text/html; charset=utf-8']],
  ['/index.html', ['index.html', 'text/html; charset=utf-8']],
  ['/styles.css', ['styles.css', 'text/css; charset=utf-8']],
  ['/engine.js', ['engine.js', 'text/javascript; charset=utf-8']],
  ['/guitar-audio.js', ['guitar-audio.js', 'text/javascript; charset=utf-8']],
  ['/assets/guitar-acoustic.js', ['assets/guitar-acoustic.js', 'text/javascript; charset=utf-8']],
  ['/assets/guitar-electric.js', ['assets/guitar-electric.js', 'text/javascript; charset=utf-8']],
  ['/app.js', ['app.js', 'text/javascript; charset=utf-8']]
]);
function createServer() {
  return http.createServer((req, res) => {
    if (!['GET', 'HEAD'].includes(req.method)) {
      res.writeHead(405, { Allow: 'GET, HEAD' }); return res.end();
    }
    let pathname;
    try { pathname = new URL(req.url, 'http://localhost').pathname; }
    catch { res.writeHead(400); return res.end('Bad request'); }
    const file = files.get(pathname);
    if (!file) { res.writeHead(404); return res.end('Not found'); }
    fs.readFile(path.join(__dirname, file[0]), (error, data) => {
      if (error) { res.writeHead(500); return res.end('Unable to read file'); }
      res.writeHead(200, { 'Content-Type': file[1], 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' });
      res.end(req.method === 'HEAD' ? undefined : data);
    });
  });
}
if (require.main === module) {
  const requestedPort = Number(process.env.PORT || 4173);
  if (!Number.isInteger(requestedPort) || requestedPort < 1 || requestedPort > 65535) {
    console.error('PORT must be an integer between 1 and 65535.'); process.exit(1);
  }
  function listen(port) {
    const server = createServer();
    server.on('error', error => {
      if (error.code === 'EADDRINUSE' && port < Math.min(requestedPort + 20, 65535)) listen(port + 1);
      else { console.error(error.message); process.exitCode = 1; }
    });
    server.listen(port, '127.0.0.1', () => {
      const url = `http://127.0.0.1:${port}`;
      console.log(`V-System Visualizer\nLocal: ${url}\nPress Ctrl+C to stop.`);
      if (process.argv.includes('--open') && process.platform === 'win32') {
        const browser = spawn('cmd.exe', ['/d', '/c', 'start', '', url], { windowsHide: true, stdio: 'ignore' });
        browser.on('error', () => console.log(`Open ${url} in your browser.`));
      }
    });
  }
  listen(requestedPort);
}
module.exports = { createServer };
