const { Configuration, OpenAIApi } = require("openai");
const config = require("../config/config");
const contextManager = require("../utils/contextManager");
const companyInfo = require("../data/companyInfo");

// Inicializar OpenAI
const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY || "",
});
const openai = new OpenAIApi(configuration);

// Función para procesar mensajes y obtener respuesta de IA
async function processWithAI(messages, chatId) {
  try {
    // Obtener el contexto de la conversación
    const context = contextManager.getConversationContext(chatId);

    // Concatenar múltiples mensajes si es necesario
    let combinedMessage = "";
    if (Array.isArray(messages)) {
      combinedMessage = messages.join("\n\n");
    } else {
      combinedMessage = messages;
    }

    // Añadir mensaje del usuario al contexto
    contextManager.addMessageToContext(chatId, "user", combinedMessage);

    // Llamar a la API de OpenAI
    const completion = await openai.createChatCompletion({
      model: config.AI_SETTINGS.model,
      messages: context.messages,
      temperature: config.AI_SETTINGS.temperature,
      max_tokens: config.AI_SETTINGS.max_tokens,
    });

    // Extraer la respuesta
    const aiResponse = completion.data.choices[0].message.content.trim();

    // Añadir la respuesta al contexto
    contextManager.addMessageToContext(chatId, "assistant", aiResponse);

    return aiResponse;
  } catch (error) {
    console.error("Error llamando a OpenAI:", error.message);
    throw error;
  }
}

// Procesa múltiples preguntas separadamente si es necesario
function detectMultipleQuestions(text) {
  // Buscar signos de interrogación
  const questionMarks = text.match(/\?/g);
  if (questionMarks && questionMarks.length > 1) {
    // Verificar si hay preguntas en diferentes líneas o separadas por conectores
    const sentences = text.split(/(?<=[.!?])\s+|(?<=\n)/);
    const questions = sentences.filter((s) => s.trim().endsWith("?"));

    if (questions.length > 1) {
      return true;
    }
  }

  // Buscar palabras clave que sugieren múltiples consultas
  const multiQueryKeywords = [
    "también quiero saber",
    "además",
    "por otro lado",
    "otra pregunta",
    "otra cosa",
    "y también",
  ];

  return multiQueryKeywords.some((keyword) =>
    text.toLowerCase().includes(keyword)
  );
}

// Modificar el contexto del sistema para incluir información de la empresa
function updateSystemPrompt() {
  const basePrompt = config.AI_SETTINGS.system_prompt;
  const enhancedPrompt = basePrompt
    .replace("[Nombre de tu empresa]", companyInfo.name)
    .replace("[Descripción de productos/servicios]", companyInfo.products)
    .replace("[URL de tu sitio]", companyInfo.website)
    .replace("[email]", companyInfo.email)
    .replace("[teléfono]", companyInfo.phone)
    .replace("[dirección]", companyInfo.address)
    .replace("[Resumen de política]", companyInfo.returnPolicy);

  return enhancedPrompt;
}

// Inicializar el módulo
function init() {
  // Actualizar el prompt del sistema con información de la empresa
  const enhancedPrompt = updateSystemPrompt();
  config.AI_SETTINGS.system_prompt = enhancedPrompt;

  console.log("Servicio OpenAI inicializado con información de empresa");
}

module.exports = {
  processWithAI,
  detectMultipleQuestions,
  init,
};
