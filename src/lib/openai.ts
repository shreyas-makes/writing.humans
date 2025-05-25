interface OpenAIMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface OpenAIResponse {
  choices: {
    message: {
      content: string;
    };
  }[];
}

interface SuggestionRequest {
  content: string;
  apiKey: string;
  model?: string;
  suggestionType?: 'general' | 'conciseness' | 'clarity' | 'engagement' | 'expand' | 'rephrase_alternatives';
  documentContext?: {
    title?: string;
    overallGoal?: string; 
  };
}

interface ParsedSuggestion {
  originalText: string;
  suggestedText: string;
  explanation: string;
}

export class OpenAIService {
  private static async makeRequest(
    messages: OpenAIMessage[],
    apiKey: string,
    model: string = 'gpt-3.5-turbo'
  ): Promise<string> {
    if (!apiKey || !apiKey.trim()) {
      throw new Error('OpenAI API key is required');
    }

    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: model,
          messages: messages,
          temperature: 0.7,
          max_tokens: 1000,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`OpenAI API error: ${response.status} ${response.statusText}. ${errorData.error?.message || ''}`);
      }

      const data: OpenAIResponse = await response.json();
      
      if (!data.choices || data.choices.length === 0) {
        throw new Error('No response from OpenAI API');
      }

      return data.choices[0].message.content;
    } catch (error) {
      console.error('OpenAI API request failed:', error);
      throw error;
    }
  }

  static async generateSuggestions({
    content,
    apiKey,
    model = 'gpt-3.5-turbo',
    suggestionType = 'general', 
    documentContext
  }: SuggestionRequest): Promise<ParsedSuggestion[]> {
    const plainText = content.replace(/<[^>]*>?/gm, '');

    if (plainText.length < 30) { 
      return [];
    }

    if (!apiKey || !apiKey.trim()) {
      throw new Error('OpenAI API key is required');
    }

    let systemPrompt = `You are an advanced writing assistant. Your goal is to provide highly useful and context-aware suggestions.
    Format your response as a JSON array of suggestion objects. Each object must have "originalText", "suggestedText", and "explanation".
    If no improvements are genuinely needed for the given text and context, return an empty array.
    Consider the overall document context if provided.`;

    let userPromptContent = `The user is working on a document`;
    if (documentContext?.title) {
      userPromptContent += ` titled "${documentContext.title}"`;
    }
    if (documentContext?.overallGoal) {
      userPromptContent += ` with the goal: "${documentContext.overallGoal}"`;
    }
    userPromptContent += `.\n\nAnalyze the following text snippet from their document:\n\nTEXT_START\n${plainText}\nTEXT_END\n\n`;

    switch (suggestionType) {
      case 'conciseness':
        systemPrompt += `\nFocus specifically on making the text more concise and removing redundant words or phrases. Identify sentences or phrases that can be shortened without losing meaning.`;
        userPromptContent += `Please provide 1-2 suggestions to improve its conciseness.`;
        break;
      case 'clarity':
        systemPrompt += `\nFocus on improving the clarity and readability of the text. Identify ambiguous phrasing, complex sentences that could be simplified, or areas where the meaning is unclear.`;
        userPromptContent += `Please provide 1-2 suggestions to enhance its clarity.`;
        break;
      case 'engagement':
        systemPrompt += `\nFocus on making the text more engaging for the reader. Suggest using stronger verbs, more vivid language, or rephrasing to create more impact.`;
        userPromptContent += `Please provide 1-2 suggestions to make it more engaging.`;
        break;
      case 'expand':
        systemPrompt += `\nIdentify a key idea in the text that could be expanded upon. Suggest a follow-up sentence or a brief point of elaboration. The "originalText" should be the sentence/phrase you are suggesting to expand FROM, and "suggestedText" should be the *additional* text to insert or a rephrased version that includes the expansion. The explanation should clarify what this expansion adds.`;
        userPromptContent += `Analyze the text. If appropriate, suggest one way to expand on an idea presented.`;
        break;
      case 'rephrase_alternatives':
         systemPrompt += `\nFor a selected phrase or sentence in the text, offer 2-3 alternative ways to phrase it, each with a slightly different nuance or emphasis. The "originalText" will be the text to rephrase. The "suggestedText" should be one alternative, and the "explanation" can briefly describe the nuance of that alternative. Return multiple suggestion objects if you have multiple alternatives for the *same* originalText.`;
         userPromptContent += `Please select a sentence or key phrase from the text and offer 2-3 alternative phrasings for it.`;
         break;
      default: // 'general'
        systemPrompt += `
        Analyze the given text and provide 1-3 specific, actionable suggestions for improvement.
        For each suggestion, provide:
        1. The exact original text segment that could be improved (a phrase or sentence).
        2. The suggested replacement text.
        3. A brief explanation of why this improvement helps.

        Focus on a balance of:
        - Grammar and clarity
        - Word choice and conciseness
        - Tone and readability
        - Logical flow (if applicable to the snippet)
        - Removing redundancy

        Only suggest improvements for text that genuinely needs it.`;
        userPromptContent += `Please analyze this text and provide 1-3 general suggestions for improvement.`;
        break;
    }

    systemPrompt += `\n\nJSON_OUTPUT_STRUCTURE:\n[\n  {\n    "originalText": "exact segment from the provided text that your suggestion refers to",\n    "suggestedText": "the improved version of that segment, or the text to add for expansion",\n    "explanation": "brief, clear explanation of why this suggestion is helpful or what it achieves"\n  }\n]`;


    const messages: OpenAIMessage[] = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPromptContent }
    ];

    try {
      const responseString = await this.makeRequest(messages, apiKey, model);
      
      const suggestions = JSON.parse(responseString);
      
      if (!Array.isArray(suggestions)) {
        console.warn('OpenAI response is not an array, returning empty suggestions. Response:', responseString);
        return [];
      }

      return suggestions.filter((suggestion: any) => 
        suggestion.originalText && 
        suggestion.suggestedText && 
        suggestion.explanation &&
        (suggestionType === 'expand' || suggestion.originalText !== suggestion.suggestedText)
      );
    } catch (error) {
      console.error('Error parsing OpenAI response or generating suggestions:', error);
      if (error instanceof SyntaxError) {
         // responseString is not in scope here anymore if makeRequest failed before returning a string.
         // For now, the stubbed makeRequest always returns a valid JSON string, so this path is less likely for SyntaxError from JSON.parse.
         // However, if makeRequest were to throw an error before returning, responseString would not be defined.
         console.error("Failed to parse JSON response from OpenAI. The response might have been malformed or the request failed before a response was generated.");
         throw new Error('Failed to parse AI suggestions due to invalid JSON response.');
      }
      // For other errors, rethrow a generic or the original error if it's already informative
      throw new Error(`Failed to generate or parse AI suggestions: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
} 