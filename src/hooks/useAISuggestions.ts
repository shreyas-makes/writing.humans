import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { OpenAIService } from '@/lib/openai';
import { useUserSettings } from '@/hooks/useUserSettings';
import { type Suggestion } from '@/components/SuggestionPanel';

// Enhanced content analysis utilities
const ContentAnalyzer = {
  // Convert HTML to plain text
  toPlainText: (content: string): string => {
    return content.replace(/<[^>]*>?/gm, '').trim();
  },

  // Count meaningful content units
  analyzeContent: (content: string) => {
    const plainText = ContentAnalyzer.toPlainText(content);
    const lines = plainText.split(/\r?\n/).filter(line => line.trim().length > 0);
    const words = plainText.split(/\s+/).filter(word => word.length > 0);
    const sentences = plainText.split(/[.!?]+/).filter(s => s.trim().length > 0);
    
    // Count HTML block elements
    const paragraphs = content.match(/<p[^>]*>.*?<\/p>/gi) || [];
    const divs = content.match(/<div[^>]*>.*?<\/div>/gi) || [];
    const headers = content.match(/<h[1-6][^>]*>.*?<\/h[1-6]>/gi) || [];
    const blockElements = paragraphs.length + divs.length + headers.length;

    return {
      plainText,
      length: plainText.length,
      lines: lines.length,
      words: words.length,
      sentences: sentences.length,
      blockElements,
      isEmpty: plainText.length === 0,
      isPlaceholder: plainText === "Start writing your document here...",
      hasSubstantialContent: plainText.length >= 50 && words.length >= 8,
      estimatedReadingTime: Math.ceil(words.length / 200) // minutes
    };
  },

  // Calculate content change significance
  calculateChangeSignificance: (oldContent: string, newContent: string) => {
    const oldAnalysis = ContentAnalyzer.analyzeContent(oldContent);
    const newAnalysis = ContentAnalyzer.analyzeContent(newContent);
    
    const lengthDiff = Math.abs(newAnalysis.length - oldAnalysis.length);
    const wordsDiff = Math.abs(newAnalysis.words - oldAnalysis.words);
    const linesDiff = Math.abs(newAnalysis.lines - oldAnalysis.lines);
    
    return {
      lengthChange: lengthDiff,
      wordsChange: wordsDiff,
      linesChange: linesDiff,
      isSignificant: lengthDiff > 20 || wordsDiff > 5 || linesDiff > 0,
      isPasteDetected: lengthDiff > 100 && wordsDiff > 15
    };
  }
};

// Suggestion timing configuration
const TIMING_CONFIG = {
  INITIAL_FAST: 150,        // Very fast for immediate feedback
  INITIAL_NORMAL: 400,      // Normal typing speed
  PASTE_IMMEDIATE: 100,     // Almost immediate for paste
  SUBSEQUENT_CHECK: 90 * 1000, // 90 seconds for subsequent checks (reduced from 2 minutes)
  DEBOUNCE_TYPING: 800,     // Debounce rapid typing
  PRELOAD_DELAY: 1200,      // Preload suggestions
} as const;

// Content thresholds for triggering suggestions
const CONTENT_THRESHOLDS = {
  MIN_WORDS_FIRST: 5,       // Minimum words for first suggestion
  MIN_WORDS_SUBSEQUENT: 8,  // Minimum words for subsequent suggestions
  MIN_CHARS_FIRST: 25,      // Minimum characters for first suggestion
  MIN_CHARS_SUBSEQUENT: 40, // Minimum characters for subsequent suggestions
  PASTE_MIN_WORDS: 10,      // Minimum words to consider as meaningful paste
  MAX_SUGGESTIONS_BASE: 6,  // Base number of suggestions (increased from 5)
  SUGGESTIONS_PER_100_WORDS: 2, // Additional suggestions per 100 words
} as const;

