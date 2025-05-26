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
          temperature: 0.3,
          max_tokens: 800, // Increased for more suggestions
          stream: false,
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

    // Allow shorter content for first-time users (minimum 15 characters)
    if (plainText.length < 15) { 
      return [];
    }

    if (!apiKey || !apiKey.trim()) {
      throw new Error('OpenAI API key is required');
    }

    // Calculate dynamic suggestion count based on content length
    const wordCount = plainText.split(/\s+/).filter(word => word.length > 0).length;
    const paragraphCount = plainText.split(/\n\s*\n/).filter(p => p.trim().length > 0).length;
    
    // More suggestions for longer content
    let targetSuggestions = 2; // Base minimum
    if (wordCount > 100) targetSuggestions = 3;
    if (wordCount > 200) targetSuggestions = 4;
    if (wordCount > 400) targetSuggestions = 5;
    if (paragraphCount > 3) targetSuggestions = Math.min(targetSuggestions + 1, 6);

    // Enhanced system prompt for better coverage
    let systemPrompt = `You are a writing assistant. You MUST analyze the ENTIRE document from beginning to end and provide ${targetSuggestions} specific suggestions to improve different parts throughout the text.

CRITICAL REQUIREMENTS:
- READ THE COMPLETE TEXT from start to finish - do not stop at the first paragraph
- DISTRIBUTE your suggestions across DIFFERENT paragraphs and sections
- AVOID clustering suggestions in just the opening sentences
- Look for improvements in the MIDDLE and END sections of the text, not just the beginning
- Each suggestion must target a DIFFERENT sentence or phrase from various parts of the document
- Focus on variety: grammar, clarity, word choice, flow, conciseness, transitions between paragraphs

JSON FORMAT REQUIREMENTS:
- Return ONLY a valid JSON array, nothing else
- Use this EXACT format: [{"originalText": "exact text to improve", "suggestedText": "improved version", "explanation": "brief reason"}]
- Do NOT include any explanatory text before or after the JSON
- Do NOT use markdown code blocks (no \`\`\`json)
- Do NOT add any comments or additional text
- Start your response with [ and end with ]
- If fewer than ${targetSuggestions} improvements are needed, return what you find

REMINDER: Your goal is to help improve the ENTIRE document, not just the first few sentences.`;

    // Enhanced user prompt with section awareness
    let userPromptContent = `Please analyze this COMPLETE document from start to finish and provide ${targetSuggestions} improvements distributed across different paragraphs and sections:

TEXT TO ANALYZE:
${plainText}

ANALYSIS REQUIREMENTS:
- Read through ALL paragraphs and sections
- Identify ${targetSuggestions} different areas for improvement
- Choose suggestions from VARIOUS parts of the text (beginning, middle, end)
- Do not focus only on the first paragraph or opening sentences

`;

    switch (suggestionType) {
      case 'conciseness':
        userPromptContent += `Focus on making different sections more concise. Look throughout the entire document from beginning to end.`;
        break;
      case 'clarity':
        userPromptContent += `Focus on improving clarity in various parts of the text. Scan the complete document and find unclear sections throughout.`;
        break;
      case 'engagement':
        userPromptContent += `Focus on making different sections more engaging. Review the entire content and enhance various paragraphs.`;
        break;
      case 'expand':
        userPromptContent += `Suggest expansions of ideas from different paragraphs throughout the document.`;
        break;
      case 'rephrase_alternatives':
        userPromptContent += `Offer alternative phrasings for key sentences from various parts of the text, not just the beginning.`;
        break;
      default: // 'general'
        userPromptContent += `Provide ${targetSuggestions} diverse improvements (grammar, clarity, word choice, flow) from different sections throughout the document. Make sure to analyze ALL paragraphs, not just the first one.`;
        break;
    }

    const messages: OpenAIMessage[] = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPromptContent }
    ];

    let responseString = '';
    let cleanedResponse = '';
    
    try {
      responseString = await this.makeRequest(messages, apiKey, model);
      
      console.log('🤖 OpenAI raw response:', responseString);
      console.log(`📊 Content analysis: ${wordCount} words, ${paragraphCount} paragraphs, targeting ${targetSuggestions} suggestions`);
      
      // Try to clean up the response if it's not valid JSON
      cleanedResponse = responseString.trim();
      
      // Remove any markdown code blocks if present
      if (cleanedResponse.startsWith('```json')) {
        cleanedResponse = cleanedResponse.replace(/^```json\s*/, '').replace(/\s*```$/, '');
      } else if (cleanedResponse.startsWith('```')) {
        cleanedResponse = cleanedResponse.replace(/^```\s*/, '').replace(/\s*```$/, '');
      }
      
      // Remove any leading/trailing text that's not part of the JSON array
      const jsonStartIndex = cleanedResponse.indexOf('[');
      const jsonEndIndex = cleanedResponse.lastIndexOf(']');
      
      if (jsonStartIndex !== -1 && jsonEndIndex !== -1 && jsonEndIndex > jsonStartIndex) {
        cleanedResponse = cleanedResponse.substring(jsonStartIndex, jsonEndIndex + 1);
      }
      
      // Log the cleaned response for debugging
      console.log('🧹 Cleaned response:', cleanedResponse);
      
      const suggestions = JSON.parse(cleanedResponse);
      
      if (!Array.isArray(suggestions)) {
        console.warn('OpenAI response is not an array, returning empty suggestions. Response:', cleanedResponse);
        return [];
      }

      const validSuggestions = suggestions.filter((suggestion: any) => 
        suggestion.originalText && 
        suggestion.suggestedText && 
        suggestion.explanation &&
        (suggestionType === 'expand' || suggestion.originalText !== suggestion.suggestedText)
      );

      console.log(`✅ Generated ${validSuggestions.length} valid suggestions out of ${suggestions.length} total`);
      
      return validSuggestions;
    } catch (error) {
      console.error('Error parsing OpenAI response or generating suggestions:', error);
      if (error instanceof SyntaxError) {
        console.error("Failed to parse JSON response from OpenAI.");
        console.error("Raw response:", responseString);
        console.error("Cleaned response:", cleanedResponse);
        
        // Try one more time with a different approach - look for JSON-like patterns
        try {
          // Try to extract suggestions manually if it's a formatting issue
          const suggestionPattern = /"originalText":\s*"([^"]*)",\s*"suggestedText":\s*"([^"]*)",\s*"explanation":\s*"([^"]*)"/g;
          const manualSuggestions: ParsedSuggestion[] = [];
          let match;
          
          while ((match = suggestionPattern.exec(responseString)) !== null) {
            manualSuggestions.push({
              originalText: match[1],
              suggestedText: match[2],
              explanation: match[3]
            });
          }
          
          if (manualSuggestions.length > 0) {
            console.log(`🔧 Recovered ${manualSuggestions.length} suggestions using pattern matching`);
            return manualSuggestions;
          }
        } catch (fallbackError) {
          console.error('Fallback parsing also failed:', fallbackError);
        }
        
        throw new Error('Failed to parse AI suggestions. The AI returned an invalid JSON format. Please try again.');
      }
      throw new Error(`Failed to generate AI suggestions: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
} 