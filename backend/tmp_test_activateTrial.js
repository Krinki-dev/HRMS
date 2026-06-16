// Quick test for subscription.controller.activateTrial
// This script monkey-patches the centralPrisma module in require cache with a mock

const path = require('path');
const cpPath = path.resolve(__dirname, 'shared', 'utils', 'centralPrisma.js');

// Create a mock centralPrisma implementation
const mockCentral = {
  tenants: {
    findFirst: async ({ where }) => {
      // return a match when subdomain present
      if (where && where.subdomain) return { id: 'mock-tenant-uuid-1234', plan: 'free', db_mode: 'cloud' };
      return null;
    },
    findUnique: async ({ where }) => {
      if (!where || !where.id) return null;
      return { id: where.id, plan: 'free', db_mode: 'cloud' };
    },
    update: async ({ where, data }) => ({ id: where.id, ...data })
  },
  tenant_pricing_config: {
    upsert: async ({ where, update, create }) => ({ ...create })
  },
  $transaction: async (arr) => {
    // Accept array of promises/values and resolve
    const results = await Promise.all(arr.map(p => (typeof p === 'function' ? p() : p)));
    return results;
  }
};

// Insert mock into require cache
require.cache[require.resolve(cpPath)] = {
  id: cpPath,
  filename: cpPath,
  loaded: true,
  exports: { centralPrisma: mockCentral }
};

// Now require the controller
const controller = require('./modules/platform/subscription.controller');

// Create mock req/res
const req = {
  user: {},
  headers: { 'x-tenant-subdomain': 'dev' }
};

let captured = null;
const res = {
  status(code) {
    return {
      json(obj) { console.log('RESPONSE', code, JSON.stringify(obj)); captured = { code, obj }; return captured; }
    };
  }
};

(async () => {
  try {
    await controller.activateTrial(req, res);
    console.log('activateTrial test finished', captured);
  } catch (e) {
    console.error('activateTrial threw:', e);
  }
})();
