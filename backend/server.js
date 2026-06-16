require('dotenv').config();

const express      = require('express');
const http         = require('http');
const cors         = require('cors');
const helmet       = require('helmet');
const cookieParser = require('cookie-parser');
const { WebSocketServer } = require('ws');
const url          = require('url');
const jwt          = require('jsonwebtoken');

const logger = require('./shared/utils/logger');
const minio  = require('./shared/utils/minio');
const { THEME } = require('./shared/utils/uiConstants');
const { tenantMiddleware } = require('./shared/middleware/tenant');
const { tenantSessionMiddleware } = require('./shared/middleware/tenantSession');

logger.info(`${THEME.ICONS.PROCESS} [Server] starting with LOG_LEVEL=${process.env.LOG_LEVEL || 'unset'} NODE_ENV=${process.env.NODE_ENV || 'unset'}`);

const app  = express();
const PORT = process.env.PORT || 5001;

app.use(helmet());
app.use(cookieParser());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

const rawAllowedOrigins = (process.env.ALLOWED_ORIGINS || process.env.FRONTEND_URL || 'http://localhost:5173')
  .split(',')
  .map(o => o.trim())
  .filter(Boolean);
const allowAnyOrigin = rawAllowedOrigins.includes('*');

function isPrivateNetworkHost(hostname) {
  return hostname === 'localhost'
    || hostname === '127.0.0.1'
    || /^10\./.test(hostname)
    || /^192\.168\./.test(hostname)
    || /^172\.(1[6-9]|2\d|3[0-1])\./.test(hostname);
}

function isSynternOrigin(hostname) {
  return hostname === 'syntern.in'
    || hostname === 'www.syntern.in'
    || hostname.endsWith('.syntern.in');
}

function isOriginAllowed(origin) {
  if (!origin) return true;
  if (allowAnyOrigin) return true;
  if (rawAllowedOrigins.includes(origin)) return true;
  try {
    const parsed = new URL(origin);
    if (process.env.NODE_ENV !== 'production' && (isPrivateNetworkHost(parsed.hostname) || isSynternOrigin(parsed.hostname))) {
      return true;
    }
  } catch (err) {
    logger.warn(`${THEME.ICONS.WARNING} [CORS] Invalid origin format: ${origin}`);
  }
  return false;
}

