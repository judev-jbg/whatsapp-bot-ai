const { Client, LocalAuth } = require("whatsapp-web.js");
const { Configuration, OpenAIApi } = require("openai");
const qrcode = require("qrcode-terminal");

// Configuración
const CONFIG = {
  OPERATORS: ["34663142955@c.us"],
  TEST_NUMBER: "34624808492@c.us",
  COMMAND_GROUP: "120363402261895499@g.us",
  BOT_ENABLED: false,
};

const client = new Client({
  authStrategy: new LocalAuth({
    clientId: "whatsapp-bot-operator",
  }),
  puppeteer: {
    headless: true,
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-gpu",
      "--disable-dev-shm-usage",
    ],
  },
});

// Función para verificar si un número es operador
function isOperator(number) {
  if (!number) return false;
  return CONFIG.OPERATORS.includes(number);
}

// Procesa comandos del operador (enviados por nosotros mismos)
client.on("message_create", async (msg) => {
  // Solo procesar mensajes del grupo de comandos
  if (msg.to === CONFIG.COMMAND_GROUP) {
    // Verificar que sea un comando enviado por un operador
    const senderId = msg.author || msg.from;

    if (msg.fromMe && isOperator(senderId) && msg.body.startsWith("!")) {
      console.log("DEBUG - Comando detectado (mensaje propio):", {
        operador: senderId,
        comando: msg.body,
      });

      try {
        const response = await handleCommand(msg.body, senderId);
        await client.sendMessage(CONFIG.COMMAND_GROUP, response);
      } catch (error) {
        console.error("ERROR - Error procesando comando (propio):", error);
        await client.sendMessage(
          CONFIG.COMMAND_GROUP,
          `❌ Error: ${error.message}`
        );
      }
    }
  }
});

// Procesa mensajes entrantes (de otros)
client.on("message", async (msg) => {
  // Evitar procesar mensajes antiguos al iniciar
  const messageTimestamp = msg.timestamp * 1000;
  const now = Date.now();
  if (now - messageTimestamp > 60000) {
    return;
  }

  // Para mensajes del grupo de comandos de otros operadores
  if (msg.from === CONFIG.COMMAND_GROUP) {
    const authorId = msg.author;

    if (isOperator(authorId) && msg.body.startsWith("!")) {
      console.log("DEBUG - Comando detectado (mensaje entrante):", {
        operador: authorId,
        comando: msg.body,
      });

      try {
        const response = await handleCommand(msg.body, authorId);
        await client.sendMessage(CONFIG.COMMAND_GROUP, response);
      } catch (error) {
        console.error("ERROR - Error procesando comando (entrante):", error);
        await client.sendMessage(
          CONFIG.COMMAND_GROUP,
          `❌ Error: ${error.message}`
        );
      }
    }
    return;
  }

  // No procesar mensajes de operadores fuera del grupo
  const senderId = msg.author || msg.from;
  if (isOperator(senderId)) {
    return;
  }

  // Procesar mensajes regulares si corresponde
  if (CONFIG.BOT_ENABLED || senderId === CONFIG.TEST_NUMBER) {
    await handleRegularMessage(msg);
  }
});

async function handleCommand(command, operatorId) {
  console.log("DEBUG - Procesando comando:", {
    comando: command,
    operador: operatorId,
  });

  switch (command.toLowerCase()) {
    case "!activar":
      CONFIG.BOT_ENABLED = true;
      return `🤖 Bot activado globalmente por operador ${operatorId}`;

    case "!pausar":
      CONFIG.BOT_ENABLED = false;
      return `🤖 Bot pausado globalmente por operador ${operatorId}`;

    case "!estado":
      return `📊 Estado del sistema:
- Bot: ${CONFIG.BOT_ENABLED ? "Activado" : "Pausado"}
- Modo pruebas: ${CONFIG.TEST_NUMBER}
- Operadores: ${CONFIG.OPERATORS.join(", ")}
- Grupo comandos: ${CONFIG.COMMAND_GROUP}
- Hora: ${new Date().toLocaleString()}`;

    default:
      return "❓ Comando no reconocido. Comandos disponibles: !activar, !pausar, !estado";
  }
}

async function handleRegularMessage(msg) {
  console.log("DEBUG - Procesando mensaje regular de:", msg.from);
  const response = await processWithAI(msg.body);
  console.log("DEBUG - Enviando respuesta:", response);
  await client.sendMessage(msg.from, response);
}

async function processWithAI(message) {
  // Aquí implementarías la integración con OpenAI
  console.log("DEBUG - Procesando con IA:", message);
  return "Respuesta procesada por IA (Mensaje de prueba)";
}

// Eventos de inicio y error
client.on("qr", (qr) => {
  qrcode.generate(qr, { small: true });
  console.log("📱 Escanea el código QR para iniciar sesión");
});

client.on("authenticated", () => {
  console.log("DEBUG - Cliente autenticado");
});

client.on("ready", () => {
  console.log("\n=== SISTEMA INICIADO ===");
  console.log("✅ Cliente conectado y listo");
  console.log(`👥 Operadores: ${CONFIG.OPERATORS.join(", ")}`);
  console.log(`📝 Número de pruebas: ${CONFIG.TEST_NUMBER}`);
  console.log(`💬 Grupo de comandos: ${CONFIG.COMMAND_GROUP}`);
  console.log(
    "❗ Bot inicialmente pausado. Usa !activar en el grupo para iniciarlo\n"
  );
});

client.on("disconnected", (reason) => {
  console.log("DEBUG - Cliente desconectado:", reason);
  client.initialize();
});

console.log("DEBUG - Iniciando cliente...");
client.initialize();