// Helper function to find text position with enhanced accuracy
function findTextPosition(content: string, searchText: string): { start: number; end: number } | undefined {
  const plainText = ContentAnalyzer.toPlainText(content);
  
  // Try exact match first
  let index = plainText.indexOf(searchText);
  if (index !== -1) {
    return {
      start: index,
      end: index + searchText.length
    };
  }
  
  // Try case-insensitive match
  const lowerPlainText = plainText.toLowerCase();
  const lowerSearchText = searchText.toLowerCase();
  index = lowerPlainText.indexOf(lowerSearchText);
  if (index !== -1) {
    return {
      start: index,
      end: index + searchText.length
    };
  }
  
  // Try fuzzy matching for slight variations
  const words = searchText.split(/\s+/).filter(w => w.length > 0);
  if (words.length > 1) {
    // Try to find the first and last significant words
    const firstWord = words[0];
    const lastWord = words[words.length - 1];
    
    // Case-insensitive word search
    const firstIndex = lowerPlainText.indexOf(firstWord.toLowerCase());
    if (firstIndex !== -1) {
      // Look for the last word within a reasonable distance
      const searchStart = firstIndex;
      const maxDistance = searchText.length * 2; // Allow for some variation
      const searchEnd = Math.min(searchStart + maxDistance, lowerPlainText.length);
      const searchRegion = lowerPlainText.substring(searchStart, searchEnd);
      const lastWordIndex = searchRegion.indexOf(lastWord.toLowerCase());
      
      if (lastWordIndex !== -1) {
        const absoluteLastIndex = searchStart + lastWordIndex;
        return {
          start: firstIndex,
          end: absoluteLastIndex + lastWord.length
        };
      }
    }
  }
  
  // Try partial word matching for single words or short phrases
  if (words.length === 1 || searchText.length < 20) {
    const word = words[0];
    if (word.length >= 4) { // Only for meaningful words
      const wordIndex = lowerPlainText.indexOf(word.toLowerCase());
      if (wordIndex !== -1) {
        // Estimate the end position
        const estimatedEnd = Math.min(wordIndex + searchText.length, plainText.length);
        return {
          start: wordIndex,
          end: estimatedEnd
        };
      }
    }
  }
  
  // Try to find any significant portion of the text (for very different suggestions)
  if (searchText.length > 10) {
    // Take the middle portion of the search text
    const middleStart = Math.floor(searchText.length * 0.25);
    const middleEnd = Math.floor(searchText.length * 0.75);
    const middlePortion = searchText.substring(middleStart, middleEnd);
    
    if (middlePortion.length >= 5) {
      const middleIndex = lowerPlainText.indexOf(middlePortion.toLowerCase());
      if (middleIndex !== -1) {
        // Estimate the start and end
        const estimatedStart = Math.max(0, middleIndex - middleStart);
        const estimatedEnd = Math.min(plainText.length, middleIndex + middlePortion.length + (searchText.length - middleEnd));
        return {
          start: estimatedStart,
          end: estimatedEnd
        };
      }
    }
  }
  
  console.warn(`❌ Could not find position for text: "${searchText.substring(0, 50)}..."`);
  return undefined;
}

// Helper function to categorize suggestion themes based on explanation and text changes
function categorizeSuggestionTheme(suggestion: { originalText: string; suggestedText: string; explanation: string }): string {
  const explanation = suggestion.explanation.toLowerCase();
  const originalText = suggestion.originalText.toLowerCase();
  const suggestedText = suggestion.suggestedText.toLowerCase();
  
  // Grammar and mechanics
  if (explanation.includes('grammar') || explanation.includes('grammatical') || 
      explanation.includes('tense') || explanation.includes('subject-verb') ||
      explanation.includes('punctuation') || explanation.includes('comma') ||
      explanation.includes('period') || explanation.includes('semicolon')) {
    return 'grammar';
  }
  
  // Clarity and readability
  if (explanation.includes('clarity') || explanation.includes('clear') ||
      explanation.includes('readable') || explanation.includes('readability') ||
      explanation.includes('understand') || explanation.includes('confusing') ||
      explanation.includes('ambiguous') || explanation.includes('vague')) {
    return 'clarity';
  }
  
  // Conciseness and wordiness
  if (explanation.includes('concise') || explanation.includes('conciseness') ||
      explanation.includes('wordy') || explanation.includes('verbose') ||
      explanation.includes('redundant') || explanation.includes('repetitive') ||
      suggestedText.length < originalText.length * 0.8) { // Significant length reduction
    return 'conciseness';
  }
  
  // Style and tone
  if (explanation.includes('style') || explanation.includes('tone') ||
      explanation.includes('formal') || explanation.includes('informal') ||
      explanation.includes('professional') || explanation.includes('casual') ||
      explanation.includes('voice') || explanation.includes('flow')) {
    return 'style';
  }
  
  // Word choice and vocabulary
  if (explanation.includes('word choice') || explanation.includes('vocabulary') ||
      explanation.includes('synonym') || explanation.includes('alternative') ||
      explanation.includes('better word') || explanation.includes('more appropriate') ||
      explanation.includes('precise') || explanation.includes('specific')) {
    return 'word-choice';
  }
  
  // Structure and organization
  if (explanation.includes('structure') || explanation.includes('organization') ||
      explanation.includes('paragraph') || explanation.includes('sentence structure') ||
      explanation.includes('transition') || explanation.includes('flow') ||
      explanation.includes('order') || explanation.includes('sequence')) {
    return 'structure';
  }
  
  // Default to general improvement
  return 'general';
}

