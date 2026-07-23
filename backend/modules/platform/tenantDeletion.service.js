'use strict';

const { PrismaClient } = require('@prisma/client');
const { encrypt } = require('../../shared/utils/encryption');
const { runBackup } = require('../../shared/utils/backupService');
const { resolveTenantDbUrl } = require('./platform.service');

function appError(code, message, status = 400) {
  const err = new Error(message);
  err.code = code;
  err.status = status;
  return err;
}

function normalizeProvider(provider) {
  const p = String(provider || '').trim().toLowerCase();
  return p === 'gdrive' || p === 'onedrive' ? p : null;
}

function getRequiredFields(provider) {
  if (provider === 'gdrive') {
    return ['clientId', 'clientSecret', 'refreshToken'];
  }
  if (provider === 'onedrive') {
    return ['clientId', 'clientSecret'];
  }
  return [];
}

function getMissingFields(provider, backupConfig = {}) {
  const required = getRequiredFields(provider);
  return required.filter((field) => !String(backupConfig[field] || '').trim());
}

function hasStoredCredentials(cfg, provider) {
  if (!cfg || !provider) return false;
  if (provider === 'gdrive') {
    return !!(cfg.gdrive_client_id_enc && cfg.gdrive_client_secret_enc && cfg.gdrive_refresh_token_enc);
  }
  if (provider === 'onedrive') {
    return !!(cfg.onedrive_client_id_enc && cfg.onedrive_client_secret_enc);
  }
  return false;
}

async function getDeletionReadiness(centralDb, tenantId) {
  const rows = await centralDb.$queryRaw`
    SELECT id, db_mode, schema_name, deleted_at
    FROM tenants
    WHERE id = ${tenantId}::uuid
    LIMIT 1
  `;
  if (!rows.length || rows[0].deleted_at) {
    throw appError('TENANT_NOT_FOUND', 'Tenant not found', 404);
  }

  const tenant = rows[0];
  const cfg = await centralDb.backup_config.findUnique({ where: { company_id: tenantId } });
  const provider = normalizeProvider(cfg?.provider);
  const configured = !!(cfg?.enabled && provider && hasStoredCredentials(cfg, provider));

  return {
    tenant: {
      id: tenant.id,
      dbMode: tenant.db_mode,
      hasSchema: !!tenant.schema_name,
      requiresExternalDeleteConfirmation: ['external_cloud', 'local', 'hybrid'].includes(tenant.db_mode),
    },
    backup: {
      configured,
      provider: provider || null,
      enabled: !!cfg?.enabled,
      needsSetup: !configured,
      lastBackupAt: cfg?.last_backup_at || null,
      lastBackupStatus: cfg?.last_backup_status || null,
      lastError: cfg?.last_error || null,
    },
  };
}

async function upsertBackupConfigForTenant(centralDb, tenantId, backupConfig) {
  const provider = normalizeProvider(backupConfig?.provider);
  if (!provider) {
    throw appError('BACKUP_PROVIDER_REQUIRED', 'Backup provider is required (gdrive or onedrive)', 400);
  }

  const missing = getMissingFields(provider, backupConfig);
  if (missing.length > 0) {
    throw appError('BACKUP_CREDENTIALS_REQUIRED', `Missing backup credentials: ${missing.join(', ')}`, 400);
  }

  const data = {
    enabled: true,
    provider,
    retention_days: Number(backupConfig.retentionDays || 30),
  };

  if (provider === 'gdrive') {
    data.gdrive_client_id_enc = encrypt(String(backupConfig.clientId).trim());
    data.gdrive_client_secret_enc = encrypt(String(backupConfig.clientSecret).trim());
    data.gdrive_refresh_token_enc = encrypt(String(backupConfig.refreshToken).trim());
    data.gdrive_folder_id = String(backupConfig.folderId || 'root').trim() || 'root';

    data.onedrive_client_id_enc = null;
    data.onedrive_tenant_id = null;
    data.onedrive_client_secret_enc = null;
    data.onedrive_folder_path = null;
  } else {
    data.onedrive_client_id_enc = encrypt(String(backupConfig.clientId).trim());
    data.onedrive_client_secret_enc = encrypt(String(backupConfig.clientSecret).trim());
    data.onedrive_tenant_id = String(backupConfig.tenantId || 'common').trim() || 'common';
    data.onedrive_folder_path = String(backupConfig.folderPath || '/HRMS_Backups').trim() || '/HRMS_Backups';

    data.gdrive_client_id_enc = null;
    data.gdrive_client_secret_enc = null;
    data.gdrive_refresh_token_enc = null;
    data.gdrive_folder_id = null;
    data.gdrive_folder_name = null;
  }

  await centralDb.backup_config.upsert({
    where: { company_id: tenantId },
    create: { company_id: tenantId, ...data },
    update: data,
  });
}

