const config = require("../config/config");

// Mapa para mantener contexto de conversaciones
const conversationContexts = new Map();

// Mapa para agrupar mensajes consecutivos
const pendingMessages = new Map();

// Mapa para recordar a quién ya se envió mensaje fuera de horario
const outOfHoursNotified = new Map();

// Obtener o crear contexto de conversación
function getConversationContext(chatId) {
  if (!conversationContexts.has(chatId)) {
    conversationContexts.set(chatId, {
      messages: [
        {
          role: "system",
          content: config.AI_SETTINGS.system_prompt,
        },
      ],
      lastInteraction: Date.now(),
      pendingResponse: false,
    });
  }
  return conversationContexts.get(chatId);
}

// Agregar mensaje al contexto
function addMessageToContext(chatId, role, content) {
  const context = getConversationContext(chatId);
  context.messages.push({ role, content });
  context.lastInteraction = Date.now();

  // Mantener el contexto a un tamaño manejable
  while (context.messages.length > 15) {
    // Mantener el mensaje del sistema y eliminar los más antiguos
    if (context.messages[0].role === "system") {
      context.messages.splice(1, 1);
    } else {
      context.messages.shift();
    }
  }
}

// Comprobar si un número ya fue notificado fuera de horario
function isOutOfHoursNotified(chatId) {
  return outOfHoursNotified.has(chatId);
}

// Marcar un número como notificado fuera de horario
function markAsOutOfHoursNotified(chatId) {
  outOfHoursNotified.set(chatId, Date.now());
}

// Resetear notificación fuera de horario
function resetOutOfHoursNotification(chatId) {
  outOfHoursNotified.delete(chatId);
}

// Agregar mensaje a la cola pendiente
function addPendingMessage(chatId, message) {
  if (!pendingMessages.has(chatId)) {
    pendingMessages.set(chatId, {
      messages: [message],
      timer: null,
    });
  } else {
    const pending = pendingMessages.get(chatId);
    pending.messages.push(message);

    // Resetear el temporizador si ya existía uno
    if (pending.timer) {
      clearTimeout(pending.timer);
    }
  }
}

// Obtener y limpiar mensajes pendientes
function getPendingMessages(chatId) {
  if (!pendingMessages.has(chatId)) {
    return null;
  }

  const pending = pendingMessages.get(chatId);
  const messages = [...pending.messages];

  // Limpiar
  pendingMessages.delete(chatId);

  return messages;
}

// Iniciar temporizador para procesar mensajes pendientes
function startProcessTimer(chatId, callback) {
  if (!pendingMessages.has(chatId)) {
    return;
  }

  const pending = pendingMessages.get(chatId);
  const waitTime = config.DELAY_SETTINGS.MESSAGE_GROUPING.WAIT_TIME * 1000;

  // Establecer temporizador
  pending.timer = setTimeout(() => {
    const messages = getPendingMessages(chatId);
    if (messages && messages.length > 0) {
      callback(chatId, messages);
    }
  }, waitTime);
}

// Marcar chat como pendiente de respuesta
function markPendingResponse(chatId, isPending) {
  const context = getConversationContext(chatId);
  context.pendingResponse = isPending;
}

// Verificar si un chat está esperando respuesta
function isPendingResponse(chatId) {
  const context = getConversationContext(chatId);
  return context.pendingResponse;
}

// Limpiar contextos antiguos periódicamente
function setupCleanupInterval() {
  setInterval(() => {
    const now = Date.now();
    const MAX_AGE = 6 * 60 * 60 * 1000; // 6 horas

    conversationContexts.forEach((context, chatId) => {
      if (now - context.lastInteraction > MAX_AGE) {
        conversationContexts.delete(chatId);
        console.log(`Contexto eliminado para chat ${chatId} por inactividad`);
      }
    });

    // También limpiar notificaciones de fuera de horario antiguas
    outOfHoursNotified.forEach((timestamp, chatId) => {
      if (now - timestamp > 12 * 60 * 60 * 1000) {
        // 12 horas
        outOfHoursNotified.delete(chatId);
      }
    });
  }, 30 * 60 * 1000); // Verificar cada 30 minutos
}

module.exports = {
  getConversationContext,
  addMessageToContext,
  isOutOfHoursNotified,
  markAsOutOfHoursNotified,
  resetOutOfHoursNotification,
  addPendingMessage,
  getPendingMessages,
  startProcessTimer,
  markPendingResponse,
  isPendingResponse,
  setupCleanupInterval,
  getStats: () => ({
    activeContexts: conversationContexts.size,
    pendingChats: pendingMessages.size,
    outOfHoursNotified: outOfHoursNotified.size,
  }),
};
