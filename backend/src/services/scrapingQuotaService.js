const jwt = require('jsonwebtoken');
const { AppDataSource } = require('../data-source');
const User = require('../entities/User');
const DailyScrapingQuota = require('../entities/DailyScrapingQuota');

const SCRAPING_LIMITS_ENABLED = String(process.env.SCRAPING_LIMITS_ENABLED || 'true').toLowerCase() === 'true';
const SCRAPING_REQUIRE_AUTH_FOR_SCRAPING = String(process.env.SCRAPING_REQUIRE_AUTH_FOR_SCRAPING || 'true').toLowerCase() === 'true';

const SCRAPING_DAILY_LIMIT = Number(process.env.SCRAPING_DAILY_LIMIT || 10);
const SCRAPING_DAILY_LIMIT_ADMIN = Number(process.env.SCRAPING_DAILY_LIMIT_ADMIN || 0);

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
  
  // Solo existe un tipo: 'scraping' (cualquier consulta que requiera scraping)
  if (type === 'scraping') {
    return isAdmin ? SCRAPING_DAILY_LIMIT_ADMIN : SCRAPING_DAILY_LIMIT;
  }

  return 0;
}

async function consumeQuota(req, type, amount = 1) {
  if (!SCRAPING_LIMITS_ENABLED) {
    return { ok: true, skipped: true };
  }

  if (type === 'scraping' && !SCRAPING_REQUIRE_AUTH_FOR_SCRAPING) {
    return { ok: true, skipped: true };
  }

  const userResult = await resolveCurrentUser(req);
  console.log(`🔐 [consumeQuota] User resolution result:`, { ok: userResult.ok, role: userResult.user?.role, message: userResult.message });
  
  if (!userResult.ok) {
    console.warn(`⚠️ [consumeQuota] No user resolved, returning:`, userResult.message);
    return userResult;
  }

  const { user } = userResult;
  console.log(`✅ [consumeQuota] User authenticated: ${user.email}, role: ${user.role}, type: ${type}`);
  
  // Admin SIEMPRE tiene acceso ilimitado, sin importar configuración
  if (user.role === 'admin') {
    console.log(`👑 [consumeQuota] Admin bypass granted for ${user.email}`);
    return { ok: true, user, adminBypass: true, unlimited: true };
  }
  
  const limit = getLimitByType(user, type);

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
      scrapingCount: 0,
    });
  }

  const current = row.scrapingCount;
  if (current + amount > limit) {
    const remaining = Math.max(0, limit - current);

    return {
      ok: false,
      status: 429,
      message: `Límite diario de scraping alcanzado (10/día). Disponible hoy: ${remaining}. Puedes consultar cartas ya en caché sin límite.`,
      remaining,
      limit,
      type,
    };
  }

  row.scrapingCount += amount;
  await quotaRepo.save(row);

  return {
    ok: true,
    user,
    used: row.scrapingCount,
    limit,
    remaining: Math.max(0, limit - row.scrapingCount),
  };
}

module.exports = {
  consumeQuota,
};
