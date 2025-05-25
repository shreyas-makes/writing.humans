import { useState, useEffect, useCallback } from 'react';
import { OpenAIService } from '@/lib/openai';
import { useUserSettings } from '@/hooks/useUserSettings';
import { type Suggestion } from '@/components/SuggestionPanel';

interface UseAISuggestionsProps {
  content: string;
  enabled?: boolean;
}

export const useAISuggestions = ({ content, enabled = true }: UseAISuggestionsProps) => {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { settings } = useUserSettings();

  const generateSuggestions = useCallback(async (textContent: string) => {
    if (!enabled || !settings.openai_api_key || suggestions.length >= settings.max_suggestions) {
      return;
    }

    // Skip if content is too short or is the default placeholder
    if (textContent.trim() === "<p>Start writing your document here...</p>" || textContent.length < 50) {
      return;
    }

    setIsGenerating(true);
    setError(null);

    try {
      const aiSuggestions = await OpenAIService.generateSuggestions({
        content: textContent,
        apiKey: settings.openai_api_key,
        model: settings.ai_model,
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
        textContent.includes(newSuggestion.originalText)
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
  }, [enabled, settings, suggestions.length]);

  // Determine delay based on suggestion frequency
  const getDelay = () => {
    switch (settings.suggestion_frequency) {
      case 'low': return 5000; // 5 seconds
      case 'high': return 1000; // 1 second
      default: return 2000; // 2 seconds (normal)
    }
  };

  // Generate suggestions when content changes
  useEffect(() => {
    if (!enabled || !settings.openai_api_key) return;

    const timer = setTimeout(() => {
      generateSuggestions(content);
    }, getDelay());

    return () => clearTimeout(timer);
  }, [content, generateSuggestions, enabled, settings.openai_api_key]);

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