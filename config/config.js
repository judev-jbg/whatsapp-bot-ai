// Configuración centralizada del sistema
require("dotenv").config();

module.exports = {
  // Configuración de operadores y WhatsApp
  OPERATORS: [process.env.OPERATORS],
  TEST_NUMBER: process.env.TEST_NUMBER,
  COMMAND_GROUP: process.env.COMMAND_GROUP,
  BOT_ENABLED: false,

  // Configuración de IA
  AI_SETTINGS: {
    model: "gpt-3.5-turbo",
    temperature: 0.7,
    max_tokens: 150,
    system_prompt: `Eres un asistente amable y profesional que trabaja para Nombre-de-tu-Empresa. Debes simular ser un agente humano.

Información de la empresa:
- Nombre: [Nombre de tu empresa]
- Productos/Servicios: [Descripción de productos/servicios]
- Horario de atención: lunes a viernes de 8:00 a 16:00
- Sitio web: [URL de tu sitio]
- Correo de contacto: [email]
- Teléfono: [teléfono]
- Dirección: [dirección]
- Política de devoluciones: [Resumen de política]

Cuando respondas:
1. Divide las respuestas largas en varios párrafos
2. Si el cliente menciona múltiples preguntas o temas, abórdalos por separado y en orden
3. Para consultas de productos específicos, ofrece información sobre características, precio y disponibilidad
4. Para solicitudes de presupuesto, pide detalles específicos como cantidad, modelo y fecha requerida
5. Para solicitudes de facturas, pide el número de pedido o fecha de compra
6. No menciones que eres una IA
7. Usa un tono conversacional y amigable`,
  },

  // Configuración de tiempos de espera
  DELAY_SETTINGS: {
    AUTO_REPLY_DELAY: {
      MIN: 25, // segundos
      MAX: 35, // segundos
    },
    AI_REPLY_DELAY: {
      READING_TIME: {
        // Tiempo simulado de lectura
        MIN: 2, // segundos
        MAX: 5, // segundos
      },
      TYPING_SPEED: 400, // Caracteres por minuto para simular escritura
      MIN_DELAY: 4, // Segundos mínimos de respuesta
      MAX_ADDITIONAL_DELAY: 6, // Segundos adicionales aleatorios
    },
    MESSAGE_GROUPING: {
      WAIT_TIME: 10, // Segundos de espera para agrupar mensajes consecutivos
    },
  },

  // Configuración de horario comercial
  SCHEDULE: {
    BUSINESS_HOURS: {
      start: 8, // 8:00 AM
      end: 16, // 4:00 PM
    },
    BUSINESS_DAYS: [1, 2, 3, 4, 5], // Lunes a Viernes
    AIRTABLE: {
      API_KEY: process.env.AIRTABLE_API_KEY || "",
      BASE_ID: process.env.AIRTABLE_BASE_ID || "",
      TABLE_NAME: "Festivos",
      VIEW_NAME: "Grid view",
    },
    OUT_OF_HOURS_MESSAGE: `Gracias por contactarnos. Nuestro horario de atención es de lunes a viernes de 8:00 a 16:00 horas.

En este momento nos encontramos fuera de horario comercial, pero nos pondremos en contacto contigo tan pronto como regresemos.

Si deseas, tambien puedes enviarnos un correo a info@toolstock.info
        
¡Gracias por tu comprensión!`,
  },
};
