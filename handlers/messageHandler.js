const config = require("../config/config");
const openaiService = require("../services/openai");
const businessHours = require("./businessHoursHandler");
const contextManager = require("../utils/contextManager");
const delays = require("../utils/delays");
const logger = require("../utils/logger");

/**
 * Procesa un mensaje entrante y determina la acción adecuada
 */
async function handleIncomingMessage(client, msg) {
  const chatId = msg.from;
  const senderId = msg.author || msg.from;

  // No procesar mensajes de grupos excepto el grupo de comandos
  if (msg.isGroupMsg && msg.from !== config.COMMAND_GROUP) {
    return;
  }

  // No procesar mensajes muy antiguos
  const messageTimestamp = msg.timestamp * 1000;
  if (Date.now() - messageTimestamp > 60000) {
    return;
  }

  // No procesar mensajes de operadores fuera del grupo de comandos
  if (isOperator(senderId) && msg.from !== config.COMMAND_GROUP) {
    return;
  }

  logger.info(
    `Mensaje recibido de ${chatId}: ${msg.body.substring(0, 50)}${
      msg.body.length > 50 ? "..." : ""
    }`
  );

  // Si el chat ya está esperando una respuesta, añadir este mensaje a la cola
  if (contextManager.isPendingResponse(chatId)) {
    contextManager.addPendingMessage(chatId, msg.body);
    return;
  }

  // Verificar horario comercial
  const isWithinBusinessHours = await businessHours.isBusinessHours();

  // Si estamos fuera de horario comercial
  if (!isWithinBusinessHours) {
    await handleOutOfBusinessHours(client, chatId);
    return;
  }

  // Si el bot no está habilitado y no es número de prueba, ignorar
  if (!config.BOT_ENABLED && senderId !== config.TEST_NUMBER) {
    return;
  }

  // Añadir mensaje a la cola pendiente
  contextManager.addPendingMessage(chatId, msg.body);

  // Marcar el chat como esperando respuesta
  contextManager.markPendingResponse(chatId, true);

  // Iniciar temporizador para procesar mensajes
  contextManager.startProcessTimer(chatId, async (chatId, messages) => {
    await processGroupedMessages(client, chatId, messages);
  });
}

/**
 * Maneja mensajes fuera del horario comercial
 */
async function handleOutOfBusinessHours(client, chatId) {
  // Si ya fue notificado, no enviar mensaje nuevamente
  if (contextManager.isOutOfHoursNotified(chatId)) {
    return;
  }

  // Aplicar delay para que parezca más natural
  const delayMs = delays.getAutoReplyDelay();
  logger.info(
    `Enviando mensaje fuera de horario a ${chatId} con delay de ${delayMs}ms`
  );

  await delays.wait(delayMs);

  // Enviar mensaje automático
  await client.sendMessage(chatId, config.SCHEDULE.OUT_OF_HOURS_MESSAGE);

  // Marcar como notificado
  contextManager.markAsOutOfHoursNotified(chatId);
}

/**
 * Procesa mensajes agrupados y genera respuesta
 */
async function processGroupedMessages(client, chatId, messages) {
  try {
    logger.info(
      `Procesando ${messages.length} mensajes agrupados de ${chatId}`
    );

    // Detectar si hay múltiples preguntas
    const hasMultipleQuestions =
      messages.length > 1 ||
      messages.some((msg) => openaiService.detectMultipleQuestions(msg));

    // Obtener respuesta de la IA
    const response = await openaiService.processWithAI(messages, chatId);

    // Calcular delay basado en la longitud del mensaje y respuesta
    const combinedMessages = messages.join("\n");
    const delayMs = await delays.getHumanLikeDelay(combinedMessages, response);

    logger.info(
      `Respuesta generada para ${chatId}, esperando ${delayMs}ms antes de enviar`
    );
    await delays.wait(delayMs);

    // Enviar respuesta
    await client.sendMessage(chatId, response);

    // Desmarcar el chat como pendiente
    contextManager.markPendingResponse(chatId, false);
  } catch (error) {
    logger.error(`Error al procesar mensajes de ${chatId}: ${error.message}`);

    // Intentar enviar mensaje de error genérico
    try {
      await delays.wait(1000); // Breve delay antes de mensaje de error
      await client.sendMessage(
        chatId,
        "Lo siento, tuve un problema al procesar tu mensaje. ¿Podrías intentarlo de nuevo más tarde?"
      );
    } catch (sendError) {
      logger.error(`Error al enviar mensaje de error: ${sendError.message}`);
    }

    // Notificar al grupo de operadores si hay un error grave
    if (error.response && error.response.status) {
      notifyOperatorsAboutError(client, chatId, error);
    }

    // Liberar el estado pendiente
    contextManager.markPendingResponse(chatId, false);
  }
}

/**
 * Notifica a los operadores sobre errores
 */
async function notifyOperatorsAboutError(client, chatId, error) {
  try {
    const errorMessage =
      `⚠️ Error al procesar mensaje de ${chatId}:\n` +
      `Código: ${error.response?.status || "N/A"}\n` +
      `Mensaje: ${error.message}`;

    await client.sendMessage(config.COMMAND_GROUP, errorMessage);
  } catch (notifyError) {
    logger.error(`Error al notificar a operadores: ${notifyError.message}`);
  }
}

/**
 * Verifica si un número es operador
 */
function isOperator(number) {
  if (!number) return false;
  return config.OPERATORS.includes(number);
}

module.exports = {
  handleIncomingMessage,
};
