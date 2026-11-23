const { spawn }          = require('child_process');
const { pipeline }       = require('stream/promises');
const fs                 = require('fs');
const path               = require('path');
const crypto             = require('crypto');
const logger             = require('./logger');
const { createGzip }    = require('zlib');
const { createWriteStream } = require('fs');
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
    const parsed = new URL(url);
    if (!['postgres:', 'postgresql:'].includes(parsed.protocol)) {
      throw new Error('Only PostgreSQL backups are supported.');
    }
    if (!parsed.hostname || !parsed.pathname || parsed.pathname === '/') {
      throw new Error('Database URL must include a host and database name.');
    }
    return {
      host: parsed.hostname,
      port: parsed.port || '5432',
      user: decodeURIComponent(parsed.username),
      pass: decodeURIComponent(parsed.password),
      name: decodeURIComponent(parsed.pathname.replace(/^\\//, '')),
      schema: parsed.searchParams.get('schema'),
    };
  } catch (error) {
    if (error.message.includes('Only PostgreSQL') || error.message.includes('must include')) throw error;
    throw new Error('Cannot parse PostgreSQL database URL for backup.');
  }
}

async function createDump(dbUrl, companyId, dbType = 'postgres') {
  if (dbType !== 'postgres' && dbType !== 'postgresql') {
    throw new Error('Only PostgreSQL backups are supported by the tenant storage architecture.');
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const filename = `backup_${companyId.slice(0, 8)}_${timestamp}.sql.gz`;
  const filePath = tmpPath(filename);
  const parsed = parseDbUrl(dbUrl);
  const args = [
    '--no-password',
    '--format=plain',
    '--host', parsed.host,
    '--port', parsed.port,
    '--username', parsed.user,
    '--dbname', parsed.name,
  ];
  if (parsed.schema) args.push('--schema', parsed.schema);

  const child = spawn('pg_dump', args, {
    env: { ...process.env, PGPASSWORD: parsed.pass },
    stdio: ['ignore', 'pipe', 'pipe'],
    windowsHide: true,
  });

  let stderr = '';
  child.stderr.setEncoding('utf8');
  child.stderr.on('data', (chunk) => { stderr += chunk; });

  const exitPromise = new Promise((resolve, reject) => {
    child.once('error', (error) => reject(new Error(`pg_dump could not start: ${error.message}`)));
    child.once('close', (code, signal) => {
      if (code === 0) resolve();
      else reject(new Error(`pg_dump failed (code=${code}, signal=${signal || 'none'}): ${stderr.trim()}`));
    });
  });

  try {
    await Promise.all([
      pipeline(child.stdout, createGzip(), createWriteStream(filePath, { flags: 'wx' })),
      exitPromise,
    ]);

    const stats = fs.statSync(filePath);
    if (!stats.size) throw new Error('pg_dump produced an empty backup artifact.');
    const header = Buffer.alloc(2);
    const fd = fs.openSync(filePath, 'r');
    try { fs.readSync(fd, header, 0, 2, 0); } finally { fs.closeSync(fd); }
    if (header[0] !== 0x1f || header[1] !== 0x8b) {
      throw new Error('Backup artifact failed gzip format validation.');
    }
    return { filePath, filename, sizeBytes: stats.size };
  } catch (error) {
    if (!child.killed) child.kill();
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    throw error;
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
  if (!dbUrl) throw new Error('No PostgreSQL URL is configured for this tenant backup.');

  const dbType = 'postgres';

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

    const company = db.companies
      ? await db.companies.findFirst({ where: { id: companyId } })
      : db.tenants
        ? await db.tenants.findUnique({ where: { id: companyId }, select: { admin_email: true } })
        : null;
    const companyEmail = company?.email || company?.admin_email;
    if (companyEmail) {
      await emailService.sendBackupNotification(db, companyId, {
        email:     companyEmail,
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
