'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { scanBuffer } = require('../shared/utils/clamavScanner');

test('fails closed when the malware scanner is not configured', async () => {
  await assert.rejects(
    scanBuffer(Buffer.from('sample'), { host: null }),
    (error) => error.message === 'MALWARE_SCANNER_NOT_CONFIGURED'
  );
});

test('rejects empty or oversized scan buffers', async () => {
  await assert.rejects(
    scanBuffer(Buffer.alloc(0), { host: '127.0.0.1' }),
    (error) => error.message === 'INVALID_SCAN_BUFFER'
  );
});
