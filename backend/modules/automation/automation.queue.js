const MAX_CONCURRENT = parseInt(process.env.AADHAAR_MAX_CONCURRENT) || 2;
let   activeWorkers  = 0;
const taskQueue      = [];

function makeTenantClient(dbUrl) {
  const { PrismaClient } = require('@prisma/client');
  return new PrismaClient({
    datasources: { db: { url: dbUrl } },
    log: ['error'],
  });
}

async function updateTask(db, taskId, updates) {
  try {
    await db.automation_tasks.update({ where: { id: taskId }, data: updates });
  } catch (e) {
    console.error('[AutoQueue] updateTask failed:', e.message);
  }
}

async function addTaskLog(db, taskId, stepNumber, description, status = 'success', error = null) {
  try {
    await db.automation_logs.create({
      data: {
        task_id:          taskId,
        step_number:      stepNumber,
        step_description: description,
        status,
        error:            error || undefined,
      },
    });
  } catch {  }
}

async function saveScreenshot(db, taskId, page, purpose = 'progress') {
  try {
    const buf     = await page.screenshot({ type: 'png' });
    const dataUrl = `data:image/png;base64,${buf.toString('base64')}`;
    await db.automation_screenshots.create({
      data: { task_id: taskId, screenshot_url: dataUrl, purpose },
    });
    return dataUrl;
  } catch { return null; }
}

async function runWorker(taskId, payload) {
  const { dbUrl, ...workerPayload } = payload;

  if (!dbUrl) {
    console.error(`[AutoQueue] No dbUrl in payload for task ${taskId} — cannot update task status`);
    
  }

  const db     = dbUrl ? makeTenantClient(dbUrl) : null;
  const worker = require('./kyc/kyc.worker');

  const helpers = {
    updateTask:     (tid, upd)              => db ? updateTask(db, tid, upd) : Promise.resolve(),
    addTaskLog:     (tid, step, desc, st, e) => db ? addTaskLog(db, tid, step, desc, st, e) : Promise.resolve(),
    saveScreenshot: (tid, page, purpose)    => db ? saveScreenshot(db, tid, page, purpose) : Promise.resolve(null),
    db,
  };

  try {
    await worker.run(taskId, workerPayload, helpers);
  } finally {
    if (db) {
      await db.$disconnect().catch(() => {});
    }
  }
}

async function processQueue() {
  if (activeWorkers >= MAX_CONCURRENT) return;
  if (taskQueue.length === 0)          return;

  const { taskId, payload } = taskQueue.shift();
  activeWorkers++;

  console.log(`[AutoQueue] Starting job | taskId: ${taskId} | active: ${activeWorkers}/${MAX_CONCURRENT}`);

  runWorker(taskId, payload)
    .catch(err => {
      console.error(`[AutoQueue] Job failed | taskId: ${taskId} |`, err.message);
      const { dbUrl } = payload;
      if (dbUrl) {
        const db = makeTenantClient(dbUrl);
        updateTask(db, taskId, {
          status:        'failed',
          completed_at:  new Date(),
          error_message: err.message,
        })
          .catch(() => {})
          .finally(() => db.$disconnect().catch(() => {}));
      }
    })
    .finally(() => {
      activeWorkers--;
      console.log(`[AutoQueue] Job finished | taskId: ${taskId} | active: ${activeWorkers}/${MAX_CONCURRENT}`);
      processQueue();
    });

  processQueue();
}

function enqueue(taskType, taskId, payload) {
  if (taskType !== 'aadhaar_kyc') {
    throw new Error(`Unknown taskType: ${taskType}`);
  }
  taskQueue.push({ taskId, payload });
  console.log(`[AutoQueue] Enqueued | taskId: ${taskId} | queue length: ${taskQueue.length}`);
  processQueue();
  return Promise.resolve({ id: taskId });
}

function startWorker() {
  console.log(`[AutoQueue] In-process queue | concurrency: ${MAX_CONCURRENT}`);
  return null;
}

module.exports = { enqueue, startWorker, updateTask, addTaskLog };

