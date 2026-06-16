const crypto = require('crypto');

const RAW_KEY    = process.env.ENCRYPTION_KEY || 'hrms_32char_key_change_in_prod!!';
const ALGORITHM  = 'aes-256-cbc';
const IV_LENGTH  = 16;

const DERIVED_KEY = crypto.scryptSync(RAW_KEY, 'hrms_salt_v1', 32);

function encrypt(text) {
  if (!text) return null;
  const iv         = crypto.randomBytes(IV_LENGTH);
  const cipher     = crypto.createCipheriv(ALGORITHM, DERIVED_KEY, iv);
  const encrypted  = Buffer.concat([cipher.update(String(text), 'utf8'), cipher.final()]);
  return iv.toString('hex') + ':' + encrypted.toString('hex');
}

function decrypt(text) {
  if (!text) return null;
  try {
    const [ivHex, encryptedHex] = text.split(':');
    if (!ivHex || !encryptedHex) return null;
    const iv        = Buffer.from(ivHex, 'hex');
    const encrypted = Buffer.from(encryptedHex, 'hex');
    const decipher  = crypto.createDecipheriv(ALGORITHM, DERIVED_KEY, iv);
    return Buffer.concat([decipher.update(encrypted), decipher.final()]).toString('utf8');
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

