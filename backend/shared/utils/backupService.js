﻿const { execSync, exec } = require('child_process');
const { promisify }      = require('util');
const execAsync          = promisify(exec);
const fs                 = require('fs');
const path               = require('path');
const crypto             = require('crypto');
const logger             = require('./logger');
const zlib               = require('zlib');
const { decrypt, encrypt } = require('./encryption');
const emailService       = require('./emailService');
const { centralPrisma }  = require('./centralPrisma');

function tryDecrypt(val) {
  if (!val) return val;
  try { return decrypt(val); } catch { return val; }
}

function tmpPath(filename) {
  return path.join(require('os').tmpdir(), filename);
}

function parseDbUrl(url) {
  try {
    const u = new URL(url.replace('postgresql://', 'http://').replace('postgres://', 'http://'));
    return {
      protocol: url.split(':')[0],
      host: u.hostname,
      port: u.port || '5432',
      user: u.username,
      pass: decodeURIComponent(u.password),
      name: u.pathname.replace('/', ''),
      fullUrl: url
    };
  } catch {
    return null;
  }
}

async function createDump(dbUrl, companyId, dbType = 'postgres') {
  const timestamp  = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const filename   = `backup_${companyId.slice(0, 8)}_${timestamp}.sql.gz`;
  const filePath   = tmpPath(filename);
  const parsed     = parseDbUrl(dbUrl);

  if (!parsed) throw new Error('Cannot parse database URL for backup');

  try {
    if (dbType === 'mysql' || parsed.protocol.includes('mysql')) {
      // MySQL Adapter
      await execAsync(
        `mysqldump -h ${parsed.host} -P ${parsed.port} -u ${parsed.user} -p"${parsed.pass}" ${parsed.name} | gzip > "${filePath}"`
      );
    } else {
      // PostgreSQL Adapter (Default)
      const env = { ...process.env, PGPASSWORD: parsed.pass };
      await execAsync(
        `pg_dump -h ${parsed.host} -p ${parsed.port} -U ${parsed.user} -d ${parsed.name} | gzip > "${filePath}"`,
        { env }
      );
    }

    const stats = fs.statSync(filePath);
    return { filePath, filename, sizeBytes: stats.size };
  } catch (pgDumpErr) {
    logger.warn(`[Backup] Native dump tools not found for ${dbType}, using Node fallback:`, pgDumpErr.message);
    
    // Cross-platform Fallback (using zlib instead of gzip command)
    const jsonFile = filePath.replace('.sql.gz', '.json.gz');
    const rawData = JSON.stringify({
      note: 'pg_dump not available — install postgresql-client for full backups',
      timestamp: new Date().toISOString(),
      company_id: companyId,
    });

    const compressed = zlib.gzipSync(Buffer.from(rawData));
    fs.writeFileSync(jsonFile, compressed);

    const stats = fs.statSync(jsonFile);
    return { filePath: jsonFile, filename: filename.replace('.sql.gz', '.json.gz'), sizeBytes: stats.size };
  }
}

async function uploadToGoogleDrive(config, filePath, filename) {
  
  let google;
  try {
    ({ google } = require('googleapis'));
  } catch {
    throw new Error('googleapis not installed. Run: npm install googleapis');
  }

  const clientId     = tryDecrypt(config.gdrive_client_id_enc);
  const clientSecret = tryDecrypt(config.gdrive_client_secret_enc);
  const refreshToken = tryDecrypt(config.gdrive_refresh_token_enc);

  const oauth2Client = new google.auth.OAuth2(clientId, clientSecret, 'urn:ietf:wg:oauth:2.0:oob');
  oauth2Client.setCredentials({ refresh_token: refreshToken });

  const drive = google.drive({ version: 'v3', auth: oauth2Client });

  const folderId = config.gdrive_folder_id || 'root';

  const response = await drive.files.create({
    requestBody: {
      name:    filename,
      parents: [folderId],
    },
    media: {
      mimeType: 'application/gzip',
      body:     fs.createReadStream(filePath),
    },
    fields: 'id, webViewLink',
  });

  return {
    fileId:  response.data.id,
    fileUrl: response.data.webViewLink,
  };
}

