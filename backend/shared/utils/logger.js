const { createLogger, format, transports } = require('winston');
const path = require('path');

const { combine, timestamp, printf, colorize, errors, json } = format;

const consoleFormat = printf(({ level, message, timestamp, stack, ...meta }) => {
  const metaStr = Object.keys(meta).length ? ' ' + JSON.stringify(meta) : '';
  return `${timestamp} [${level}]: ${stack || message}${metaStr}`;
});

const fileFormat = combine(
  timestamp(),
  errors({ stack: true }),
  json()
);

const LOG_DIR = path.join(process.cwd(), 'logs');

const logger = createLogger({
  level: process.env.LOG_LEVEL || (process.env.DEBUG_MODE === 'true' ? 'debug' : 'info'),
  defaultMeta: { service: 'hrms-backend' },
  transports: [
    
    new transports.Console({
      format: combine(
        colorize({ all: true }),
        timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        errors({ stack: true }),
        consoleFormat
      ),
    }),
    
    new transports.File({
      filename: path.join(LOG_DIR, 'error.log'),
      level: 'error',
      format: fileFormat,
      maxsize: 10 * 1024 * 1024, 
      maxFiles: 5,
    }),
    
    new transports.File({
      filename: path.join(LOG_DIR, 'combined.log'),
      format: fileFormat,
      maxsize: 20 * 1024 * 1024, 
      maxFiles: 10,
    }),
  ],
  
  exitOnError: false,
});

logger.stream = {
  write: (message) => {
    logger.http(message.trim());
  },
};

if (process.env.NODE_ENV === 'test') {
  logger.silent = true;
}

module.exports = logger;
