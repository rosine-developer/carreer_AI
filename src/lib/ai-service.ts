// Local AI model disabled — using Groq API instead (much faster, no memory issues)
// The @xenova/transformers model was causing "Out of Memory" crashes in browsers

export async function initializeAI() {
  // No-op — Groq API handles all AI responses
  return null;
}

export async function generateAIResponse(
  _userMessage: string,
  _conversationHistory: string,
  _systemPrompt: string
): Promise<string> {
  // No-op — Groq API handles all AI responses in data.ts
  return null;
}












