import { pipeline, env } from '@xenova/transformers';

// Configure to use local models (no internet needed after first load)
env.allowLocalModels = false;

let conversationModel: any = null;
let isLoading = false;

// Initialize the AI model
export async function initializeAI() {
  if (conversationModel || isLoading) return conversationModel;
  
  isLoading = true;
  try {
    console.log('🤖 Loading AI model...');
    // Using a lightweight conversational model
    conversationModel = await pipeline(
      'text2text-generation',
      'Xenova/LaMini-Flan-T5-783M',
      { quantized: true }
    );
    console.log('✅ AI model loaded successfully!');
    return conversationModel;
  } catch (error) {
    console.error('❌ Failed to load AI model:', error);
    isLoading = false;
    return null;
  }
}

// Generate AI response
export async function generateAIResponse(
  userMessage: string,
  conversationHistory: string,
  systemPrompt: string
): Promise<string> {
  try {
    // Try to use the local AI model
    if (!conversationModel) {
      await initializeAI();
    }

    if (conversationModel) {
      const prompt = `${systemPrompt}\n\nConversation:\n${conversationHistory}\n\nUser: ${userMessage}\n\nAssistant:`;
      
      const result = await conversationModel(prompt, {
        max_length: 200,
        temperature: 0.7,
        do_sample: true,
      });

      const response = result[0].generated_text.trim();
      
      // Clean up the response
      if (response && response.length > 10) {
        return response;
      }
    }
  } catch (error) {
    console.error('AI generation error:', error);
  }

  // Fallback to rule-based system
  return null;
}


