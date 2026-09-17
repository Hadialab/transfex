import pino from 'pino';
import { isProd } from './env';

export const logger = pino({
  level: process.env.LOG_LEVEL ?? 'info',
  transport: isProd ? undefined : { target: 'pino-pretty', options: { colorize: true } },
  // Never let a request/response log line accidentally include credentials.
  redact: {
    paths: [
      'req.headers.authorization',
      'req.headers.cookie',
      'req.body.password',
      'req.body.confirm',
      'res.headers["set-cookie"]',
    ],
    censor: '[redacted]',
  },
});
