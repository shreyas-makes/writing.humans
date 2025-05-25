import { useState, useEffect, useCallback } from 'react';
import { OpenAIService, type ParsedSuggestion } from '@/lib/openai';
import { useUserSettings } from '@/hooks/useUserSettings';
import { type Suggestion } from '@/components/SuggestionPanel';

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
    if (!enabled || !settings.openai_api_key || suggestions.length >= settings.max_suggestions) {
      return;
    }

    // Skip if content is too short or is the default placeholder
    const plainTextContent = textContent.replace(/<[^>]*>?/gm, '').trim();
    if (plainTextContent === "Start writing your document here..." || plainTextContent.length < 30) {
      return;
    }

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

      // Convert AI suggestions to our Suggestion format
      const newSuggestions: Suggestion[] = aiSuggestions.map((suggestion, index) => ({
        id: `${Date.now()}-${index}`,
        originalText: suggestion.originalText,
        suggestedText: suggestion.suggestedText,
        explanation: suggestion.explanation,
      }));

      // Filter out suggestions that already exist or where original text doesn't exist in content
      const filteredSuggestions = newSuggestions.filter(newSuggestion =>
        !suggestions.some(existing => existing.originalText === newSuggestion.originalText) &&
        plainTextContent.includes(newSuggestion.originalText)
      );

      if (filteredSuggestions.length > 0) {
        setSuggestions(prev => [...prev, ...filteredSuggestions].slice(0, settings.max_suggestions));
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