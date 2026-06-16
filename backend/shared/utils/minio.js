﻿﻿﻿const Minio = require('minio');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const logger = require('./logger');

const minioClient = new Minio.Client({
  endPoint: process.env.MINIO_ENDPOINT || 'localhost',
  port: parseInt(process.env.MINIO_PORT || '9000'),
  useSSL: process.env.MINIO_USE_SSL === 'true',
  accessKey: process.env.MINIO_ACCESS_KEY || 'minioadmin',
  secretKey: process.env.MINIO_SECRET_KEY || 'minioadmin',
});

const BUCKET_NAME = process.env.MINIO_BUCKET || 'hrms-files';

async function ensureBucket() {
  try {
    const exists = await minioClient.bucketExists(BUCKET_NAME);
    if (!exists) {
      await minioClient.makeBucket(BUCKET_NAME, process.env.MINIO_REGION || 'us-east-1');
      
      const policy = JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          {
            Effect: 'Deny',
            Principal: '*',
            Action: 's3:GetObject',
            Resource: `arn:aws:s3:::${BUCKET_NAME}/*`,
          },
        ],
      });
      await minioClient.setBucketPolicy(BUCKET_NAME, policy);
      logger.info(`MinIO bucket '${BUCKET_NAME}' created.`);
    }
  } catch (err) {
    logger.error('MinIO bucket init error:', err);
  }
}

function buildObjectName(companyId, module, originalName) {
  const ext = path.extname(originalName);
  const safeName = `${uuidv4()}${ext}`;
  return `${companyId}/${module}/${safeName}`;
}

async function uploadFile(companyId, module, buffer, originalName, mimeType) {
  const objectName = buildObjectName(companyId, module, originalName);
  const metaData = {
    'Content-Type': mimeType,
    'X-Company-Id': companyId,
  };
  await minioClient.putObject(BUCKET_NAME, objectName, buffer, buffer.length, metaData);
  return objectName;
}

async function getPresignedUrl(objectName, expirySeconds = 3600) {
  return await minioClient.presignedGetObject(BUCKET_NAME, objectName, expirySeconds);
}

async function deleteFile(objectName) {
  await minioClient.removeObject(BUCKET_NAME, objectName);
}

async function deleteFiles(objectNames) {
  if (!objectNames || objectNames.length === 0) return;
  await minioClient.removeObjects(BUCKET_NAME, objectNames);
}

async function listFiles(companyId, module) {
  const prefix = `${companyId}/${module}/`;
  const objects = [];
  return new Promise((resolve, reject) => {
    const stream = minioClient.listObjectsV2(BUCKET_NAME, prefix, true);
    stream.on('data', (obj) => objects.push(obj));
    stream.on('end', () => resolve(objects));
    stream.on('error', reject);
  });
}

module.exports = {
  minioClient,
  ensureBucket,
  uploadFile,
  getPresignedUrl,
  deleteFile,
  deleteFiles,
  listFiles,
  BUCKET_NAME,
};
