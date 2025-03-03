// Niveles de log
const LOG_LEVELS = {
  DEBUG: 0,
  INFO: 1,
  WARN: 2,
  ERROR: 3,
};

// Configuración
const config = {
  level: process.env.LOG_LEVEL || "INFO",
  showTimestamp: true,
  logToFile: false,
  logFilePath: "./logs/app.log",
};

// Obtener nivel numérico actual
function getCurrentLevel() {
  const configLevel = config.level.toUpperCase();
  return LOG_LEVELS[configLevel] || LOG_LEVELS.INFO;
}

// Formatear mensaje
function formatMessage(level, message) {
  const timestamp = config.showTimestamp
    ? `[${new Date().toISOString()}] `
    : "";
  return `${timestamp}${level}: ${message}`;
}

// Escribir mensaje en consola
function log(level, message) {
  const currentLevel = getCurrentLevel();
  const messageLevel = LOG_LEVELS[level];

  if (messageLevel >= currentLevel) {
    const formattedMessage = formatMessage(level, message);

    switch (level) {
      case "ERROR":
        console.error(formattedMessage);
        break;
      case "WARN":
        console.warn(formattedMessage);
        break;
      case "INFO":
        console.info(formattedMessage);
        break;
      default:
        console.log(formattedMessage);
    }
  }
}

// Funciones públicas
module.exports = {
  debug: (message) => log("DEBUG", message),
  info: (message) => log("INFO", message),
  warn: (message) => log("WARN", message),
  error: (message) => log("ERROR", message),

  // Configuración
  setLevel: (level) => {
    if (LOG_LEVELS[level.toUpperCase()] !== undefined) {
      config.level = level.toUpperCase();
    }
  },

  showTimestamp: (show) => {
    config.showTimestamp = show;
  },
};
