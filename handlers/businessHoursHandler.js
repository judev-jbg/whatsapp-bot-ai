const config = require("../config/config");
const airtableService = require("../services/airtable");
const logger = require("../utils/logger");

// Cache de resultado de horario comercial
let businessHoursCache = {
  isWithinHours: null,
  cachedUntil: null,
};

/**
 * Verifica si estamos dentro del horario comercial
 * @returns {Promise<boolean>} True si estamos en horario comercial
 */
async function isBusinessHours() {
  // Usar caché si está disponible (válido por 5 minutos)
  const now = Date.now();
  if (businessHoursCache.cachedUntil && now < businessHoursCache.cachedUntil) {
    return businessHoursCache.isWithinHours;
  }

  try {
    // Obtener fecha y hora actuales
    const currentDate = new Date();
    const hour = currentDate.getHours();
    const dayOfWeek = currentDate.getDay(); // 0=Domingo, 1=Lunes, etc.

    // Verificar día de la semana
    if (!config.SCHEDULE.BUSINESS_DAYS.includes(dayOfWeek)) {
      cacheResult(false);
      return false;
    }

    // Verificar hora del día
    if (
      hour < config.SCHEDULE.BUSINESS_HOURS.start ||
      hour >= config.SCHEDULE.BUSINESS_HOURS.end
    ) {
      cacheResult(false);
      return false;
    }

    // Verificar si es un día festivo
    const holidays = await airtableService.getHolidays();
    const today = currentDate.toISOString().split("T")[0]; // formato YYYY-MM-DD

    if (holidays.includes(today)) {
      logger.info(`Hoy es día festivo (${today})`);
      cacheResult(false);
      return false;
    }

    // Si pasó todas las verificaciones, estamos en horario comercial
    cacheResult(true);
    return true;
  } catch (error) {
    logger.error(`Error verificando horario comercial: ${error.message}`);
    // En caso de error, asumimos que estamos en horario comercial para no bloquear
    return true;
  }
}

/**
 * Guarda el resultado en caché por 5 minutos
 */
function cacheResult(result) {
  businessHoursCache = {
    isWithinHours: result,
    cachedUntil: Date.now() + 5 * 60 * 1000, // 5 minutos
  };
}

module.exports = {
  isBusinessHours,
};
