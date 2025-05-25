import { useState, useEffect, useCallback } from 'react';
import { OpenAIService } from '@/lib/openai';
import { useUserSettings } from '@/hooks/useUserSettings';
import { type Suggestion } from '@/components/SuggestionPanel';

// Helper function to find the position of text within content
function findTextPosition(content: string, searchText: string): { start: number; end: number } | undefined {
  // Convert HTML content to plain text for position calculation
  const plainText = content.replace(/<[^>]*>?/gm, '');
  const index = plainText.indexOf(searchText);
  
  if (index === -1) {
    return undefined;
  }
  
  return {
    start: index,
    end: index + searchText.length
  };
}

interface UseAISuggestionsProps {
  content: string;
  documentTitle?: string;
  enabled?: boolean;
}

export const useAISuggestions = ({ content, documentTitle, enabled = true }: UseAISuggestionsProps) => {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { settings } = useUserSettings();

  const generateSuggestions = useCallback(async (textContent: string, currentDocumentTitle?: string) => {
    console.log('generateSuggestions called with:', {
      enabled,
      hasApiKey: !!settings.openai_api_key,
      contentLength: textContent.length,
      currentSuggestions: suggestions.length,
      maxSuggestions: settings.max_suggestions
    });

    if (!enabled || !settings.openai_api_key || suggestions.length >= settings.max_suggestions) {
      console.log('Skipping suggestion generation:', {
        enabled,
        hasApiKey: !!settings.openai_api_key,
        suggestionsAtMax: suggestions.length >= settings.max_suggestions
      });
      return;
    }

    // Skip if content is too short or is the default placeholder
    const plainTextContent = textContent.replace(/<[^>]*>?/gm, '').trim();
    if (plainTextContent === "Start writing your document here..." || plainTextContent.length < 30) {
      console.log('Skipping suggestion generation - content too short or placeholder:', {
        plainTextContent: plainTextContent.substring(0, 50) + '...',
        length: plainTextContent.length
      });
      return;
    }

    console.log('Starting AI suggestion generation...');
    setIsGenerating(true);
    setError(null);

    try {
      // TODO: Allow user to set preferredSuggestionType in settings
      const preferredSuggestionType = 'general';

      const aiSuggestions = await OpenAIService.generateSuggestions({
        content: textContent,
        apiKey: settings.openai_api_key,
        model: settings.ai_model,
        suggestionType: preferredSuggestionType,
        documentContext: {
          title: currentDocumentTitle,
        }
      });

      console.log('Received AI suggestions:', aiSuggestions);

      // Convert AI suggestions to our Suggestion format with position data
      const newSuggestions: Suggestion[] = aiSuggestions.map((suggestion, index) => {
        // Find the position of the original text in the content
        const position = findTextPosition(textContent, suggestion.originalText);
        
        return {
          id: `${Date.now()}-${index}`,
          originalText: suggestion.originalText,
          suggestedText: suggestion.suggestedText,
          explanation: suggestion.explanation,
          position: position,
        };
      });

      console.log('Converted suggestions with positions:', newSuggestions);

      // Filter out suggestions that already exist, where original text doesn't exist in content, or that lack position data
      const filteredSuggestions = newSuggestions.filter(newSuggestion =>
        !suggestions.some(existing => existing.originalText === newSuggestion.originalText) &&
        plainTextContent.includes(newSuggestion.originalText) &&
        newSuggestion.position !== undefined
      );

      console.log('Filtered suggestions:', filteredSuggestions);

      if (filteredSuggestions.length > 0) {
        setSuggestions(prev => [...prev, ...filteredSuggestions].slice(0, settings.max_suggestions));
        console.log('Added suggestions to state');
      } else {
        console.log('No valid suggestions to add');
      }
    } catch (err) {
      console.error('Error generating AI suggestions:', err);
      setError(err instanceof Error ? err.message : 'Failed to generate suggestions');
    } finally {
      setIsGenerating(false);
    }
  }, [enabled, settings, suggestions, settings.max_suggestions]);

  // Determine delay based on suggestion frequency
  const getDelay = () => {
    switch (settings.suggestion_frequency) {
      case 'low': return 5000; // 5 seconds
      case 'high': return 1000; // 1 second
      default: return 2000; // 2 seconds (normal)
    }
  };

  // Generate suggestions when content or documentTitle changes
  useEffect(() => {
    if (!enabled || !settings.openai_api_key) return;

    const timer = setTimeout(() => {
      generateSuggestions(content, documentTitle);
    }, getDelay());

    return () => clearTimeout(timer);
  }, [content, documentTitle, generateSuggestions, enabled, settings.openai_api_key]);

  const removeSuggestion = useCallback((suggestionId: string) => {
    setSuggestions(prev => prev.filter(s => s.id !== suggestionId));
  }, []);

  const clearAllSuggestions = useCallback(() => {
    setSuggestions([]);
  }, []);

  return {
    suggestions,
    isGenerating,
    error,
    removeSuggestion,
    clearAllSuggestions,
    hasApiKey: !!settings.openai_api_key,
  };
}; 