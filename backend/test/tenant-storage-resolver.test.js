'use strict';

const test=require('node:test');
const assert=require('node:assert/strict');
const {STORAGE_TIERS,STORAGE_STATUSES,buildStorageDescriptor}=require('../shared/utils/tenantStorageConfig');
const {resolveTenantStorageTarget,buildLocalPostgresUrl}=require('../shared/utils/tenantStorageResolver');

const tenantId='2c6b9b7a-8d52-4b2f-9d47-8c1e6b8b1a10';
const cloudUrl='postgresql://hrms:secret@db.example.test:5432/hrms';
const decryptValue=(value)=>value.replace('enc:','');

function tenant(overrides={}) {
  return {
    id:tenantId,
    plan:'pro',
    db_mode:'cloud',
    db_url:null,
    schema_name:'tenant_2c6b9b7a8d524b2f9d478c1e6b8b1a10',
    storage_tier:STORAGE_TIERS.DEDICATED_SCHEMA,
    storage_status:STORAGE_STATUSES.READY,
    ...overrides,
  };
}

test('resolves a ready dedicated-schema tenant to its exact PostgreSQL schema',()=>{
  const result=resolveTenantStorageTarget(tenant(),{cloudDatabaseUrl:cloudUrl});
  assert.equal(result.schemaName,tenant().schema_name);
  assert.equal(new URL(result.databaseUrl).searchParams.get('schema'),tenant().schema_name);
});
test('resolves Free and Trial tenants only to public',()=>{
  for (const plan of ['free','trial']) {
    const result=resolveTenantStorageTarget(tenant({
      plan,
      storage_tier:STORAGE_TIERS.SHARED,
      schema_name:'public',
    }),{cloudDatabaseUrl:cloudUrl});
    assert.equal(result.schemaName,'public');
    assert.equal(new URL(result.databaseUrl).searchParams.get('schema'),'public');
  }
});
test('builds public storage for Free/Trial and UUID-owned schemas for paid plans',()=>{
  for (const plan of ['free','trial']) {
    const shared=buildStorageDescriptor({tenantId,plan,dbMode:'cloud'});
    assert.equal(shared.schemaName,'public');
    assert.equal(shared.storageTier,STORAGE_TIERS.SHARED);
  }
  const paid=buildStorageDescriptor({tenantId,plan:'pro',dbMode:'cloud'});
  assert.equal(paid.schemaName,'tenant_2c6b9b7a8d524b2f9d478c1e6b8b1a10');
  assert.equal(paid.storageTier,STORAGE_TIERS.DEDICATED_SCHEMA);
});
test('requires explicit audited classification for legacy rows',()=>{
  assert.throws(()=>resolveTenantStorageTarget(tenant({
    storage_tier:STORAGE_TIERS.LEGACY,
    storage_status:STORAGE_STATUSES.LEGACY,
  }),{cloudDatabaseUrl:cloudUrl}),{code:'TENANT_STORAGE_UNCLASSIFIED'});
});
test('refuses to route while provisioning or failed',()=>{
  for(const status of [STORAGE_STATUSES.PENDING,STORAGE_STATUSES.PROVISIONING,STORAGE_STATUSES.FAILED]){
    assert.throws(()=>resolveTenantStorageTarget(tenant({storage_status:status}),{cloudDatabaseUrl:cloudUrl}),{code:'TENANT_STORAGE_NOT_READY'});
  }
});
test('does not fall back when the platform cloud URL is missing',()=>{
  assert.throws(()=>resolveTenantStorageTarget(tenant(),{}),/not configured/);
});
test('decrypts a configured external PostgreSQL URL using injected decryption',()=>{
  const result=resolveTenantStorageTarget(tenant({
    db_mode:'external_cloud',
    db_url:'enc:postgresql://client:pw@db.client.test:5432/hrms',
  }),{decryptValue,cloudDatabaseUrl:cloudUrl});
  assert.equal(new URL(result.databaseUrl).hostname,'db.client.test');
});
test('requires a decryptor for encrypted tenant URLs',()=>{
  assert.throws(()=>resolveTenantStorageTarget(tenant({
    db_mode:'external_cloud',
    db_url:'encrypted-value',
  }),{}),/decryption function is required/);
});
test('rejects non-PostgreSQL and unsupported legacy hybrid routing',()=>{
  assert.throws(()=>resolveTenantStorageTarget(tenant({
    db_mode:'external_cloud',
    db_url:'mysql://client:pw@db.client.test/hrms',
  }),{decryptValue:()=> 'mysql://client:pw@db.client.test/hrms'}),/Only PostgreSQL/);
  assert.throws(()=>resolveTenantStorageTarget(tenant({db_mode:'hybrid'}),{cloudDatabaseUrl:cloudUrl}),/Unsupported database mode/);
});
test('dedicated database tier requires enterprise and no schema override',()=>{
  assert.throws(()=>resolveTenantStorageTarget(tenant({
    storage_tier:STORAGE_TIERS.DEDICATED_DATABASE,
    schema_name:null,
  }),{cloudDatabaseUrl:cloudUrl}),/requires an Enterprise plan/);
  const result=resolveTenantStorageTarget(tenant({
    plan:'enterprise',
    storage_tier:STORAGE_TIERS.DEDICATED_DATABASE,
    schema_name:null,
  }),{cloudDatabaseUrl:cloudUrl});
  assert.equal(result.schemaName,null);
  assert.equal(new URL(result.databaseUrl).searchParams.has('schema'),false);
});
test('rejects schema-tier mismatch instead of selecting another schema',()=>{
  assert.throws(()=>resolveTenantStorageTarget(tenant({
    storage_tier:STORAGE_TIERS.SHARED,
    schema_name:'tenant_wrong',
  }),{cloudDatabaseUrl:cloudUrl}),/Free and Trial storage must use the public schema/);
});

