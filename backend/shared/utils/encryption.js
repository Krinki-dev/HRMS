const crypto = require('crypto');

const RAW_KEY = process.env.ENCRYPTION_KEY || 'hrms_32char_key_change_in_prod!!';

// Current (authenticated) cipher — new values are always written in this format.
const ALGORITHM_GCM = 'aes-256-gcm';
const IV_LENGTH_GCM = 12; // 96-bit nonce, recommended size for GCM
const AUTH_TAG_LENGTH = 16;

// Legacy cipher kept ONLY so previously-encrypted values already stored in the
// database can still be read. Do not use for new writes.
const ALGORITHM_LEGACY_CBC = 'aes-256-cbc';
const IV_LENGTH_LEGACY_CBC = 16;

const DERIVED_KEY = crypto.scryptSync(RAW_KEY, 'hrms_salt_v1', 32);

function encrypt(text) {
  if (!text) return null;
  const iv        = crypto.randomBytes(IV_LENGTH_GCM);
  const cipher    = crypto.createCipheriv(ALGORITHM_GCM, DERIVED_KEY, iv);
  const encrypted = Buffer.concat([cipher.update(String(text), 'utf8'), cipher.final()]);
  const authTag   = cipher.getAuthTag();
  // Format: <iv>:<authTag>:<ciphertext>  (3 parts — distinguishes it from legacy 2-part CBC values)
  return iv.toString('hex') + ':' + authTag.toString('hex') + ':' + encrypted.toString('hex');
}

function decryptGcm(ivHex, authTagHex, encryptedHex) {
  const iv        = Buffer.from(ivHex, 'hex');
  const authTag   = Buffer.from(authTagHex, 'hex');
  const encrypted = Buffer.from(encryptedHex, 'hex');
  const decipher  = crypto.createDecipheriv(ALGORITHM_GCM, DERIVED_KEY, iv);
  decipher.setAuthTag(authTag);
  return Buffer.concat([decipher.update(encrypted), decipher.final()]).toString('utf8');
}

function decryptLegacyCbc(ivHex, encryptedHex) {
  const iv        = Buffer.from(ivHex, 'hex');
  const encrypted = Buffer.from(encryptedHex, 'hex');
  const decipher  = crypto.createDecipheriv(ALGORITHM_LEGACY_CBC, DERIVED_KEY, iv);
  return Buffer.concat([decipher.update(encrypted), decipher.final()]).toString('utf8');
}

function decrypt(text) {
  if (!text) return null;
  try {
    const parts = String(text).split(':');
    if (parts.length === 3) {
      const [ivHex, authTagHex, encryptedHex] = parts;
      if (!ivHex || !authTagHex || !encryptedHex) return null;
      return decryptGcm(ivHex, authTagHex, encryptedHex);
    }
    if (parts.length === 2) {
      const [ivHex, encryptedHex] = parts;
      if (!ivHex || !encryptedHex) return null;
      return decryptLegacyCbc(ivHex, encryptedHex);
    }
    return null;
  } catch {
    return null;
  }
}

function mask(text, showLast = 4) {
  if (!text) return null;
  const str = String(text);
  if (str.length <= showLast) return str;
  return '•'.repeat(str.length - showLast) + str.slice(-showLast);
}

module.exports = { encrypt, decrypt, mask };

