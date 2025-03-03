const config = require("../config/config");

// Función para obtener un número aleatorio en un rango
function getRandomDelay(min, max) {
  return Math.floor(Math.random() * (max - min + 1) + min);
}

// Función para calcular un tiempo de escritura realista
function calculateTypingTime(text) {
  if (!text) return 0;

  const { TYPING_SPEED, MIN_DELAY, MAX_ADDITIONAL_DELAY } =
    config.DELAY_SETTINGS.AI_REPLY_DELAY;

  // Tiempo base basado en la longitud del texto y velocidad de escritura
  const charactersPerSecond = TYPING_SPEED / 60;
  let typingTime = text.length / charactersPerSecond;

  // Aplicamos un mínimo de tiempo y añadimos un tiempo aleatorio adicional
  typingTime = Math.max(typingTime, MIN_DELAY * 1000);
  const additionalTime = getRandomDelay(0, MAX_ADDITIONAL_DELAY * 1000);

  return typingTime + additionalTime;
}

// Función para calcular tiempo de lectura simulado
function calculateReadingTime(text) {
  const { MIN, MAX } = config.DELAY_SETTINGS.AI_REPLY_DELAY.READING_TIME;
  const baseTime = getRandomDelay(MIN, MAX) * 1000;

  // Ajustamos según longitud del texto si es muy largo
  if (text && text.length > 200) {
    const additionalTime = Math.floor(text.length / 200) * 1000;
    return baseTime + additionalTime;
  }

  return baseTime;
}

// Función para calcular delay para respuesta automática
function getAutoReplyDelay() {
  const { MIN, MAX } = config.DELAY_SETTINGS.AUTO_REPLY_DELAY;
  return getRandomDelay(MIN, MAX) * 1000;
}

// Función para esperar un tiempo específico
function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Función principal para manejar delays de respuestas
async function getHumanLikeDelay(message, response) {
  // Tiempo de lectura simulado
  const readingTime = calculateReadingTime(message);

  // Tiempo de escritura simulado
  const typingTime = calculateTypingTime(response);

  // Tiempo total
  const totalDelay = readingTime + typingTime;

  return totalDelay;
}

module.exports = {
  getHumanLikeDelay,
  getAutoReplyDelay,
  wait,
};
