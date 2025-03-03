const { Client, LocalAuth } = require("whatsapp-web.js");
const qrcode = require("qrcode-terminal");
const config = require("../config/config");
const messageHandler = require("../handlers/messageHandler");
const commandHandler = require("../handlers/commandHandler");
const contextManager = require("../utils/contextManager");
const logger = require("../utils/logger");

let client;

/**
 * Inicializa el cliente de WhatsApp
 */
function initialize() {
  // Configurar cliente
  client = new Client({
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

  // Evento: Código QR para autenticación
  client.on("qr", (qr) => {
    logger.info("Generando código QR para autenticación");
    qrcode.generate(qr, { small: true });
    console.log("📱 Escanea el código QR para iniciar sesión");
  });

  // Evento: Autenticación exitosa
  client.on("authenticated", () => {
    logger.info("Cliente autenticado correctamente");
  });

  // Evento: Cliente listo
  client.on("ready", () => {
    logger.info("Cliente de WhatsApp conectado y listo");
    printStartupInfo();
  });

  // Evento: Mensajes recibidos
  client.on("message", async (msg) => {
    await messageHandler.handleIncomingMessage(client, msg);
  });

  // Evento: Mensajes creados (por el propio cliente)
  client.on("message_create", async (msg) => {
    // Solo procesar mensajes enviados al grupo de comandos
    if (msg.to === config.COMMAND_GROUP && msg.fromMe) {
      // Verificar que sea un comando
      if (msg.body.startsWith("!")) {
        const operatorId = config.OPERATORS[0]; // Usamos el primer operador como default
        logger.debug(`Comando propio detectado: ${msg.body}`);

        try {
          const response = await commandHandler.handleCommand(
            msg.body,
            operatorId
          );
          await client.sendMessage(config.COMMAND_GROUP, response);
        } catch (error) {
          logger.error(`Error procesando comando: ${error.message}`);
          await client.sendMessage(
            config.COMMAND_GROUP,
            `❌ Error: ${error.message}`
          );
        }
      }
    }
  });

  // Evento: Desconexión
  client.on("disconnected", (reason) => {
    logger.warn(`Cliente desconectado: ${reason}`);
    // Intentar reconectar automáticamente después de 10 segundos
    setTimeout(() => {
      logger.info("Intentando reconexión...");
      client.initialize();
    }, 10000);
  });

  // Evento: Cambios de estado de conexión
  client.on("change_state", (state) => {
    logger.debug(`Estado cambiado: ${state}`);
  });

  // Evento: Error
  client.on("error", (error) => {
    logger.error(`Error del cliente: ${error.message}`);
  });

  // Iniciar cliente
  logger.info("Iniciando cliente de WhatsApp...");
  client.initialize();

  // Configurar limpieza periódica de contextos
  contextManager.setupCleanupInterval();
}

/**
 * Muestra información al iniciar el sistema
 */
function printStartupInfo() {
  console.log("\n=== SISTEMA INICIADO ===");
  console.log("✅ Cliente conectado y listo");
  console.log(`👥 Operadores: ${config.OPERATORS.join(", ")}`);
  console.log(`📝 Número de pruebas: ${config.TEST_NUMBER}`);
  console.log(`💬 Grupo de comandos: ${config.COMMAND_GROUP}`);
  console.log(`🤖 Modelo IA: ${config.AI_SETTINGS.model}`);
  console.log(
    `⏰ Horario: ${config.SCHEDULE.BUSINESS_HOURS.start}:00 a ${config.SCHEDULE.BUSINESS_HOURS.end}:00`
  );
  console.log(
    "❗ Bot inicialmente pausado. Usa !activar en el grupo para iniciarlo\n"
  );
}

/**
 * Obtiene el cliente de WhatsApp
 */
function getClient() {
  return client;
}

module.exports = {
  initialize,
  getClient,
};
