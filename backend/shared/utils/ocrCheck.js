const fs = require('fs');
const path = require('path');

function getOcrDataPath() {
  return path.join(__dirname, '../../eng.traineddata');
}

function isOcrAvailable() {
  return fs.existsSync(getOcrDataPath());
}

function logOcrStatus() {
  if (!isOcrAvailable()) {
    console.warn('[OCR] eng.traineddata not found. OCR features disabled.');
    return false;
  }

  console.log('[OCR] eng.traineddata found. OCR features enabled.');
  return true;
}

module.exports = {
  getOcrDataPath,
  isOcrAvailable,
  logOcrStatus,
};