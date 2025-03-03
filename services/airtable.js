const axios = require("axios");
const config = require("../config/config");
const logger = require("../utils/logger");

// Cache de fechas festivas
let holidayCache = {
  dates: [],
  lastFetched: null,
};

/**
 * Obtiene las fechas festivas desde Airtable
 * @returns {Promise<string[]>} Array de fechas en formato YYYY-MM-DD
 */
async function getHolidays() {
  // Si tenemos un caché válido y fue obtenido en las últimas 24 horas, usar eso
  if (
    holidayCache.dates.length > 0 &&
    holidayCache.lastFetched &&
    Date.now() - holidayCache.lastFetched < 24 * 60 * 60 * 1000
  ) {
    logger.debug(
      `Usando caché de festivos con ${holidayCache.dates.length} fechas`
    );
    return holidayCache.dates;
  }

  // Si no hay API key configurada, devolver array vacío
  if (!config.SCHEDULE.AIRTABLE.API_KEY || !config.SCHEDULE.AIRTABLE.BASE_ID) {
    logger.warn("Airtable no configurado, omitiendo festivos");
    return [];
  }

  try {
    const url = `https://api.airtable.com/v0/${
      config.SCHEDULE.AIRTABLE.BASE_ID
    }/${encodeURIComponent(config.SCHEDULE.AIRTABLE.TABLE_NAME)}`;

    logger.debug(`Consultando Airtable: ${url}`);

    const response = await axios.get(url, {
      headers: {
        Authorization: `Bearer ${config.SCHEDULE.AIRTABLE.API_KEY}`,
      },
      params: {
        view: config.SCHEDULE.AIRTABLE.VIEW_NAME,
      },
    });

    // Extraer fechas del formato de Airtable
    const holidays = response.data.records
      .filter((record) => record.fields.fecha && !record.fields.atendemos) // Filtra por fecha y que no esté checked
      .map((record) => {
        // Convertir de ISO a YYYY-MM-DD
        const date = new Date(record.fields.Fecha);
        return date.toISOString().split("T")[0];
      });

    // Actualizar caché
    holidayCache = {
      dates: holidays,
      lastFetched: Date.now(),
    };

    logger.info(`Festivos cargados desde Airtable: ${holidays.length}`);
    return holidays;
  } catch (error) {
    logger.error(`Error obteniendo festivos de Airtable: ${error.message}`);
    // Devolver caché anterior si existe, o array vacío
    return holidayCache.dates || [];
  }
}

/**
 * Fuerza una actualización del caché de festivos
 */
async function refreshHolidayCache() {
  logger.info("Forzando actualización de caché de festivos");
  holidayCache.lastFetched = null;
  await getHolidays();
}

module.exports = {
  getHolidays,
  refreshHolidayCache,
};
