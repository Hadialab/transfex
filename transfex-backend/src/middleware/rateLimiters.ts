import rateLimit from 'express-rate-limit';

export const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 300,
  standardHeaders: true,
  legacyHeaders: false,
});

/** Tighter limit for auth routes — these are the ones worth brute-forcing. */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: { message: 'Too many attempts. Try again later.' } },
});

/**
 * Tightest limiter in the app. The public tracking endpoint is the one
 * route reachable without a session, and order IDs / tracking numbers may
 * be sequential or otherwise guessable - so an attacker hammering it is
 * effectively probing for valid codes. 60 requests per 15 minutes is
 * generous for a real customer reloading their tracking page a few times,
 * and useless for enumerating a range.
 */
export const trackLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: { message: 'Too many lookups. Try again later.' } },
});
