const jwt = require('jsonwebtoken');
const { AppDataSource } = require('../data-source');
const User = require('../entities/User');
const DailyScrapingQuota = require('../entities/DailyScrapingQuota');

const SCRAPING_LIMITS_ENABLED = String(process.env.SCRAPING_LIMITS_ENABLED || 'true').toLowerCase() === 'true';
const SCRAPING_REQUIRE_AUTH_FOR_NEW = String(process.env.SCRAPING_REQUIRE_AUTH_FOR_NEW || 'true').toLowerCase() === 'true';

const SCRAPING_DAILY_NEW_LIMIT = Number(process.env.SCRAPING_DAILY_NEW_LIMIT || 25);
const SCRAPING_DAILY_UPDATE_LIMIT = Number(process.env.SCRAPING_DAILY_UPDATE_LIMIT || 10);
const SCRAPING_DAILY_NEW_LIMIT_ADMIN = Number(process.env.SCRAPING_DAILY_NEW_LIMIT_ADMIN || 0);
const SCRAPING_DAILY_UPDATE_LIMIT_ADMIN = Number(process.env.SCRAPING_DAILY_UPDATE_LIMIT_ADMIN || 0);

function getTodayKey() {
  return new Date().toISOString().slice(0, 10);
}

function parseBearerToken(req) {
  const authHeader = req.headers['authorization'];
  return authHeader && authHeader.split(' ')[1];
}

async function resolveCurrentUser(req) {
  const token = parseBearerToken(req);
  if (!token) {
    return { ok: false, status: 401, message: 'Debes iniciar sesion para generar consultas nuevas.' };
  }

  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret_key_change_me');
  } catch {
    return { ok: false, status: 403, message: 'Token invalido o expirado.' };
  }

  const userRepo = AppDataSource.getRepository(User);
  const user = await userRepo.findOne({
    where: [{ id: decoded.userId }, { email: decoded.email }],
  });

  if (!user) {
    return { ok: false, status: 403, message: 'Usuario no autorizado.' };
  }

  return { ok: true, user };
}

function getLimitByType(user, type) {
  const isAdmin = user.role === 'admin';

  if (type === 'new') {
    return isAdmin ? SCRAPING_DAILY_NEW_LIMIT_ADMIN : SCRAPING_DAILY_NEW_LIMIT;
  }

  if (type === 'update') {
    return isAdmin ? SCRAPING_DAILY_UPDATE_LIMIT_ADMIN : SCRAPING_DAILY_UPDATE_LIMIT;
  }

  return 0;
}

async function consumeQuota(req, type, amount = 1) {
  if (!SCRAPING_LIMITS_ENABLED) {
    return { ok: true, skipped: true };
  }

  if (type === 'new' && !SCRAPING_REQUIRE_AUTH_FOR_NEW) {
    return { ok: true, skipped: true };
  }

  const userResult = await resolveCurrentUser(req);
  if (!userResult.ok) {
    return userResult;
  }

  const { user } = userResult;
  const limit = getLimitByType(user, type);

  if (user.role === 'admin') {
    return { ok: true, user, adminBypass: true };
  }

  // 0 o negativo significa ilimitado para ese tipo/rol.
  if (limit <= 0) {
    return { ok: true, user, unlimited: true };
  }

  const day = getTodayKey();
  const quotaRepo = AppDataSource.getRepository(DailyScrapingQuota);

  let row = await quotaRepo.findOne({ where: { userId: user.id, day } });
  if (!row) {
    row = quotaRepo.create({
      userId: user.id,
      day,
      consultasNuevas: 0,
      actualizaciones: 0,
    });
  }

  const current = type === 'new' ? row.consultasNuevas : row.actualizaciones;
  if (current + amount > limit) {
    const remaining = Math.max(0, limit - current);
    const tipoTexto = type === 'new' ? 'consultas nuevas' : 'actualizaciones';

    return {
      ok: false,
      status: 429,
      message: `Limite diario alcanzado para ${tipoTexto}. Disponible hoy: ${remaining}.`,
      remaining,
      limit,
      type,
    };
  }

  if (type === 'new') {
    row.consultasNuevas += amount;
  } else {
    row.actualizaciones += amount;
  }

  await quotaRepo.save(row);

  const used = type === 'new' ? row.consultasNuevas : row.actualizaciones;
  return {
    ok: true,
    user,
    used,
    limit,
    remaining: Math.max(0, limit - used),
  };
}

module.exports = {
  consumeQuota,
};
