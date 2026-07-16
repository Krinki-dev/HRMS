/**
 * piiEncryption.js
 * Phase-0: AES-256-GCM helpers for PII fields (Aadhaar, PAN, bank account).
 * India DPDP Act 2023 compliance — sensitive personal data must be encrypted at rest.
 *
 * Usage:
 *   const { encryptPII, decryptPII, maskAadhaar } = require('../../shared/utils/piiEncryption');
 *   employee.aadhaar_number = encryptPII(rawAadhaar);
 *   const visible = decryptPII(employee.aadhaar_number);
 *
 * IMPORTANT: Set ENCRYPTION_KEY in environment as a 32-byte hex or base64 string.
 * All existing plain-text PII must be migrated via scripts/migrate-pii-encryption.js
 */

const crypto = require('crypto');

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12;  // 96-bit IV recommended for GCM
const TAG_LENGTH = 16; // 128-bit auth tag
const PREFIX = 'ENC:'; // marks an already-encrypted value — prevents double encryption

function getKey() {
  const raw = process.env.ENCRYPTION_KEY;
  if (!raw) throw new Error('ENCRYPTION_KEY environment variable is not set');

  // Accept 64-char hex (32 bytes) or base64 (44 chars → 32 bytes)
  if (raw.length === 64 && /^[0-9a-fA-F]+$/.test(raw)) {
    return Buffer.from(raw, 'hex');
  }
  const buf = Buffer.from(raw, 'base64');
  if (buf.length !== 32) throw new Error('ENCRYPTION_KEY must be exactly 32 bytes (64-char hex or 44-char base64)');
  return buf;
}

/**
 * Encrypts a plaintext PII value.
 * @param {string} plaintext
 * @returns {string}  "ENC:<base64(iv+tag+ciphertext)>"
 */
function encryptPII(plaintext) {
  if (!plaintext) return plaintext;
  if (typeof plaintext !== 'string') plaintext = String(plaintext);
  if (plaintext.startsWith(PREFIX)) return plaintext; // already encrypted

  const key = getKey();
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv, { authTagLength: TAG_LENGTH });
  const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();

  // Format: iv (12 bytes) + tag (16 bytes) + ciphertext
  const payload = Buffer.concat([iv, tag, encrypted]);
  return PREFIX + payload.toString('base64');
}

/**
 * Decrypts a PII value encrypted by encryptPII.
 * @param {string} ciphertext  "ENC:<base64>"
 * @returns {string} plaintext
 */
function decryptPII(ciphertext) {
  if (!ciphertext) return ciphertext;
  if (!ciphertext.startsWith(PREFIX)) return ciphertext; // not encrypted — return as-is

  const key = getKey();
  const payload = Buffer.from(ciphertext.slice(PREFIX.length), 'base64');

  const iv = payload.subarray(0, IV_LENGTH);
  const tag = payload.subarray(IV_LENGTH, IV_LENGTH + TAG_LENGTH);
  const encrypted = payload.subarray(IV_LENGTH + TAG_LENGTH);

  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv, { authTagLength: TAG_LENGTH });
  decipher.setAuthTag(tag);
  return decipher.update(encrypted) + decipher.final('utf8');
}

/**
 * Masks an Aadhaar number for display: shows only last 4 digits.
 * Works on both plaintext and encrypted values (decrypts first).
 * @param {string} value
 * @returns {string}  e.g. "XXXX XXXX 1234"
 */
function maskAadhaar(value) {
  if (!value) return '';
  const plain = decryptPII(value).replace(/\s/g, '');
  if (plain.length !== 12) return 'XXXX XXXX XXXX';
  return `XXXX XXXX ${plain.slice(-4)}`;
}

/**
 * Masks a PAN for display: shows only last 4 characters.
 * @param {string} value
 * @returns {string}  e.g. "XXXXX1234X"
 */
function maskPAN(value) {
  if (!value) return '';
  const plain = decryptPII(value);
  if (plain.length !== 10) return 'XXXXXXXXXX';
  return `XXXXX${plain.slice(5)}`;
}

module.exports = { encryptPII, decryptPII, maskAadhaar, maskPAN };
