const http = require('http');
const https = require('https');
const net = require('net');
const fs = require('fs');
const path = require('path');
const { URL } = require('url');

const FRONTEND_HOST = '127.0.0.1';
const FRONTEND_PORT = 5173;
const HTTP_PORT = 80;
const HTTPS_PORT = 443;
const USE_HTTPS = process.env.PROXY_ENABLE_HTTPS === 'true';

const allowedHosts = [
  'syntern.in',
  '.syntern.in',
];

const sslKeyPath = process.env.PROXY_SSL_KEY || path.join(__dirname, 'certs', 'server.key');
const sslCertPath = process.env.PROXY_SSL_CERT || path.join(__dirname, 'certs', 'server.crt');

function normalizeHost(hostHeader) {
  if (!hostHeader) return null;
  const host = hostHeader.split(':')[0].trim().toLowerCase();
  return host || null;
}

function isHostAllowed(hostname) {
  if (!hostname) return false;
  if (hostname === 'localhost' || hostname === '127.0.0.1') return true;
  return allowedHosts.some((allowed) => {
    if (allowed.startsWith('.')) {
      return hostname === allowed.slice(1) || hostname.endsWith(allowed);
    }
    return hostname === allowed;
  });
}

function proxyRequest(req, res) {
  const hostname = normalizeHost(req.headers.host);
  if (!isHostAllowed(hostname)) {
    res.statusCode = 403;
    res.end(`Host ${hostname || 'unknown'} is not allowed.`);
    return;
  }

  const target = `http://${FRONTEND_HOST}:${FRONTEND_PORT}${req.url}`;
  const options = new URL(target);
  options.method = req.method;
  options.headers = { ...req.headers, host: `${FRONTEND_HOST}:${FRONTEND_PORT}` };

  const proxyReq = http.request(options, (proxyRes) => {
    res.writeHead(proxyRes.statusCode, proxyRes.headers);
    proxyRes.pipe(res, { end: true });
  });

  proxyReq.on('error', (err) => {
    console.error('[Proxy] request error:', err.message);
    res.statusCode = 502;
    res.end('Bad gateway');
  });

  req.pipe(proxyReq, { end: true });
}

function proxyUpgrade(req, socket, head) {
  const hostname = normalizeHost(req.headers.host);
  if (!isHostAllowed(hostname)) {
    socket.write('HTTP/1.1 403 Forbidden\r\n\r\n');
    socket.destroy();
    return;
  }

  const proxySocket = net.connect(FRONTEND_PORT, FRONTEND_HOST, () => {
    proxySocket.write(head);
    proxySocket.write(`${req.method} ${req.url} HTTP/${req.httpVersion}\r\n`);
    for (const [key, value] of Object.entries(req.headers)) {
      proxySocket.write(`${key}: ${value}\r\n`);
    }
    proxySocket.write('\r\n');
    socket.pipe(proxySocket);
    proxySocket.pipe(socket);
  });

  proxySocket.on('error', (err) => {
    console.error('[Proxy] upgrade error:', err.message);
    socket.destroy();
  });
}

function createServer(serverType, options = {}) {
  const server = serverType.createServer(options, proxyRequest);
  server.on('upgrade', proxyUpgrade);
  server.on('error', (err) => {
    console.error('[Proxy] server error:', err.message);
    if (err.code === 'EACCES') {
      console.error('Permission denied. Run this script as Administrator or use a different port.');
    }
    process.exit(1);
  });
  return server;
}

function startHttp() {
  const server = createServer(http);
  server.listen(HTTP_PORT, '0.0.0.0', () => {
    console.log(`Local HTTP proxy listening on port ${HTTP_PORT}`);
    console.log(`Forwarding requests to http://${FRONTEND_HOST}:${FRONTEND_PORT}`);
    console.log('Allowed hosts:', allowedHosts.join(', '));
  });
}

function startHttps() {
  if (!fs.existsSync(sslKeyPath) || !fs.existsSync(sslCertPath)) {
    console.warn(`HTTPS proxy not started because SSL key/cert files were not found.`);
    console.warn(`Expected key: ${sslKeyPath}`);
    console.warn(`Expected cert: ${sslCertPath}`);
    console.warn('Set PROXY_ENABLE_HTTPS=true and provide valid cert files to enable HTTPS.');
    return;
  }

  const options = {
    key: fs.readFileSync(sslKeyPath),
    cert: fs.readFileSync(sslCertPath),
  };

  const server = createServer(https, options);
  server.listen(HTTPS_PORT, '0.0.0.0', () => {
    console.log(`Local HTTPS proxy listening on port ${HTTPS_PORT}`);
    console.log(`Forwarding requests to http://${FRONTEND_HOST}:${FRONTEND_PORT}`);
    console.log('Allowed hosts:', allowedHosts.join(', '));
  });
}

startHttp();
if (USE_HTTPS) startHttps();
