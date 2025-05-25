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
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages,
        max_tokens: 500,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'OpenAI API request failed');
    }

    const data: OpenAIResponse = await response.json();
    return data.choices[0]?.message?.content || '';
  }

  static async generateSuggestions({
    content,
    apiKey,
    model = 'gpt-3.5-turbo',
    suggestionType = 'general', 
    documentContext
  }: SuggestionRequest): Promise<ParsedSuggestion[]> {
    if (!apiKey) {
      throw new Error('OpenAI API key is required');
    }

    const plainText = content.replace(/<[^>]*>?/gm, '');

    if (plainText.length < 30) { 
      return [];
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
         // Attempt to log the problematic string if the error is from JSON.parse
         // Note: 'responseString' is available here.
         console.error("Failed to parse JSON response from OpenAI. Response string:", responseString);
         throw new Error('Failed to parse AI suggestions due to invalid JSON response.');
      }
      // For other errors, rethrow a generic or the original error if it's already informative
      throw new Error(`Failed to generate or parse AI suggestions: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  static async testApiKey(apiKey: string): Promise<boolean> {
    try {
      const messages: OpenAIMessage[] = [
        { role: 'user', content: 'Hello, this is a test message.' }
      ];
      
      await this.makeRequest(messages, apiKey, 'gpt-3.5-turbo');
      return true;
    } catch (error) {
      console.error('API key test failed:', error);
      return false;
    }
  }
} 