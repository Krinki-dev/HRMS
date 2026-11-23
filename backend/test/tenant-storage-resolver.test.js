'use strict';

const test=require('node:test');
const assert=require('node:assert/strict');
const {STORAGE_TIERS,STORAGE_STATUSES}=require('../shared/utils/tenantStorageConfig');
const {resolveTenantStorageTarget}=require('../shared/utils/tenantStorageResolver');

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
test('resolves shared tenants only to shared_tenants',()=>{
  const result=resolveTenantStorageTarget(tenant({
    plan:'free',
    storage_tier:STORAGE_TIERS.SHARED,
    schema_name:'shared_tenants',
  }),{cloudDatabaseUrl:cloudUrl});
  assert.equal(result.schemaName,'shared_tenants');
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
  }),{cloudDatabaseUrl:cloudUrl}),/Shared storage must use/);
});

test('rejects another tenant schema even when it has a valid identifier',()=>{
  assert.throws(()=>resolveTenantStorageTarget(tenant({
    schema_name:'tenant_other',
  }),{cloudDatabaseUrl:cloudUrl}),/immutable tenant UUID/);
});
