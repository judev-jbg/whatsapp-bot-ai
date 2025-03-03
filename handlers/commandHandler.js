const config = require("../config/config");
const contextManager = require("../utils/contextManager");
const businessHours = require("./businessHoursHandler");
const airtableService = require("../services/airtable");
const logger = require("../utils/logger");

/**
 * Procesa comandos de operadores
 * @param {string} command - Comando completo
 * @param {string} operatorId - ID del operador
 * @returns {Promise<string>} - Respuesta al comando
 */
async function handleCommand(command, operatorId) {
  logger.info(`Procesando comando: ${command} de operador ${operatorId}`);

  const parts = command.split(" ");
  const cmd = parts[0].toLowerCase();

  switch (cmd) {
    case "!activar":
      config.BOT_ENABLED = true;
      return `🤖 Bot activado globalmente por operador ${operatorId}`;

    case "!pausar":
      config.BOT_ENABLED = false;
      return `🤖 Bot pausado globalmente por operador ${operatorId}`;

    case "!estado":
      return await getStatusInfo();

    case "!temp":
      return updateTemperature(parts[1]);

    case "!prompt":
      return updateSystemPrompt(command);

    case "!reset":
      return resetChatContext(parts[1]);

    case "!mensaje":
      return updateOutOfHoursMessage(command);

    case "!horario":
      return updateBusinessHours(parts[1], parts[2]);

    case "!festivos":
      return await refreshHolidays();

    case "!ayuda":
    default:
      return getHelpText();
  }
}

/**
 * Obtiene información completa del estado del sistema
 */
async function getStatusInfo() {
  const stats = contextManager.getStats();
  const businessHoursStatus = await businessHours.isBusinessHours();

  return `📊 Estado del sistema:
- Bot: ${config.BOT_ENABLED ? "✅ Activado" : "❌ Pausado"}
- Horario comercial: ${businessHoursStatus ? "✅ Dentro" : "❌ Fuera"} 
- Horario: ${config.SCHEDULE.BUSINESS_HOURS.start}:00 a ${
    config.SCHEDULE.BUSINESS_HOURS.end
  }:00
- Modo pruebas: ${config.TEST_NUMBER}
- Operadores: ${config.OPERATORS.join(", ")}
- Modelo IA: ${config.AI_SETTINGS.model}
- Temperatura: ${config.AI_SETTINGS.temperature}
- Chats activos: ${stats.activeContexts}
- Chats pendientes: ${stats.pendingChats}
- Notificados fuera horario: ${stats.outOfHoursNotified}
- Hora del servidor: ${new Date().toLocaleString()}`;
}

/**
 * Actualiza la temperatura del modelo de IA
 */
function updateTemperature(tempValue) {
  const temp = parseFloat(tempValue);
  if (isNaN(temp) || temp < 0 || temp > 1) {
    return "❌ Valor incorrecto. Usa !temp [0-1], ejemplo: !temp 0.7";
  }
  config.AI_SETTINGS.temperature = temp;
  return `🔧 Temperatura de IA ajustada a ${temp}`;
}

/**
 * Actualiza el prompt del sistema
 */
function updateSystemPrompt(command) {
  const newPrompt = command.substring(command.indexOf(" ") + 1);
  if (newPrompt.length < 10) {
    return "❌ Prompt demasiado corto. Debe tener al menos 10 caracteres.";
  }
  config.AI_SETTINGS.system_prompt = newPrompt;
  return `✅ Prompt del sistema actualizado.`;
}

/**
 * Resetea el contexto de un chat específico
 */
function resetChatContext(numberToReset) {
  if (!numberToReset) {
    return "❌ Formato incorrecto. Usa !reset [número], ejemplo: !reset 1234567890";
  }
  const chatIdToReset = `${numberToReset}@c.us`;
  contextManager.getConversationContext(chatIdToReset);
  contextManager.resetOutOfHoursNotification(chatIdToReset);
  return `🔄 Contexto reseteado para ${chatIdToReset}`;
}

/**
 * Actualiza el mensaje fuera de horario
 */
function updateOutOfHoursMessage(command) {
  const newMessage = command.substring(command.indexOf(" ") + 1);
  if (newMessage.length < 20) {
    return "❌ Mensaje demasiado corto. Debe tener al menos 20 caracteres.";
  }
  config.SCHEDULE.OUT_OF_HOURS_MESSAGE = newMessage;
  return `✅ Mensaje fuera de horario actualizado.`;
}

/**
 * Actualiza el horario comercial
 */
function updateBusinessHours(startHour, endHour) {
  const start = parseInt(startHour);
  const end = parseInt(endHour);

  if (
    isNaN(start) ||
    isNaN(end) ||
    start < 0 ||
    start > 23 ||
    end < 0 ||
    end > 24 ||
    start >= end
  ) {
    return "❌ Horario inválido. Inicio y fin deben ser horas válidas (0-23) y fin debe ser mayor que inicio.";
  }

  config.SCHEDULE.BUSINESS_HOURS.start = start;
  config.SCHEDULE.BUSINESS_HOURS.end = end;

  return `⏰ Horario comercial actualizado: ${start}:00 a ${end}:00`;
}

/**
 * Fuerza actualización de festivos desde Airtable
 */
async function refreshHolidays() {
  try {
    await airtableService.refreshHolidayCache();
    const holidays = await airtableService.getHolidays();
    return `🗓️ Festivos actualizados: ${holidays.length} días cargados`;
  } catch (error) {
    return `❌ Error actualizando festivos: ${error.message}`;
  }
}

/**
 * Texto de ayuda con todos los comandos disponibles
 */
function getHelpText() {
  return `📝 Comandos disponibles:

!activar - Activa el bot globalmente
!pausar - Pausa el bot globalmente
!estado - Muestra estado del sistema
!temp [0-1] - Ajusta temperatura de IA
!prompt [texto] - Actualiza el prompt del sistema
!reset [número] - Resetea el contexto de un número
!mensaje [texto] - Actualiza mensaje fuera de horario
!horario [inicio] [fin] - Actualiza horario comercial (horas)
!festivos - Actualiza caché de festivos
!ayuda - Muestra esta ayuda`;
}

/**
 * Verifica si un número es operador autorizado
 */
function isOperator(number) {
  if (!number) return false;
  return config.OPERATORS.includes(number);
}

module.exports = {
  handleCommand,
  isOperator,
};
