const { centralPrisma } = require('./centralPrisma'); 
const crypto = require('crypto');

function hashAadhaar(plain) {
  return crypto.createHash('sha256')
    .update((plain || '').replace(/\s/g, ''))
    .digest('hex');
}

function verifyHash(entered, storedHash) {
  if (!entered || !storedHash) return false;
  return crypto.createHash('sha256').update(entered.trim()).digest('hex') === storedHash;
}

async function findKycByHash(aadhaarHash) {
  const rows = await centralPrisma.$queryRaw`
    SELECT id, created_at, method, aadhaar_hash, kyc_timestamp,
           name, dob, gender, careof, mobile_encrypted, email_encrypted,
           house, street, loc, vtc, po, subdist, dist, state, country, pc, pht,
           task_id
    FROM   central_kyc_records
    WHERE  aadhaar_hash = ${aadhaarHash}
  `;
  return rows[0] || null;
}

async function findKycById(id) {
  const rows = await centralPrisma.$queryRaw`
    SELECT id, created_at, method, aadhaar_hash, kyc_timestamp,
           name, dob, gender, careof, mobile_encrypted, email_encrypted,
           house, street, loc, vtc, po, subdist, dist, state, country, pc, pht,
           task_id
    FROM   central_kyc_records
    WHERE  id = ${id}::uuid
  `;
  return rows[0] || null;
}

async function createKycRecord(data) {
  const {
    aadhaarHash, method = 'otp_based',
    kycTimestamp,
    name, dob, gender, careof, mobile_encrypted, email_encrypted,
    house, street, loc, vtc, po, subdist, dist, state, country, pc, pht,
    taskId,
  } = data;

  await centralPrisma.$executeRaw`
    INSERT INTO central_kyc_records (
      method, aadhaar_hash, kyc_timestamp,
      name, dob, gender, careof, mobile_encrypted, email_encrypted,
      house, street, loc, vtc, po, subdist, dist, state, country, pc, pht,
      task_id
    ) VALUES (
      ${method}, ${aadhaarHash},
      ${kycTimestamp || null},
      ${name || null}, ${dob || null}, ${gender || null}, ${careof || null},
      ${mobile_encrypted || null}, ${email_encrypted || null},
      ${house || null}, ${street || null}, ${loc || null}, ${vtc || null},
      ${po || null}, ${subdist || null}, ${dist || null}, ${state || null},
      ${country || 'India'}, ${pc || null}, ${pht || null},
      ${taskId || null}
    )
  `;
  return findKycByHash(aadhaarHash);
}

async function upsertKycRecord(aadhaarHash, data) {
  const existing = await findKycByHash(aadhaarHash);
  if (existing) {
    const v = (newVal, oldVal) => (newVal !== undefined && newVal !== null) ? newVal : oldVal;
    await centralPrisma.$executeRaw`
      UPDATE central_kyc_records SET
        method            = ${v(data.method,            existing.method)},
        kyc_timestamp     = ${v(data.kycTimestamp,     existing.kyc_timestamp)},
        name              = ${v(data.name,              existing.name)},
        dob               = ${v(data.dob,               existing.dob)},
        gender            = ${v(data.gender,            existing.gender)},
        careof            = ${v(data.careof,            existing.careof)},
        mobile_encrypted  = ${v(data.mobile_encrypted, existing.mobile_encrypted)},
        email_encrypted   = ${v(data.email_encrypted,  existing.email_encrypted)},
        house             = ${v(data.house,             existing.house)},
        street            = ${v(data.street,            existing.street)},
        loc               = ${v(data.loc,               existing.loc)},
        vtc               = ${v(data.vtc,               existing.vtc)},
        po                = ${v(data.po,                existing.po)},
        subdist           = ${v(data.subdist,           existing.subdist)},
        dist              = ${v(data.dist,              existing.dist)},
        state             = ${v(data.state,             existing.state)},
        country           = ${v(data.country,           existing.country)},
        pc                = ${v(data.pc,                existing.pc)},
        pht               = ${v(data.pht,               existing.pht)},
        task_id           = ${v(data.taskId,            existing.task_id)}
      WHERE id = ${existing.id}::uuid
    `;
    return findKycById(existing.id);
  }
  return createKycRecord({ aadhaarHash, ...data });
}

async function linkKycToEmployee(kycId, employeeId) {
  try {
    await centralPrisma.$executeRaw`
      UPDATE central_kyc_records
      SET    employee_id = ${employeeId}
      WHERE  id = ${kycId}::uuid
    `;
  } catch (err) {
    if (err.message?.includes('column "employee_id" does not exist')) {
      console.warn('[centralDb] employee_id column missing, skipping KYC link');
      return;
    }
    throw err;
  }
}

function getOptionalCentralDB() {
  if (!process.env.CENTRAL_DATABASE_URL) {
    return null;
  }
  return centralPrisma;
}

module.exports = {
  hashAadhaar,
  verifyHash,
  findKycByHash,
  findKycById,
  createKycRecord,
  upsertKycRecord,
  linkKycToEmployee,
  getOptionalCentralDB,
};

