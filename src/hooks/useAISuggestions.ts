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
    console.warn(`Could not find text "${searchText}" in content. Plain text length: ${plainText.length}`);
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
  const [lastContentSnapshot, setLastContentSnapshot] = useState<string>('');
  const { settings } = useUserSettings();

  // Calculate max suggestions based on document length (1 suggestion per 5 lines)
  const calculateMaxSuggestions = useCallback((textContent: string) => {
    const plainText = textContent.replace(/<[^>]*>?/gm, '');
    // Count lines more accurately by considering both \n and estimated line breaks
    const explicitLines = plainText.split('\n').length;
    // Estimate lines based on content length (assuming ~80 characters per line)
    const estimatedLines = Math.ceil(plainText.length / 80);
    // Use the higher of the two to account for long lines
    const lines = Math.max(explicitLines, estimatedLines);
    return Math.max(1, Math.floor(lines / 5)); // At least 1 suggestion, 1 per 5 lines
  }, []);

  const generateSuggestions = useCallback(async (textContent: string, currentDocumentTitle?: string) => {
    const maxSuggestions = calculateMaxSuggestions(textContent);
    
    console.log('🔍 generateSuggestions called with:', {
      enabled,
      hasApiKey: !!settings.openai_api_key,
      apiKeyLength: settings.openai_api_key?.length || 0,
      contentLength: textContent.length,
      currentSuggestions: suggestions.length,
      maxSuggestions: maxSuggestions,
      settings: settings
    });

    if (!enabled) {
      console.log('❌ Suggestions disabled');
      return;
    }

    if (!settings.openai_api_key) {
      console.log('❌ No OpenAI API key found');
      return;
    }

    if (suggestions.length >= maxSuggestions) {
      console.log('❌ Already at max suggestions limit:', suggestions.length, '>=', maxSuggestions);
      return;
    }

    // Skip if content is too short or is the default placeholder
    const plainTextContent = textContent.replace(/<[^>]*>?/gm, '').trim();
    console.log('📝 Plain text content:', {
      length: plainTextContent.length,
      preview: plainTextContent.substring(0, 100) + '...',
      isPlaceholder: plainTextContent === "Start writing your document here..."
    });

    if (plainTextContent === "Start writing your document here..." || plainTextContent.length < 30) {
      console.log('❌ Content too short or is placeholder');
      return;
    }

    console.log('✅ All checks passed, starting AI suggestion generation...');
    setIsGenerating(true);
    setError(null);

    try {
      // TODO: Allow user to set preferredSuggestionType in settings
      const preferredSuggestionType = 'general';

      console.log('🤖 Calling OpenAI with:', {
        contentLength: textContent.length,
        model: settings.ai_model,
        suggestionType: preferredSuggestionType,
        documentTitle: currentDocumentTitle
      });

      const aiSuggestions = await OpenAIService.generateSuggestions({
        content: textContent,
        apiKey: settings.openai_api_key,
        model: settings.ai_model,
        suggestionType: preferredSuggestionType,
        documentContext: {
          title: currentDocumentTitle,
        }
      });

      console.log('🎯 Received AI suggestions:', aiSuggestions);

      // Convert AI suggestions to our Suggestion format with position data
      const newSuggestions: Suggestion[] = aiSuggestions.map((suggestion, index) => {
        // Find the position of the original text in the content
        const position = findTextPosition(textContent, suggestion.originalText);
        
        console.log(`📍 Position for suggestion ${index}:`, {
          originalText: suggestion.originalText,
          position: position,
          found: !!position
        });

        return {
          id: `${Date.now()}-${index}`,
          originalText: suggestion.originalText,
          suggestedText: suggestion.suggestedText,
          explanation: suggestion.explanation,
          position: position,
        };
      });

      console.log('🔄 Converted suggestions with positions:', newSuggestions);

      // Filter out suggestions that already exist, where original text doesn't exist in content, or that lack position data
      const filteredSuggestions = newSuggestions.filter(newSuggestion => {
        const alreadyExists = suggestions.some(existing => existing.originalText === newSuggestion.originalText);
        const textExists = plainTextContent.includes(newSuggestion.originalText);
        const hasPosition = newSuggestion.position !== undefined;

        console.log(`🔍 Filtering suggestion "${newSuggestion.originalText}":`, {
          alreadyExists,
          textExists,
          hasPosition,
          willInclude: !alreadyExists && textExists && hasPosition
        });

        return !alreadyExists && textExists && hasPosition;
      });

      console.log('✅ Filtered suggestions:', filteredSuggestions);

      if (filteredSuggestions.length > 0) {
        setSuggestions(prev => {
          const newState = [...prev, ...filteredSuggestions].slice(0, maxSuggestions);
          console.log('📝 Updated suggestions state:', newState);
          return newState;
        });
        console.log('✅ Added suggestions to state');
      } else {
        console.log('❌ No valid suggestions to add');
      }
    } catch (err) {
      console.error('💥 Error generating AI suggestions:', err);
      setError(err instanceof Error ? err.message : 'Failed to generate suggestions');
    } finally {
      setIsGenerating(false);
    }
  }, [enabled, settings, suggestions, calculateMaxSuggestions]);

  // Determine interval based on suggestion frequency
  
  const getInterval = () => {
    switch (settings.suggestion_frequency) {
      case 'low': return 3 * 60 * 1000; // 3 minutes
      case 'high': return 30 * 1000; // 30 seconds
      default: return 60 * 1000; // 1 minute (normal)
    }
  };

  // Generate suggestions at intervals based on frequency setting if content has changed
  useEffect(() => {
    const intervalTime = getInterval();
    console.log('⏰ Setting up AI suggestions interval:', {
      enabled,
      hasApiKey: !!settings.openai_api_key,
      contentLength: content.length,
      frequency: settings.suggestion_frequency,
      intervalMs: intervalTime
    });

    if (!enabled || !settings.openai_api_key) {
      console.log('❌ Skipping interval setup - disabled or no API key');
      return;
    }

    // Set up interval to check for content changes and generate suggestions
    const interval = setInterval(() => {
      console.log(`⏰ ${settings.suggestion_frequency} frequency interval fired, checking for content changes`);
      
      // Only generate suggestions if content has meaningfully changed since last check
      const currentContentSnapshot = content.replace(/<[^>]*>?/gm, '').trim();
      
      if (currentContentSnapshot !== lastContentSnapshot && currentContentSnapshot.length > 30) {
        console.log('📝 Content has changed, generating suggestions');
        setLastContentSnapshot(currentContentSnapshot);
        generateSuggestions(content, documentTitle);
      } else {
        console.log('📝 No meaningful content changes, skipping suggestion generation');
      }
    }, intervalTime);

    return () => {
      console.log(`🧹 Cleaning up ${settings.suggestion_frequency} frequency interval`);
      clearInterval(interval);
    };
  }, [enabled, settings.openai_api_key, settings.suggestion_frequency, generateSuggestions, content, documentTitle, lastContentSnapshot]);

  // Update content snapshot when content changes (but don't trigger suggestions immediately)
  useEffect(() => {
    const currentContentSnapshot = content.replace(/<[^>]*>?/gm, '').trim();
    if (currentContentSnapshot.length > 30 && lastContentSnapshot === '') {
      // Initialize the snapshot on first meaningful content
      setLastContentSnapshot(currentContentSnapshot);
    }
  }, [content, lastContentSnapshot]);

  const removeSuggestion = useCallback((suggestionId: string) => {
    console.log('🗑️ Removing suggestion:', suggestionId);
    setSuggestions(prev => prev.filter(s => s.id !== suggestionId));
  }, []);

  const clearAllSuggestions = useCallback(() => {
    console.log('🧹 Clearing all suggestions');
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