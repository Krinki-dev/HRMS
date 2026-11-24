'use strict';

const net = require('net');

/**
 * Scan a bounded in-memory upload with a ClamAV clamd INSTREAM endpoint.
 * Uploads fail closed when the scanner is not configured or does not answer.
 */
function scanBuffer(buffer, { host = process.env.CLAMAV_HOST, port = Number(process.env.CLAMAV_PORT || 3310), timeoutMs = 15000 } = {}) {
  if (!host || !Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error('MALWARE_SCANNER_NOT_CONFIGURED');
  }
  if (!Buffer.isBuffer(buffer) || buffer.length === 0 || buffer.length > 10 * 1024 * 1024) {
    throw new Error('INVALID_SCAN_BUFFER');
  }

  return new Promise((resolve, reject) => {
    const socket = net.createConnection({ host, port });
    const response = [];
    let settled = false;
    const fail = (error) => {
      if (settled) return;
      settled = true;
      socket.destroy();
      reject(error);
    };
    socket.setTimeout(timeoutMs, () => fail(new Error('MALWARE_SCANNER_TIMEOUT')));
    socket.on('error', fail);
    socket.on('data', (chunk) => response.push(chunk));
    socket.on('connect', () => {
      socket.write(Buffer.from('zINSTREAM\0'));
      const chunkSize = 64 * 1024;
      for (let offset = 0; offset < buffer.length; offset += chunkSize) {
        const chunk = buffer.subarray(offset, Math.min(offset + chunkSize, buffer.length));
        const length = Buffer.alloc(4);
        length.writeUInt32BE(chunk.length, 0);
        socket.write(length);
        socket.write(chunk);
      }
      socket.write(Buffer.alloc(4));
      socket.end();
    });
    socket.on('end', () => {
      if (settled) return;
      settled = true;
      const result = Buffer.concat(response).toString('utf8').trim();
      if (result.endsWith('OK')) return resolve({ clean: true, result });
      if (result.includes('FOUND')) return reject(new Error('MALWARE_DETECTED'));
      return reject(new Error('MALWARE_SCANNER_INVALID_RESPONSE'));
    });
  });
}

module.exports = { scanBuffer };