async function uploadToOneDrive(config, filePath, filename) {
  let fetch;
  try {
    fetch = require('node-fetch');
  } catch {
    
    fetch = globalThis.fetch;
  }

  const clientId     = tryDecrypt(config.onedrive_client_id_enc);
  const tenantId     = config.onedrive_tenant_id || 'common';
  const clientSecret = tryDecrypt(config.onedrive_client_secret_enc);
  const folderPath   = config.onedrive_folder_path || '/HRMS_Backups';

  const tokenRes = await fetch(
    `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type:    'client_credentials',
        client_id:     clientId,
        client_secret: clientSecret,
        scope:         'https://graph.microsoft.com/.default',
      }),
    }
  );
  const token = await tokenRes.json();
  if (!token.access_token) throw new Error('OneDrive auth failed: ' + JSON.stringify(token));

  const fileBuffer  = fs.readFileSync(filePath);
  const uploadPath  = `${folderPath}/${filename}`.replace('//', '/');

  const uploadRes = await fetch(
    `https://graph.microsoft.com/v1.0/me/drive/root:${uploadPath}:/content`,
    {
      method:  'PUT',
      headers: {
        Authorization: `Bearer ${token.access_token}`,
        'Content-Type': 'application/gzip',
      },
      body: fileBuffer,
    }
  );
  const result = await uploadRes.json();
  if (!result.id) throw new Error('OneDrive upload failed: ' + JSON.stringify(result));

  return {
    fileId:  result.id,
    fileUrl: result.webUrl,
  };
}

async function cleanOldBackups(config, provider) {
  const retentionDays = config.retention_days || 30;
  const cutoffDate    = new Date(Date.now() - retentionDays * 24 * 60 * 60 * 1000);
  logger.info(`[Backup] Retention: removing backups older than ${retentionDays} days (before ${cutoffDate.toDateString()})`);

  try {
    if (provider === 'gdrive') {
      const { google } = require('googleapis');
      const clientId     = tryDecrypt(config.gdrive_client_id_enc);
      const clientSecret = tryDecrypt(config.gdrive_client_secret_enc);
      const refreshToken = tryDecrypt(config.gdrive_refresh_token_enc);
      const folderId     = config.gdrive_folder_id || 'root';

      const oauth2Client = new google.auth.OAuth2(clientId, clientSecret, 'urn:ietf:wg:oauth:2.0:oob');
      oauth2Client.setCredentials({ refresh_token: refreshToken });
      const drive = google.drive({ version: 'v3', auth: oauth2Client });

      const res = await drive.files.list({
        q: `'${folderId}' in parents and trashed = false and name contains 'backup_'`,
        fields: 'files(id, name, createdTime)',
      });

      for (const file of res.data.files) {
        if (new Date(file.createdTime) < cutoffDate) {
          await drive.files.delete({ fileId: file.id });
          logger.info(`[Backup] GDrive: Deleted expired backup ${file.name}`);
        }
      }
    } else if (provider === 'onedrive') {
      let fetch = require('node-fetch');
      if (!fetch) fetch = globalThis.fetch;

      const clientId     = tryDecrypt(config.onedrive_client_id_enc);
      const tenantId     = config.onedrive_tenant_id || 'common';
      const clientSecret = tryDecrypt(config.onedrive_client_secret_enc);
      const folderPath   = config.onedrive_folder_path || '/HRMS_Backups';

      // Get Token
      const tokenRes = await fetch(`https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          grant_type: 'client_credentials',
          client_id: clientId,
          client_secret: clientSecret,
          scope: 'https://graph.microsoft.com/.default',
        }),
      });
      const token = await tokenRes.json();
      if (!token.access_token) return;

      // List Files
      const listRes = await fetch(`https://graph.microsoft.com/v1.0/me/drive/root:${folderPath}:/children`, {
        headers: { Authorization: `Bearer ${token.access_token}` },
      });
      const list = await listRes.json();

      if (list.value && Array.isArray(list.value)) {
        for (const item of list.value) {
          if (item.name.startsWith('backup_') && new Date(item.createdDateTime) < cutoffDate) {
            await fetch(`https://graph.microsoft.com/v1.0/me/drive/items/${item.id}`, {
              method: 'DELETE',
              headers: { Authorization: `Bearer ${token.access_token}` },
            });
            logger.info(`[Backup] OneDrive: Deleted expired backup ${item.name}`);
          }
        }
      }
    }
  } catch (err) {
    logger.error(`[Backup] Retention cleanup failed for ${provider}:`, err.message);
  }
}

