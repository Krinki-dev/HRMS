'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const {STORAGE_TIERS,STORAGE_STATUSES,assertSchemaName,buildStorageDescriptor,deriveTenantSchemaName,validatePostgresUrl}=require('../shared/utils/tenantStorageConfig');
const tenantId='2c6b9b7a-8d52-4b2f-9d47-8c1e6b8b1a10';
const pgUrl='postgresql://hrms:secret@db.example.test:5432/hrms';

test('free and trial plans use the public shared schema',()=>{
  for(const plan of ['free','trial']){
    const r=buildStorageDescriptor({plan,dbMode:'cloud',dbUrl:pgUrl});
    assert.equal(r.storageTier,STORAGE_TIERS.SHARED);
    assert.equal(r.schemaName,'public');
    assert.equal(new URL(r.databaseUrl).searchParams.get('schema'),'public');
    assert.equal(r.storageStatus,STORAGE_STATUSES.PENDING);
  }
});
test('paid plans use a tenant-specific schema, independent of employee count',()=>{
  const r=buildStorageDescriptor({tenantId,plan:'pro',dbMode:'cloud',dbUrl:pgUrl});
  assert.equal(r.storageTier,STORAGE_TIERS.DEDICATED_SCHEMA);
  assert.equal(r.schemaName,deriveTenantSchemaName(tenantId));
});
test('enterprise cloud may explicitly request platform-managed dedicated database isolation',()=>{
  const r=buildStorageDescriptor({tenantId,plan:'enterprise',dbMode:'cloud',dbUrl:pgUrl,requestedTier:STORAGE_TIERS.DEDICATED_DATABASE});
  assert.equal(r.storageTier,STORAGE_TIERS.DEDICATED_DATABASE);
  assert.equal(r.schemaName,null);
  assert.equal(new URL(r.databaseUrl).searchParams.has('schema'),false);
});
test('rejects non-PostgreSQL URLs and legacy hybrid mode for new allocations',()=>{
  assert.throws(()=>validatePostgresUrl('mysql://db.example.test/hrms'),/Only PostgreSQL/);
  assert.throws(()=>buildStorageDescriptor({plan:'pro',dbMode:'hybrid',dbUrl:pgUrl}),/Unsupported database mode/);
});
test('requires external/local URLs and a valid tenant UUID',()=>{
  assert.throws(()=>buildStorageDescriptor({plan:'pro',dbMode:'external_cloud'}),/URL is required/);
  assert.throws(()=>deriveTenantSchemaName('not-a-uuid'),/valid tenant UUID/);
});
test('rejects paid shared-schema allocations and non-enterprise dedicated DBs',()=>{
  assert.throws(()=>buildStorageDescriptor({plan:'starter',requestedTier:STORAGE_TIERS.SHARED,dbUrl:pgUrl}),/Paid plans must receive/);
  assert.throws(()=>buildStorageDescriptor({plan:'pro',requestedTier:STORAGE_TIERS.DEDICATED_DATABASE,dbUrl:pgUrl}),/reserved for/);
});
test('validates PostgreSQL schema identifiers',()=>{
  assert.equal(assertSchemaName('tenant_customer_01'),'tenant_customer_01');
  assert.throws(()=>assertSchemaName('Tenant; DROP SCHEMA public'),/lowercase PostgreSQL identifier/);
  assert.throws(()=>assertSchemaName('a'.repeat(64)),/lowercase PostgreSQL identifier/);
});
test('cloud mode can defer connection URL to deployment configuration',()=>{
  const r=buildStorageDescriptor({plan:'free',dbMode:'cloud'});
  assert.equal(r.databaseUrl,null);
  assert.equal(r.connectionSource,'CLOUD_TENANT_DATABASE_URL');
});


test('customer-managed local and external PostgreSQL use a dedicated database even during trial', () => {
  const local = buildStorageDescriptor({
    tenantId, plan: 'trial', dbMode: 'local',
    dbUrl: 'postgresql://hrms:secret@127.0.0.1:5432/customer',
  });
  assert.equal(local.storageTier, STORAGE_TIERS.DEDICATED_DATABASE);
  assert.equal(local.schemaName, null);

  const external = buildStorageDescriptor({
    tenantId, plan: 'trial', dbMode: 'external_cloud',
    dbUrl: pgUrl,
  });
  assert.equal(external.storageTier, STORAGE_TIERS.DEDICATED_DATABASE);
  assert.equal(external.schemaName, null);
});
