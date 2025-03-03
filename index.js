/**
 * Punto de entrada principal para el bot de WhatsApp con IA
 */
require("dotenv").config();
const whatsappService = require("./services/whatsapp");
const openaiService = require("./services/openai");
const logger = require("./utils/logger");

// Configurar nivel de log
if (process.env.LOG_LEVEL) {
  logger.setLevel(process.env.LOG_LEVEL);
}

// Banner de inicio
function printBanner() {
  console.log(`
    ╔═══════════════════════════════════════════════╗
    ║                                               ║
    ║   WhatsApp Business AI Assistant              ║
    ║   Versión 1.0.0                               ║
    ║                                               ║
    ║   - Respuestas automatizadas                  ║
    ║   - Integración con OpenAI                    ║
    ║   - Control de horario comercial              ║
    ║   - Gestión de operadores                     ║
    ║                                               ║
    ╚═══════════════════════════════════════════════╝
    `);
}

// Verificar configuración
function checkEnvironment() {
  const requiredVars = ["OPENAI_API_KEY"];
  const missing = requiredVars.filter((varName) => !process.env[varName]);

  if (missing.length > 0) {
    logger.warn(`Variables de entorno faltantes: ${missing.join(", ")}`);
    logger.warn("Algunas funcionalidades podrían no estar disponibles");
  }

  // Verificar variables opcionales
  if (!process.env.AIRTABLE_API_KEY || !process.env.AIRTABLE_BASE_ID) {
    logger.warn(
      "Configuración de Airtable no encontrada. La función de festivos no estará disponible."
    );
  }
}

// Función principal de inicio
async function start() {
  try {
    printBanner();
    checkEnvironment();

    // Inicializar servicios
    logger.info("Inicializando servicios...");

    // Inicializar OpenAI con información de la empresa
    openaiService.init();

    // Inicializar cliente de WhatsApp
    whatsappService.initialize();

    // Registrar manejador para cierre ordenado
    setupShutdownHandler();

    logger.info("Servicios inicializados correctamente");
  } catch (error) {
    logger.error(`Error al iniciar la aplicación: ${error.message}`);
    process.exit(1);
  }
}

// Configurar manejador para cierre ordenado
function setupShutdownHandler() {
  process.on("SIGINT", async () => {
    logger.info("Señal de cierre recibida, finalizando...");
    try {
      const client = whatsappService.getClient();
      if (client) {
        logger.info("Cerrando sesión de WhatsApp...");
        // Dar tiempo para que se complete la conexión si aún está iniciando
        await new Promise((resolve) => setTimeout(resolve, 1000));
        await client.destroy();
        logger.info("Sesión de WhatsApp cerrada correctamente");
      }
    } catch (error) {
      logger.error(`Error al cerrar: ${error.message}`);
    }
    process.exit(0);
  });
}

// Iniciar aplicación
start();