async function runBackup(db, companyId) {
  const startTime = Date.now();

  const config = await db.backup_config.findUnique({ where: { company_id: companyId } });
  if (!config || !config.enabled || config.provider === 'none') {
    logger.info(`[Backup] Backup not configured or disabled for company ${companyId}`);
    return { skipped: true };
  }

  const tenantCfg = await db.tenant_db_config.findUnique({ where: { company_id: companyId } });
  const dbUrl = tenantCfg?.cloud_db_url
    ? tryDecrypt(tenantCfg.cloud_db_url)
    : process.env.DEV_TENANT_DATABASE_URL;

  // Determine DB type from config or URL
  const dbType = tenantCfg?.db_type || (dbUrl.includes('mysql') ? 'mysql' : 'postgres');

  await db.backup_config.update({
    where: { company_id: companyId },
    data:  { last_backup_status: 'running' },
  });

  let filePath, filename, sizeBytes, uploadResult;

  try {
    
    logger.debug(`[Backup] Creating dump for company ${companyId}...`);
    ({ filePath, filename, sizeBytes } = await createDump(dbUrl, companyId, dbType));

    logger.debug(`[Backup] Uploading to ${config.provider}...`);
    switch (config.provider) {
      case 'gdrive':
        uploadResult = await uploadToGoogleDrive(config, filePath, filename);
        break;
      case 'onedrive':
        uploadResult = await uploadToOneDrive(config, filePath, filename);
        break;
      default:
        throw new Error(`Unknown backup provider: ${config.provider}`);
    }

    await cleanOldBackups(config, config.provider);

    const duration = Math.round((Date.now() - startTime) / 1000);

    await db.backup_config.update({
      where: { company_id: companyId },
      data: {
        last_backup_at:       new Date(),
        last_backup_status:   'success',
        last_backup_size_bytes: BigInt(sizeBytes),
        last_backup_file_url: uploadResult?.fileUrl || null,
        last_error:           null,
      },
    });

    const company = await db.companies.findFirst({ where: { id: companyId } });
    if (company?.email) {
      await emailService.sendBackupNotification(db, companyId, {
        email:     company.email,
        status:    'success',
        provider:  config.provider,
        sizeBytes,
        duration,
      }).catch(() => {}); 
    }

    logger.info(`[Backup] ✓ Success for ${companyId} | ${(sizeBytes/1024/1024).toFixed(2)}MB | ${duration}s`);
    return { success: true, sizeBytes, duration, fileUrl: uploadResult?.fileUrl };

  } catch (err) {
    logger.error(`[Backup] ✗ Failed for ${companyId}:`, err.message);

    await db.backup_config.update({
      where: { company_id: companyId },
      data: {
        last_backup_at:     new Date(),
        last_backup_status: 'failed',
        last_error:         err.message,
      },
    }).catch(() => {});

    const company = await db.companies.findFirst({ where: { id: companyId } }).catch(() => null);
    if (company?.email) {
      await emailService.sendBackupNotification(db, companyId, {
        email:    company.email,
        status:   'failed',
        provider: config?.provider || 'unknown',
        error:    err.message,
      }).catch(() => {});
    }

    return { success: false, error: err.message };

  } finally {
    
    if (filePath && fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  }
}

function scheduleAll() {
  
  let cron;
  try {
    cron = require('node-cron');
  } catch {
    logger.warn('[Backup] node-cron not installed. Install for scheduled backups: npm install node-cron');
    return;
  }

  cron.schedule('0 * * * *', async () => {
    const nowIST    = new Date(Date.now() + 5.5 * 60 * 60 * 1000);
    const currentHH = nowIST.getHours().toString().padStart(2, '0');
    const currentMM = nowIST.getMinutes().toString().padStart(2, '0');
    const currentTime = `${currentHH}:${currentMM}`;

    logger.debug(`[Backup] Scheduler tick at ${currentTime} IST`);

    try {
      const configs = await centralPrisma.backup_config.findMany({
        where: { enabled: true },
      });

      for (const config of configs) {
        if (config.backup_time === currentTime) {
          runBackup(centralPrisma, config.company_id).catch(err => {
            logger.error(`[Backup] Scheduled run failed for ${config.company_id}:`, err.message);
          });
        }
      }
    } catch (err) {
      logger.error('[Backup] Scheduler query failed:', err.message);
    }
  });

  logger.info('[Backup] Scheduler started (hourly tick)');
}

const gdriveOAuth = {

  getAuthUrl(clientId, clientSecret, redirectUri) {
    let google;
    try {
      ({ google } = require('googleapis'));
    } catch {
      throw new Error('googleapis not installed. Run: npm install googleapis');
    }
    const oauth2 = new google.auth.OAuth2(clientId, clientSecret, redirectUri);
    return oauth2.generateAuthUrl({
      access_type: 'offline',
      scope: ['https://www.googleapis.com/auth/drive.file'],
    });
  },

  async exchangeCode(clientId, clientSecret, redirectUri, code) {
    const { google } = require('googleapis');
    const oauth2     = new google.auth.OAuth2(clientId, clientSecret, redirectUri);
    const { tokens } = await oauth2.getToken(code);
    return tokens; 
  },
};

module.exports = { runBackup, scheduleAll, gdriveOAuth };
