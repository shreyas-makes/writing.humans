import { useState, useEffect, useCallback, useRef } from 'react';
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
  
  // Add a manual trigger function for testing
  const manuallyTriggerSuggestions = useCallback(() => {
    console.log('🔧 Manual trigger: Generating suggestions for testing');
    if (enabled && settings.openai_api_key && content.length > 30) {
      if (generateSuggestionsRef.current) {
        generateSuggestionsRef.current(content, documentTitle);
      }
    } else {
      console.log('🔧 Manual trigger: Cannot generate - missing requirements', {
        enabled,
        hasApiKey: !!settings.openai_api_key,
        contentLength: content.length
      });
    }
  }, [enabled, settings.openai_api_key, content, documentTitle]);
  
  // Use refs to store latest values for interval callback
  const contentRef = useRef(content);
  const documentTitleRef = useRef(documentTitle);
  const lastContentSnapshotRef = useRef(lastContentSnapshot);
  const generateSuggestionsRef = useRef<typeof generateSuggestions>();
  
  // Update refs when values change
  useEffect(() => {
    contentRef.current = content;
  }, [content]);
  
  useEffect(() => {
    documentTitleRef.current = documentTitle;
  }, [documentTitle]);
  
  useEffect(() => {
    lastContentSnapshotRef.current = lastContentSnapshot;
  }, [lastContentSnapshot]);

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

    // Check if this is the first suggestion (no existing suggestions)
    const isFirstSuggestion = suggestions.length === 0;
    
    // For first suggestion: allow shorter content (2+ lines), for subsequent: require 30+ characters
    const minContentLength = isFirstSuggestion ? 20 : 30; // Lower threshold for first suggestion
    
    if (isFirstSuggestion) {
      // Same logic as in the useEffect for consistency
      const lineBreaks = plainTextContent.split('\n').filter(line => line.trim().length > 0);
      const paragraphs = textContent.match(/<p[^>]*>.*?<\/p>/gi) || [];
      const divs = textContent.match(/<div[^>]*>.*?<\/div>/gi) || [];
      const blockElements = paragraphs.length + divs.length;
      
      const hasEnoughLines = lineBreaks.length >= 2 || 
                           blockElements >= 2 || 
                           plainTextContent.length >= 80;
      
      if (!hasEnoughLines) {
        console.log('❌ First suggestion: insufficient content structure');
        return;
      }
    }

    if (plainTextContent === "Start writing your document here..." || 
        plainTextContent.length < minContentLength) {
      console.log('❌ Content too short or is placeholder:', {
        isFirstSuggestion,
        minContentLength,
        actualLength: plainTextContent.length
      });
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

  // Update generateSuggestions ref
  useEffect(() => {
    generateSuggestionsRef.current = generateSuggestions;
  }, [generateSuggestions]);

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
      intervalMs: intervalTime,
      intervalMinutes: intervalTime / (60 * 1000),
      currentSuggestions: suggestions.length
    });

    if (!enabled || !settings.openai_api_key) {
      console.log('❌ Skipping interval setup - disabled or no API key');
      return;
    }

    // Set up interval to check for content changes and generate suggestions
    const interval = setInterval(() => {
      console.log(`⏰ ${settings.suggestion_frequency} frequency interval fired, checking for content changes`);
      
      // Only generate suggestions if content has meaningfully changed since last check
      const currentContentSnapshot = contentRef.current.replace(/<[^>]*>?/gm, '').trim();
      
      if (currentContentSnapshot !== lastContentSnapshotRef.current && currentContentSnapshot.length > 30) {
        console.log('📝 Content has changed, generating suggestions');
        setLastContentSnapshot(currentContentSnapshot);
        if (generateSuggestionsRef.current) {
          generateSuggestionsRef.current(contentRef.current, documentTitleRef.current);
        }
      } else {
        console.log('📝 No meaningful content changes, skipping suggestion generation');
      }
    }, intervalTime);

    return () => {
      console.log(`🧹 Cleaning up ${settings.suggestion_frequency} frequency interval`);
      clearInterval(interval);
    };
  }, [enabled, settings.openai_api_key, settings.suggestion_frequency]);

  // Update content snapshot when content changes and trigger initial suggestions
  useEffect(() => {
    const currentContentSnapshot = content.replace(/<[^>]*>?/gm, '').trim();
    
    // Check if this is the first meaningful content (for faster first suggestion)
    const isFirstMeaningfulContent = lastContentSnapshot === '' && 
      currentContentSnapshot !== "Start writing your document here..." &&
      currentContentSnapshot.length > 0;
    
    // Count lines for first suggestion trigger (2 lines minimum)
    // Handle both actual line breaks and separate paragraphs/elements
    const lineBreaks = currentContentSnapshot.split('\n').filter(line => line.trim().length > 0);
    const paragraphs = content.match(/<p[^>]*>.*?<\/p>/gi) || [];
    const divs = content.match(/<div[^>]*>.*?<\/div>/gi) || [];
    const blockElements = paragraphs.length + divs.length;
    
    // Consider it as having enough lines if either:
    // 1. There are actual line breaks (2+), or 
    // 2. There are multiple block elements (2+), or
    // 3. Content is long enough (80+ chars, roughly 2 lines worth)
    const hasEnoughLinesForFirstSuggestion = lineBreaks.length >= 2 || 
                                           blockElements >= 2 || 
                                           currentContentSnapshot.length >= 80;
    
    // For first suggestion: trigger after 2 lines of content
    if (isFirstMeaningfulContent && hasEnoughLinesForFirstSuggestion) {
      console.log('🚀 First suggestion trigger: 2+ lines detected, generating initial suggestions', {
        lineBreaks: lineBreaks.length,
        blockElements: blockElements,
        contentLength: currentContentSnapshot.length,
        contentPreview: currentContentSnapshot.substring(0, 50) + '...'
      });
      setLastContentSnapshot(currentContentSnapshot);
      
      // Generate suggestions immediately for first-time users
      if (enabled && settings.openai_api_key) {
        setTimeout(() => {
          generateSuggestions(content, documentTitle);
        }, 1000); // Faster 1 second delay for first suggestion
      }
    }
    // For subsequent suggestions: use the original 30 character threshold
    else if (currentContentSnapshot.length > 30 && lastContentSnapshot === '') {
      console.log('📝 First meaningful content detected (fallback), generating initial suggestions');
      setLastContentSnapshot(currentContentSnapshot);
      
      // Generate suggestions after a short delay for the first meaningful content
      if (enabled && settings.openai_api_key) {
        setTimeout(() => {
          generateSuggestions(content, documentTitle);
        }, 2000); // 2 second delay for initial suggestions
      }
    }
  }, [content, lastContentSnapshot, enabled, settings.openai_api_key, generateSuggestions, documentTitle]);

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
    manuallyTriggerSuggestions, // For testing purposes
  };
}; 