app.use(cors({
  origin: (origin, callback) => {
    if (isOriginAllowed(origin)) return callback(null, true);
    logger.warn(`${THEME.ICONS.WARNING} [CORS] Blocked origin ${origin}`);
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Tenant-Subdomain', 'X-CSRF-Token', 'X-Requested-With'],
}));

app.use((req, res, next) => {
  if (req.method === 'GET' || req.method === 'HEAD' || req.method === 'OPTIONS') return next();
  const publicPaths = ['/api/csrf-token', '/api/v1/auth/lookup', '/api/v1/auth/login', '/api/v1/auth/refresh'];
  if (publicPaths.includes(req.path)) return next();
  const isXhr = req.headers['x-requested-with'] === 'XMLHttpRequest';
  const csrfToken = req.headers['x-csrf-token'];
  const sessionToken = req.cookies['_csrf'];
  if (isXhr || (csrfToken && sessionToken && csrfToken === sessionToken)) return next();
  logger.warn(`${THEME.ICONS.LOCK} [CSRF] Blocked ${req.method} ${req.path} from ${req.ip}`);
  return res.status(403).json({ success: false, code: 'ERR_CSRF_FAILED', message: 'CSRF validation failed' });
});

// FIX 1 & 2: Restored proper backticks and fixed logger[level](...) call
app.use((req, res, next) => {
  const start = Date.now();

  logger.debug(`[ACTION START] ${req.method} ${req.originalUrl}`);

  res.on('finish', () => {
    const ms = Date.now() - start;
    const level = res.statusCode >= 500 ? 'error' : res.statusCode >= 400 ? 'warn' : 'info';

    logger[level](`[ACTION END] ${req.method} ${req.originalUrl} ${res.statusCode} ${ms}ms`, {
      ip: req.ip,
      ua: req.headers['user-agent'],
    });
  });
  next();
});

// FIX 3: Replaced corrupted smart-quotes around template literal with proper straight backticks
app.get('/health', (_req, res) => res.json({ success: true, message: `${THEME.ICONS.SUCCESS} HRMS System Online` }));
app.use('/uploads', express.static(require('path').join(__dirname, 'uploads')));
app.use('/api/v1', tenantMiddleware);
app.use('/api/v1', tenantSessionMiddleware);
app.use('/api/v1/platform',             require('./modules/platform/platform.routes'));
app.use('/api/v1/platform',             require('./modules/platform/brand.routes'));
app.use('/api/v1/platform',             require('./modules/platform/plans.routes'));
app.use('/api/v1/platform/admin',       require('./modules/platform/admin.routes'));
app.use('/api/v1/gst',                  require('./modules/automation/gst/gst.routes'));
app.use('/api/v1/platform/subscribe',   require('./modules/platform/subscription.routes'));
app.use('/api/v1/auth',                 require('./modules/auth/auth.routes'));
app.use('/api/v1/employees',            require('./modules/employees/employees.routes'));
app.use('/api/v1/attendance',           require('./modules/attendance/attendance.routes'));
app.use('/api/v1/leave',                require('./modules/leave/leave.routes'));
app.use('/api/v1/payroll',              require('./modules/payroll/payroll.routes'));
app.use('/api/v1/compliance',           require('./modules/compliance/compliance.routes'));
app.use('/api/v1/dashboard',            require('./modules/dashboard/dashboard.routes'));
app.use('/api/v1/recruitment',          require('./modules/recruitment/recruitment.routes'));
app.use('/api/v1/performance',          require('./modules/performance/performance.routes'));
app.use('/api/v1/training',             require('./modules/training/training.routes'));
app.use('/api/v1/assets',               require('./modules/assets/assets.routes'));
app.use('/api/v1/expenses',             require('./modules/expenses/expenses.routes'));
app.use('/api/v1/reports',              require('./modules/reports/reports.routes'));
app.use('/api/v1/notifications',        require('./modules/notifications/notifications.routes'));
app.use('/api/v1/roles',                require('./modules/roles/roles.routes'));
app.use('/api/v1/settings',             require('./modules/settings/settings.routes'));
app.use('/api/v1/config/notifications', require('./modules/notifications/notification.routes'));

function safeUse(path, modulePath) {
  try {
    app.use(path, require(modulePath));
  } catch (err) {
    logger.warn(`${THEME.ICONS.WARNING} [Server] Skipped module ${path}: ${err.message}`);
  }
}

safeUse('/api/v1/audit-logs', './modules/audit/audit.routes');
safeUse('/api/v1/automation', './modules/automation/index');

app.use((req, res) => res.status(404).json({
  success: false,
  code: 'ERR_NOT_FOUND',
  message: `${THEME.ICONS.WARNING} Resource ${req.method} ${req.path} not found`,
}));

app.use((err, req, res, _next) => {
  logger.error('Unhandled error', {
    message: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    path: req.path,
  });
  res.status(err.status || 500).json({
    success: false,
    code: err.code || 'ERR_SERVER',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong',
  });
});

const httpServer = http.createServer(app);
const wss = new WebSocketServer({ noServer: true });
const notifSvc = require('./modules/notifications/notifications.service');

httpServer.on('upgrade', (request, socket, head) => {
  const { query } = url.parse(request.url, true);
  const token = query.token;
  if (!token) {
    socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n');
    socket.destroy();
    return;
  }
  try {
    const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
    request.userId = decoded.id || decoded.sub;
    wss.handleUpgrade(request, socket, head, (ws) => wss.emit('connection', ws, request));
  } catch {
    socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n');
    socket.destroy();
  }
});

wss.on('connection', (ws, request) => {
  const userId = request.userId;
  logger.info(`${THEME.ICONS.USER} [WS] Client connected: ${userId}`);
  notifSvc.register(userId, ws);
  ws.send(JSON.stringify({ type: 'connected', message: 'Real-time notifications active.' }));
});

async function startServer() {
  const required = ['JWT_ACCESS_SECRET', 'JWT_REFRESH_SECRET', 'ENCRYPTION_KEY'];
  const minLengths = { JWT_ACCESS_SECRET: 32, JWT_REFRESH_SECRET: 32, ENCRYPTION_KEY: 16 };
  for (const varName of required) {
    const val = process.env[varName];
    if (!val) { logger.error(`${THEME.ICONS.ERROR} Missing required environment variable: ${varName}`); process.exit(1); }
    if (process.env.NODE_ENV === 'production' && val.length < minLengths[varName]) {
      logger.error(`${THEME.ICONS.ERROR} ${varName} too short (${val.length} chars)`); process.exit(1);
    }
  }

  try {
    await minio.ensureBucket();
    logger.info(`${THEME.ICONS.SUCCESS} MinIO bucket ready`);
  } catch (err) {
    if (process.env.NODE_ENV !== 'development') throw err;
    logger.warn(`${THEME.ICONS.WARNING} MinIO bucket init failed (dev mode)`);
  }

  httpServer.listen(PORT, '127.0.0.1', () => {
    logger.info(`${THEME.ICONS.SUCCESS} HRMS Server running on localhost:${PORT}`);
    logger.info(`${THEME.ICONS.INFO} Health: http://localhost:${PORT}/health`);
    logger.info(`${THEME.ICONS.INFO} WebSocket: ws://localhost:${PORT}/ws?token=JWT`);
  });

  try {
    const { startWorker } = require('./modules/automation/automation.queue');
    startWorker();
    logger.info(`${THEME.ICONS.SUCCESS} Automation background queue active`);
  } catch (e) { logger.warn(`${THEME.ICONS.WARNING} Automation worker not started`); }

  try {
    const { startBillingCron } = require('./modules/platform/billing.cron');
    startBillingCron();
    logger.info(`${THEME.ICONS.SUCCESS} Billing cron scheduler active`);
  } catch (e) { logger.warn(`${THEME.ICONS.WARNING} Billing cron not started`); }
}

startServer().catch((err) => {
  logger.error('Failed to start server', { message: err.message, stack: err.stack });
  process.exit(1);
});

module.exports = app;