// Helper function to check if two suggestions overlap in position and theme
function isSimilarSuggestion(
  newSuggestion: { originalText: string; suggestedText: string; explanation: string; position?: { start: number; end: number } },
  existingSuggestion: { originalText: string; suggestedText: string; explanation: string; position?: { start: number; end: number } }
): boolean {
  // Both suggestions must have positions
  if (!newSuggestion.position || !existingSuggestion.position) {
    return false;
  }
  
  const newTheme = categorizeSuggestionTheme(newSuggestion);
  const existingTheme = categorizeSuggestionTheme(existingSuggestion);
  
  // Different themes are always considered different suggestions
  if (newTheme !== existingTheme) {
    return false;
  }
  
  // Check for position overlap
  const newStart = newSuggestion.position.start;
  const newEnd = newSuggestion.position.end;
  const existingStart = existingSuggestion.position.start;
  const existingEnd = existingSuggestion.position.end;
  
  // Calculate overlap
  const overlapStart = Math.max(newStart, existingStart);
  const overlapEnd = Math.min(newEnd, existingEnd);
  const overlapLength = Math.max(0, overlapEnd - overlapStart);
  
  // Consider suggestions similar if they have the same theme and significant position overlap
  const newLength = newEnd - newStart;
  const existingLength = existingEnd - existingStart;
  const minLength = Math.min(newLength, existingLength);
  
  // Require at least 50% overlap of the shorter suggestion
  const overlapThreshold = minLength * 0.5;
  
  const isSimilar = overlapLength >= overlapThreshold;
  
  console.log(`🔍 Comparing suggestions for similarity:`, {
    newTheme,
    existingTheme,
    newPosition: `${newStart}-${newEnd}`,
    existingPosition: `${existingStart}-${existingEnd}`,
    overlapLength,
    overlapThreshold,
    isSimilar,
    newText: newSuggestion.originalText.substring(0, 30) + '...',
    existingText: existingSuggestion.originalText.substring(0, 30) + '...'
  });
  
  return isSimilar;
}

interface UseAISuggestionsProps {
  content: string;
  documentTitle?: string;
  enabled?: boolean;
}

interface SuggestionState {
  suggestions: Suggestion[];
  isGenerating: boolean;
  error: string | null;
  lastAnalysis: ReturnType<typeof ContentAnalyzer.analyzeContent> | null;
  lastGenerationTime: number;
  generationCount: number;
}