async function ensureBackupConfig(centralDb, tenantId, backupConfigInput) {
  if (backupConfigInput?.provider) {
    await upsertBackupConfigForTenant(centralDb, tenantId, backupConfigInput);
  }

  const cfg = await centralDb.backup_config.findUnique({ where: { company_id: tenantId } });
  const provider = normalizeProvider(cfg?.provider);
  if (!cfg || !cfg.enabled || !provider || !hasStoredCredentials(cfg, provider)) {
    throw appError(
      'BACKUP_CREDENTIALS_REQUIRED',
      'Backup credentials are not configured. Please provide Google Drive or OneDrive credentials first.',
      400
    );
  }

  return { cfg, provider };
}

async function runMandatoryBackup(centralDb, tenantId, backupConfigInput) {
  const { provider } = await ensureBackupConfig(centralDb, tenantId, backupConfigInput);
  const result = await runBackup(centralDb, tenantId);
  if (result?.skipped) {
    throw appError('BACKUP_SKIPPED', 'Backup did not run because configuration is incomplete or disabled.', 400);
  }
  if (!result?.success) {
    throw appError('BACKUP_FAILED', result?.error || 'Backup failed. Account deletion is blocked.', 500);
  }
  return { provider, fileUrl: result.fileUrl || null };
}

async function wipeTenantDatabase(dbUrl, schemaName) {
  if (!dbUrl) return;

  const tenantDb = new PrismaClient({ datasources: { db: { url: dbUrl } } });
  try {
    if (schemaName) {
      await tenantDb.$executeRawUnsafe(`DROP SCHEMA IF EXISTS "${schemaName}" CASCADE`);
    } else {
      await tenantDb.$executeRawUnsafe('DROP SCHEMA IF EXISTS public CASCADE; CREATE SCHEMA public');
    }
  } finally {
    await tenantDb.$disconnect();
  }
}

async function permanentlyDeleteTenant({
  centralDb,
  tenantId,
  actorEmail,
  reason = '',
  confirmExternalDelete = false,
  backupConfig = null,
}) {
  const tenantRows = await centralDb.$queryRaw`
    SELECT *
    FROM tenants
    WHERE id = ${tenantId}::uuid AND deleted_at IS NULL
    LIMIT 1
  `;
  if (!tenantRows.length) {
    throw appError('TENANT_NOT_FOUND', 'Tenant not found', 404);
  }

  const tenant = tenantRows[0];
  const dbUrl = resolveTenantDbUrl(tenant.db_mode, tenant);
  if (!dbUrl) {
    throw appError('DB_URL_UNRESOLVED', 'Tenant database URL could not be resolved. Deletion cannot proceed.', 500);
  }

  if (['external_cloud', 'local', 'hybrid'].includes(tenant.db_mode) && !confirmExternalDelete) {
    throw appError(
      'EXTERNAL_CONFIRMATION_REQUIRED',
      'External/dedicated tenant databases require explicit confirmation before permanent deletion',
      400
    );
  }

  const backup = await runMandatoryBackup(centralDb, tenant.id, backupConfig);
  await wipeTenantDatabase(dbUrl, tenant.schema_name);

  await centralDb.$executeRaw`DELETE FROM tenant_modules WHERE tenant_id = ${tenant.id}::uuid`;
  await centralDb.$executeRaw`DELETE FROM central_user_index WHERE company_id = ${tenant.id}::uuid`;
  await centralDb.$executeRaw`DELETE FROM tenant_branch_links WHERE tenant_id = ${tenant.id}::uuid`;
  await centralDb.$executeRaw`DELETE FROM backup_config WHERE company_id = ${tenant.id}::uuid`;
  await centralDb.$executeRaw`DELETE FROM tenant_db_config WHERE company_id = ${tenant.id}::uuid`;
  await centralDb.$executeRaw`DELETE FROM tenants WHERE id = ${tenant.id}::uuid`;

  return {
    tenantName: tenant.name,
    subdomain: tenant.subdomain,
    backupProvider: backup.provider,
    backupUrl: backup.fileUrl,
    reason,
    deletedBy: actorEmail || null,
  };
}

module.exports = {
  appError,
  getDeletionReadiness,
  upsertBackupConfigForTenant,
  permanentlyDeleteTenant,
};