test('rejects another tenant schema even when it has a valid identifier',()=>{
  assert.throws(()=>resolveTenantStorageTarget(tenant({
    schema_name:'tenant_other',
  }),{cloudDatabaseUrl:cloudUrl}),/immutable tenant UUID/);
});


test('builds a customer-hosted PostgreSQL URL from explicit local settings', () => {
  const result = buildLocalPostgresUrl({
    local_db_type: 'postgres',
    local_db_host: '127.0.0.1',
    local_db_port: 5433,
    local_db_name: 'customer hrms',
    local_db_user: 'hr user',
    local_db_pass: 'p@ss word',
  }, decryptValue);
  const parsed = new URL(result);
  assert.equal(parsed.protocol, 'postgresql:');
  assert.equal(parsed.hostname, '127.0.0.1');
  assert.equal(parsed.port, '5433');
  assert.equal(parsed.pathname, '/customer%20hrms');
  assert.equal(parsed.username, 'hr%20user');
  assert.equal(parsed.password, 'p%40ss%20word');
});

test('routes a ready customer-managed local PostgreSQL database without a schema override', () => {
  const result = resolveTenantStorageTarget(tenant({
    plan: 'trial',
    db_mode: 'local',
    storage_tier: STORAGE_TIERS.DEDICATED_DATABASE,
    schema_name: null,
    local_db_type: 'postgresql',
    local_db_host: '192.168.1.20',
    local_db_port: 5432,
    local_db_name: 'hrms',
    local_db_user: 'hrms_app',
    local_db_pass: 'enc:secret',
  }), { decryptValue: (value) => value.replace('enc:', '') });
  assert.equal(new URL(result.databaseUrl).hostname, '192.168.1.20');
  assert.equal(new URL(result.databaseUrl).searchParams.has('schema'), false);
});

test('rejects non-PostgreSQL local database types and incomplete local credentials', () => {
  assert.throws(() => buildLocalPostgresUrl({
    local_db_type: 'mysql', local_db_host: 'localhost',
    local_db_name: 'hrms', local_db_user: 'hrms',
  }), /Only PostgreSQL/);
  assert.throws(() => buildLocalPostgresUrl({
    local_db_type: 'postgres', local_db_host: 'localhost',
    local_db_name: 'hrms',
  }), /requires host, database name and username/);
});


test('resolves a trial customer-managed database without a schema override', () => {
  const result = resolveTenantStorageTarget(tenant({
    plan: 'trial',
    db_mode: 'local',
    storage_tier: STORAGE_TIERS.DEDICATED_DATABASE,
    schema_name: null,
    local_db_type: 'postgres',
    local_db_host: '127.0.0.1',
    local_db_port: 5432,
    local_db_name: 'customer_hrms',
    local_db_user: 'hrms_app',
    local_db_pass: 'secret',
  }), { decryptValue });
  assert.equal(result.storageTier, STORAGE_TIERS.DEDICATED_DATABASE);
  assert.equal(result.schemaName, null);
  assert.equal(new URL(result.databaseUrl).searchParams.has('schema'), false);
});