export const useAISuggestions = ({ content, documentTitle, enabled = true }: UseAISuggestionsProps) => {
  const [state, setState] = useState<SuggestionState>({
    suggestions: [],
    isGenerating: false,
    error: null,
    lastAnalysis: null,
    lastGenerationTime: 0,
    generationCount: 0
  });

  const { settings } = useUserSettings();
  
  // Memoized content analysis
  const currentAnalysis = useMemo(() => {
    return ContentAnalyzer.analyzeContent(content);
  }, [content]);

  // Calculate dynamic max suggestions based on content
  const maxSuggestions = useMemo(() => {
    const base = CONTENT_THRESHOLDS.MAX_SUGGESTIONS_BASE;
    const additional = Math.floor(currentAnalysis.words / 100) * CONTENT_THRESHOLDS.SUGGESTIONS_PER_100_WORDS;
    return Math.min(base + additional, 12); // Cap at 12 suggestions (increased from 8)
  }, [currentAnalysis.words]);

  // Refs for stable references in callbacks
  const contentRef = useRef(content);
  const documentTitleRef = useRef(documentTitle);
  const currentAnalysisRef = useRef(currentAnalysis);
  const maxSuggestionsRef = useRef(maxSuggestions);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const subsequentTimerRef = useRef<NodeJS.Timeout | null>(null);
  
  // Update refs when values change
  useEffect(() => {
    contentRef.current = content;
  }, [content]);
  
  useEffect(() => {
    documentTitleRef.current = documentTitle;
  }, [documentTitle]);

  useEffect(() => {
    currentAnalysisRef.current = currentAnalysis;
  }, [currentAnalysis]);

  useEffect(() => {
    maxSuggestionsRef.current = maxSuggestions;
  }, [maxSuggestions]);



  // Determine if content meets threshold for suggestions
  const meetsContentThreshold = useCallback((isFirstSuggestion: boolean) => {
    const currentAnalysisValue = currentAnalysisRef.current;
    const isFirst = isFirstSuggestion || state.generationCount === 0;
    const minWords = isFirst ? CONTENT_THRESHOLDS.MIN_WORDS_FIRST : CONTENT_THRESHOLDS.MIN_WORDS_SUBSEQUENT;
    const minChars = isFirst ? CONTENT_THRESHOLDS.MIN_CHARS_FIRST : CONTENT_THRESHOLDS.MIN_CHARS_SUBSEQUENT;

    return currentAnalysisValue.words >= minWords || 
           currentAnalysisValue.length >= minChars ||
           currentAnalysisValue.hasSubstantialContent;
  }, [state.generationCount]);

  // Core suggestion generation function
  const generateSuggestions = useCallback(async (reason: string) => {
    // Get current state values to avoid stale closures
    setState(prev => {
      const currentAnalysisValue = currentAnalysisRef.current;
      const maxSuggestionsValue = maxSuggestionsRef.current;
      
      const { canGenerate, reason: cantReason } = (() => {
        if (!enabled || !settings.openai_api_key) {
          return { canGenerate: false, reason: 'Disabled or no API key' };
        }
        if (currentAnalysisValue.isEmpty || currentAnalysisValue.isPlaceholder) {
          return { canGenerate: false, reason: 'Empty or placeholder content' };
        }
        if (prev.suggestions.length >= maxSuggestionsValue) {
          return { canGenerate: false, reason: 'Max suggestions reached' };
        }
        if (prev.isGenerating) {
          return { canGenerate: false, reason: 'Already generating' };
        }
        return { canGenerate: true, reason: 'Ready' };
      })();
      
      if (!canGenerate) {
        console.log(`❌ Cannot generate suggestions: ${cantReason}`);
        return prev; // No state change
      }

      console.log(`🚀 Generating suggestions - ${reason}`, {
        words: currentAnalysisValue.words,
        length: currentAnalysisValue.length,
        sentences: currentAnalysisValue.sentences,
        currentSuggestions: prev.suggestions.length,
        maxSuggestions: maxSuggestionsValue
      });

      // Start generation
      return { ...prev, isGenerating: true, error: null };
    });

    // Perform the actual generation outside of setState
    try {
      const currentAnalysisValue = currentAnalysisRef.current;
      const maxSuggestionsValue = maxSuggestionsRef.current;
      
      // Determine suggestion type based on content analysis
      let suggestionType: 'general' | 'conciseness' | 'clarity' | 'engagement' = 'general';
      
      if (currentAnalysisValue.words > 100) {
        suggestionType = 'conciseness';
      } else if (currentAnalysisValue.sentences > 5) {
        suggestionType = 'clarity';
      } else if (currentAnalysisValue.estimatedReadingTime > 2) {
        suggestionType = 'engagement';
      }

      const aiSuggestions = await OpenAIService.generateSuggestions({
        content: contentRef.current,
        apiKey: settings.openai_api_key,
        model: settings.ai_model || 'gpt-3.5-turbo',
        suggestionType,
        documentContext: {
          title: documentTitleRef.current,
        }
      });

      // Process and filter suggestions using theme-based similarity detection
      setState(prev => {
        // Skip if no longer generating (component unmounted or state changed)
        if (!prev.isGenerating) {
          return prev;
        }

        const newSuggestions: Suggestion[] = aiSuggestions
          .map((suggestion, index) => {
            const position = findTextPosition(contentRef.current, suggestion.originalText);
            const theme = categorizeSuggestionTheme(suggestion);
            
            return {
              id: `${Date.now()}-${index}`,
              originalText: suggestion.originalText,
              suggestedText: suggestion.suggestedText,
              explanation: suggestion.explanation,
              position: position,
              theme: theme,
            };
          })
          .filter(suggestion => {
            // Filter out invalid suggestions
            const hasPosition = suggestion.position !== undefined;
            const textExists = currentAnalysisValue.plainText.includes(suggestion.originalText);
            const meaningfulChange = suggestion.originalText !== suggestion.suggestedText;
            
            // Check for similar suggestions (same theme + overlapping position)
            const hasSimilarSuggestion = prev.suggestions.some(existing => 
              isSimilarSuggestion(suggestion, existing)
            );

            // Also check for positional overlap regardless of theme to avoid clustering
            const hasPositionalOverlap = suggestion.position && prev.suggestions.some(existing => {
              if (!existing.position) return false;
              const overlapStart = Math.max(suggestion.position!.start, existing.position.start);
              const overlapEnd = Math.min(suggestion.position!.end, existing.position.end);
              const overlapLength = Math.max(0, overlapEnd - overlapStart);
              return overlapLength > 10; // Avoid suggestions too close to each other
            });

            console.log(`🔍 Filtering suggestion "${suggestion.originalText.substring(0, 30)}...":`, {
              theme: suggestion.theme,
              textExists,
              hasPosition,
              hasSimilarSuggestion,
              hasPositionalOverlap,
              meaningfulChange,
              willInclude: hasPosition && textExists && !hasSimilarSuggestion && !hasPositionalOverlap && meaningfulChange,
              position: suggestion.position
            });

            return hasPosition && textExists && !hasSimilarSuggestion && !hasPositionalOverlap && meaningfulChange;
          });

        if (newSuggestions.length > 0) {
          console.log(`✅ Added ${newSuggestions.length} suggestions`);
          return {
            ...prev,
            suggestions: [...prev.suggestions, ...newSuggestions].slice(0, maxSuggestionsValue),
            lastAnalysis: currentAnalysisValue,
            lastGenerationTime: Date.now(),
            generationCount: prev.generationCount + 1,
            isGenerating: false
          };
        } else {
          console.log('❌ No valid suggestions generated');
          return { 
            ...prev, 
            isGenerating: false,
            lastGenerationTime: Date.now(),
            generationCount: prev.generationCount + 1
          };
        }
      });

    } catch (error) {
      console.error('💥 Error generating suggestions:', error);
      setState(prev => ({
        ...prev,
        isGenerating: false,
        error: error instanceof Error ? error.message : 'Failed to generate suggestions',
        lastAnalysis: currentAnalysisRef.current, // Update lastAnalysis to prevent infinite retries
        lastGenerationTime: Date.now(),
        generationCount: prev.generationCount + 1
      }));
    }
  }, [enabled, settings.openai_api_key]);

    // Handle content changes with intelligent triggering
  useEffect(() => {
    // Clear existing timers
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    if (!enabled || !settings.openai_api_key) {
      return;
    }

    // Prevent triggering if already generating
    if (state.isGenerating) {
      return;
    }

    // Add cooldown period after errors to prevent infinite retries
    if (state.error && Date.now() - state.lastGenerationTime < 10000) { // 10 second cooldown after error
      return;
    }

    const isFirstSuggestion = state.generationCount === 0;
    const timeSinceLastGeneration = Date.now() - state.lastGenerationTime;
    
    // Analyze content changes
    const currentAnalysisValue = currentAnalysisRef.current;
    const changeAnalysis = state.lastAnalysis 
      ? ContentAnalyzer.calculateChangeSignificance(
          state.lastAnalysis.plainText, 
          currentAnalysisValue.plainText
        )
      : { isSignificant: true, isPasteDetected: false, lengthChange: currentAnalysisValue.length };

    // Don't retry if content hasn't changed since last attempt (prevents infinite loops)
    if (state.lastAnalysis && !changeAnalysis.isSignificant && state.generationCount > 0) {
      return;
    }

    // Determine trigger timing and conditions
    let shouldTrigger = false;
    let delay: number = TIMING_CONFIG.INITIAL_NORMAL;
    let reason = '';

    if (isFirstSuggestion) {
      if (changeAnalysis.isPasteDetected && currentAnalysisValue.words >= CONTENT_THRESHOLDS.PASTE_MIN_WORDS) {
        shouldTrigger = true;
        delay = TIMING_CONFIG.PASTE_IMMEDIATE;
        reason = 'Initial paste detected';
      } else if (meetsContentThreshold(true)) {
        shouldTrigger = true;
        delay = currentAnalysisValue.words >= 10 ? TIMING_CONFIG.INITIAL_FAST : TIMING_CONFIG.INITIAL_NORMAL;
        reason = 'Initial content threshold met';
      }
    } else {
      // Subsequent suggestions - analyze entire document for more suggestions
      if (meetsContentThreshold(false) && 
          state.suggestions.length < maxSuggestions) { // Only if we can add more suggestions
        
        // For existing content, allow suggestions if enough time has passed OR if content has changed
        const hasTimeElapsed = timeSinceLastGeneration > 15000; // Reduced from 30s to 15s
        const hasContentChanged = changeAnalysis.isSignificant;
        const hasSubstantialContent = currentAnalysisValue.words >= 50; // More substantial content threshold
        
        if ((hasTimeElapsed && hasSubstantialContent) || hasContentChanged) {
          shouldTrigger = true;
          delay = hasContentChanged ? TIMING_CONFIG.DEBOUNCE_TYPING : TIMING_CONFIG.INITIAL_NORMAL;
          reason = hasContentChanged ? 'Significant content change' : 'Analyzing existing content for more suggestions';
        }
      }
    }

    if (shouldTrigger) {
      console.log(`⏰ Scheduling suggestion generation: ${reason} (delay: ${delay}ms)`);
      
      // Clear previous errors when attempting new generation
      if (state.error) {
        setState(prev => ({ ...prev, error: null }));
      }
      
      debounceTimerRef.current = setTimeout(() => {
        generateSuggestions(reason);
      }, delay);
    }

    // Cleanup
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [content, enabled, settings.openai_api_key, generateSuggestions, meetsContentThreshold, state.lastAnalysis, state.generationCount, state.lastGenerationTime, state.isGenerating, state.suggestions.length]);

  // Set up periodic checks for subsequent suggestions
  useEffect(() => {
    if (!enabled || !settings.openai_api_key || state.generationCount === 0 || state.isGenerating) {
      return;
    }

    const checkForUpdates = () => {
      // Don't check if currently generating
      if (state.isGenerating) {
        return;
      }

      const timeSinceLastGeneration = Date.now() - state.lastGenerationTime;
      
      if (timeSinceLastGeneration > TIMING_CONFIG.SUBSEQUENT_CHECK && 
          state.suggestions.length < maxSuggestionsRef.current) {
        const currentAnalysisValue = currentAnalysisRef.current;
        const changeAnalysis = state.lastAnalysis 
          ? ContentAnalyzer.calculateChangeSignificance(
              state.lastAnalysis.plainText, 
              currentAnalysisValue.plainText
            )
          : { isSignificant: true };

        // More lenient conditions for periodic checks - analyze substantial content even without changes
        const hasSubstantialContent = currentAnalysisValue.words >= 50;
        const shouldAnalyze = changeAnalysis.isSignificant || 
                             (hasSubstantialContent && meetsContentThreshold(false));

        if (shouldAnalyze) {
          console.log('⏰ Periodic check triggering suggestions - analyzing existing content');
          generateSuggestions('Periodic full document analysis');
        }
      }
    };

    subsequentTimerRef.current = setInterval(checkForUpdates, TIMING_CONFIG.SUBSEQUENT_CHECK);

    return () => {
      if (subsequentTimerRef.current) {
        clearInterval(subsequentTimerRef.current);
      }
    };
  }, [enabled, settings.openai_api_key, state.generationCount, state.lastGenerationTime, state.lastAnalysis, meetsContentThreshold, generateSuggestions, state.isGenerating, state.suggestions.length]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      if (subsequentTimerRef.current) {
        clearInterval(subsequentTimerRef.current);
      }
    };
  }, []);

  // Utility functions
  const removeSuggestion = useCallback((suggestionId: string) => {
    setState(prev => ({
      ...prev,
      suggestions: prev.suggestions.filter(s => s.id !== suggestionId)
    }));
  }, []);

  const clearAllSuggestions = useCallback(() => {
    setState(prev => ({
      ...prev,
      suggestions: []
    }));
  }, []);

  const manuallyTriggerSuggestions = useCallback(() => {
    if (meetsContentThreshold(false)) {
      generateSuggestions('Manual full document analysis');
    }
  }, [generateSuggestions, meetsContentThreshold]);

  return {
    suggestions: state.suggestions,
    isGenerating: state.isGenerating,
    error: state.error,
    removeSuggestion,
    clearAllSuggestions,
    hasApiKey: !!settings.openai_api_key,
    manuallyTriggerSuggestions,
    // Additional useful data
    contentAnalysis: currentAnalysis,
    maxSuggestions,
    canGenerateMore: state.suggestions.length < maxSuggestions
  };
}; 