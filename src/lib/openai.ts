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
    model = 'gpt-3.5-turbo'
  }: SuggestionRequest): Promise<ParsedSuggestion[]> {
    if (!apiKey) {
      throw new Error('OpenAI API key is required');
    }

    // Strip HTML tags to get plain text
    const plainText = content.replace(/<[^>]*>?/gm, '');
    
    if (plainText.length < 50) {
      return [];
    }

    const systemPrompt = `You are a writing assistant that provides helpful suggestions to improve text. 
    Analyze the given text and provide 1-3 specific suggestions for improvement.
    
    For each suggestion, provide:
    1. The exact original text that needs improvement (a phrase or sentence)
    2. The suggested replacement text
    3. A brief explanation of why this improvement helps
    
    Focus on:
    - Grammar and clarity
    - Word choice and conciseness
    - Tone and readability
    - Removing redundancy
    
    Format your response as JSON array with this structure:
    [
      {
        "originalText": "exact text from the document",
        "suggestedText": "improved version",
        "explanation": "brief explanation of the improvement"
      }
    ]
    
    Only suggest improvements for text that actually needs it. If the text is already well-written, return an empty array.`;

    const userPrompt = `Please analyze this text and provide suggestions for improvement:\n\n${plainText}`;

    const messages: OpenAIMessage[] = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt }
    ];

    try {
      const response = await this.makeRequest(messages, apiKey, model);
      
      // Parse the JSON response
      const suggestions = JSON.parse(response);
      
      // Validate the response format
      if (!Array.isArray(suggestions)) {
        console.warn('OpenAI response is not an array, returning empty suggestions');
        return [];
      }

      return suggestions.filter((suggestion: any) => 
        suggestion.originalText && 
        suggestion.suggestedText && 
        suggestion.explanation &&
        suggestion.originalText !== suggestion.suggestedText
      );
    } catch (error) {
      console.error('Error parsing OpenAI response:', error);
      throw new Error('Failed to parse AI suggestions');
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