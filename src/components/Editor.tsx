import React, { useState, useRef, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { type Suggestion } from '@/components/SuggestionPanel';

interface EditorProps {
  content: string;
  onContentChange: (content: string) => void;
  suggestions?: Suggestion[];
  onSuggestionIndicatorClick?: (suggestion: Suggestion, indicatorElement?: Element) => void;
  blueIndicatorsVisible?: boolean;
  readOnly?: boolean;
  showingDiffFor?: string | null;
  onAcceptSuggestion?: (suggestion: Suggestion) => void;
  onRejectSuggestion?: (suggestion: Suggestion) => void;
}

// Helper functions for diffing (adapted from Landing.tsx)
function splitText(text: string): string[] {
  return text.match(/(\w+)|(\s+)|([^\w\s])/g) || [];
}

function computeLCS(arr1: string[], arr2: string[]): string[] {
  const m = arr1.length;
  const n = arr2.length;
  const dp = Array(m + 1).fill(null).map(() => Array(n + 1).fill(0));

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (arr1[i - 1] === arr2[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1] + 1;
      } else {
        dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
      }
    }
  }

  const lcs: string[] = [];
  let i = m;
  let j = n;
  while (i > 0 && j > 0) {
    if (arr1[i - 1] === arr2[j - 1]) {
      lcs.unshift(arr1[i - 1]);
      i--;
      j--;
    } else if (dp[i - 1][j] > dp[i][j - 1]) {
      i--;
    } else {
      j--;
    }
  }
  return lcs;
}

function generateDiff(originalWords: string[], suggestedWords: string[], lcs: string[]): Array<[number, string]> {
  const diff: Array<[number, string]> = [];
  let i = 0; // Pointer for originalWords
  let j = 0; // Pointer for suggestedWords
  let k = 0; // Pointer for lcs

  while (k < lcs.length) {
    // Consume deletions from originalWords
    while (i < originalWords.length && originalWords[i] !== lcs[k]) {
      diff.push([-1, originalWords[i]]);
      i++;
    }
    // Consume additions from suggestedWords
    while (j < suggestedWords.length && suggestedWords[j] !== lcs[k]) {
      diff.push([1, suggestedWords[j]]);
      j++;
    }
    
    // Consume common LCS element
    if (i < originalWords.length && j < suggestedWords.length && k < lcs.length && 
        originalWords[i] === lcs[k] && suggestedWords[j] === lcs[k]) {
      diff.push([0, lcs[k]]);
      i++;
      j++;
      k++;
    } else {
      break; 
    }
  }

  // Append remaining deletions from originalWords
  while (i < originalWords.length) {
    diff.push([-1, originalWords[i]]);
    i++;
  }

  // Append remaining additions from suggestedWords
  while (j < suggestedWords.length) {
    diff.push([1, suggestedWords[j]]);
    j++;
  }

  return diff;
}

const DiffDisplay = ({ originalText, suggestedText }: { originalText: string; suggestedText: string }) => {
  const originalWords = splitText(originalText);
  const suggestedWords = splitText(suggestedText);
  const lcs = computeLCS(originalWords, suggestedWords);
  const diffs = generateDiff(originalWords, suggestedWords, lcs);

  return (
    <span className="inline-block">
      {diffs.map(([type, text], index) => {
        if (type === 0) { // Common
          return <span key={index}>{text}</span>;
        } else if (type === -1) { // Deleted
          if (text.trim() === '' && text.includes('\n')) return <span key={index}>{text}</span>;
          if (text.trim() === '') return <span key={index}>{text}</span>;
          return <span key={index} className="bg-red-500/20 dark:bg-red-500/30 line-through decoration-red-500/70 dark:decoration-red-400/70 rounded-sm px-0.5 mx-[-0.5px]">{text}</span>;
        } else { // Added (type === 1)
          if (text.trim() === '' && text.includes('\n')) return <span key={index}>{text}</span>;
          if (text.trim() === '') return <span key={index}>{text}</span>;
          return <span key={index} className="bg-green-500/20 dark:bg-green-500/30 rounded-sm px-0.5 mx-[-0.5px]">{text}</span>;
        }
      })}
    </span>
  );
};

const Editor = ({ 
  content, 
  onContentChange, 
  suggestions = [], 
  onSuggestionIndicatorClick, 
  blueIndicatorsVisible = true, 
  readOnly = false,
  showingDiffFor = null,
  onAcceptSuggestion,
  onRejectSuggestion
}: EditorProps) => {
  const { toast } = useToast();
  const editorRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [currentVersion, setCurrentVersion] = useState(content);

  // Function to render content with inline diffs for suggestions
  const renderContentWithDiffs = (htmlContent: string) => {
    if (!suggestions.length) {
      return { __html: htmlContent };
    }

    let modifiedContent = htmlContent;

    // First, highlight all text that has suggestions (but isn't currently showing diff)
    suggestions.forEach(suggestion => {
      if (suggestion.id !== showingDiffFor) {
        const originalTextEscaped = suggestion.originalText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const regex = new RegExp(originalTextEscaped, 'g');
        modifiedContent = modifiedContent.replace(regex, `<span class="suggestion-highlight cursor-pointer hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors duration-200" data-suggestion-id="${suggestion.id}" title="Click to see AI suggestion">${suggestion.originalText}</span>`);
      }
    });

    // Then, if we have an active diff, replace it
    if (showingDiffFor) {
      const activeSuggestion = suggestions.find(s => s.id === showingDiffFor);
      if (activeSuggestion) {
        // Remove the highlight for the active suggestion and replace with diff
        const highlightRegex = new RegExp(`<span class="suggestion-highlight[^"]*" data-suggestion-id="${activeSuggestion.id}"[^>]*>${activeSuggestion.originalText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}</span>`, 'g');
        
        // Create the diff display HTML
        const originalWords = splitText(activeSuggestion.originalText);
        const suggestedWords = splitText(activeSuggestion.suggestedText);
        const lcs = computeLCS(originalWords, suggestedWords);
        const diffs = generateDiff(originalWords, suggestedWords, lcs);
        
        let diffHtml = '';
        diffs.forEach(([type, text]) => {
          if (type === 0) { // Common
            diffHtml += text;
          } else if (type === -1) { // Deleted
            if (text.trim() === '' && text.includes('\n')) {
              diffHtml += text;
            } else if (text.trim() === '') {
              diffHtml += text;
            } else {
              diffHtml += `<span class="bg-red-500/20 dark:bg-red-500/30 line-through decoration-red-500/70 dark:decoration-red-400/70 rounded-sm px-0.5 mx-[-0.5px]">${text}</span>`;
            }
          } else { // Added (type === 1)
            if (text.trim() === '' && text.includes('\n')) {
              diffHtml += text;
            } else if (text.trim() === '') {
              diffHtml += text;
            } else {
              diffHtml += `<span class="bg-green-500/20 dark:bg-green-500/30 rounded-sm px-0.5 mx-[-0.5px]">${text}</span>`;
            }
          }
        });
        
        // Add accept/reject buttons after the diff
        const buttonsHtml = `
          <span class="inline-flex items-center gap-1 ml-2 suggestion-actions" data-suggestion-id="${activeSuggestion.id}">
            <button class="accept-suggestion bg-green-500 hover:bg-green-600 text-white text-xs px-2 py-1 rounded" data-suggestion-id="${activeSuggestion.id}">Accept</button>
            <button class="reject-suggestion bg-red-500 hover:bg-red-600 text-white text-xs px-2 py-1 rounded" data-suggestion-id="${activeSuggestion.id}">Reject</button>
          </span>
        `;
        
        modifiedContent = modifiedContent.replace(highlightRegex, `<span class="suggestion-diff" data-suggestion-id="${activeSuggestion.id}">${diffHtml}</span>${buttonsHtml}`);
      }
    }
    
    return { __html: modifiedContent };
  };

  // Update the rendered content when the content prop changes
  useEffect(() => {
    if (editorRef.current && content !== currentVersion) {
      const contentToRender = renderContentWithDiffs(content);
      editorRef.current.innerHTML = contentToRender.__html;
      setCurrentVersion(content);
    }
  }, [content, currentVersion, showingDiffFor, suggestions]);

  // Handle clicks on accept/reject buttons
  useEffect(() => {
    if (!editorRef.current) return;

    const handleButtonClick = (e: Event) => {
      const target = e.target as HTMLElement;
      const suggestionId = target.getAttribute('data-suggestion-id');
      
      if (!suggestionId) return;
      
      const suggestion = suggestions.find(s => s.id === suggestionId);
      if (!suggestion) return;

      if (target.classList.contains('accept-suggestion') && onAcceptSuggestion) {
        e.preventDefault();
        e.stopPropagation();
        onAcceptSuggestion(suggestion);
      } else if (target.classList.contains('reject-suggestion') && onRejectSuggestion) {
        e.preventDefault();
        e.stopPropagation();
        onRejectSuggestion(suggestion);
      }
    };

    editorRef.current.addEventListener('click', handleButtonClick);
    
    return () => {
      if (editorRef.current) {
        editorRef.current.removeEventListener('click', handleButtonClick);
      }
    };
  }, [suggestions, onAcceptSuggestion, onRejectSuggestion]);

  // Handle clicks on text that has suggestions
  useEffect(() => {
    if (!editorRef.current || readOnly) return;

    const handleTextClick = (e: Event) => {
      const target = e.target as HTMLElement;
      
      // Don't interfere with button clicks
      if (target.classList.contains('accept-suggestion') || target.classList.contains('reject-suggestion')) {
        return;
      }

      // Check if clicked on a suggestion highlight
      let suggestionElement = target.closest('.suggestion-highlight, .suggestion-diff') as HTMLElement;
      
      if (suggestionElement) {
        const suggestionId = suggestionElement.getAttribute('data-suggestion-id');
        if (suggestionId) {
          const matchingSuggestion = suggestions.find(s => s.id === suggestionId);
          if (matchingSuggestion && onSuggestionIndicatorClick) {
            e.preventDefault();
            onSuggestionIndicatorClick(matchingSuggestion);
          }
        }
        return;
      }

      // Fallback: Find suggestion that matches text in the clicked element
      const clickedElement = target.closest('p, div, span') as HTMLElement;
      if (!clickedElement) return;
      
      const elementText = clickedElement.textContent || '';
      
      // Find suggestion that matches text in the clicked element
      const matchingSuggestion = suggestions.find(suggestion => {
        return elementText.includes(suggestion.originalText);
      });
      
      if (matchingSuggestion && onSuggestionIndicatorClick) {
        onSuggestionIndicatorClick(matchingSuggestion);
      }
    };

    editorRef.current.addEventListener('click', handleTextClick);
    
    return () => {
      if (editorRef.current) {
        editorRef.current.removeEventListener('click', handleTextClick);
      }
    };
  }, [suggestions, onSuggestionIndicatorClick, showingDiffFor, readOnly]);

  // Render suggestion indicators when suggestions change
  useEffect(() => {
    console.log('🔵 Editor: Rendering suggestion indicators', {
      suggestionsCount: suggestions.length,
      blueIndicatorsVisible,
      hasEditor: !!editorRef.current,
      hasContainer: !!containerRef.current,
      hasClickHandler: !!onSuggestionIndicatorClick,
      suggestions: suggestions.map(s => ({ id: s.id, originalText: s.originalText, hasPosition: !!s.position }))
    });

    if (!editorRef.current || !containerRef.current || !onSuggestionIndicatorClick) {
      console.log('❌ Editor: Missing required refs or click handler');
      return;
    }

    // Remove existing suggestion indicators
    const existingIndicators = containerRef.current.querySelectorAll('.suggestion-indicator');
    console.log('🧹 Editor: Removing', existingIndicators.length, 'existing indicators');
    existingIndicators.forEach(indicator => indicator.remove());

    // Only add indicators if they should be visible
    if (!blueIndicatorsVisible) {
      console.log('👁️ Editor: Blue indicators are hidden');
      return;
    }

    console.log('➕ Editor: Adding', suggestions.length, 'new indicators');

    // Add new suggestion indicators
    suggestions.forEach((suggestion, index) => {
      console.log(`🎯 Editor: Processing suggestion ${index}:`, {
        id: suggestion.id,
        originalText: suggestion.originalText.substring(0, 50) + '...',
        hasPosition: !!suggestion.position,
        position: suggestion.position
      });

      if (!suggestion.position) {
        console.log(`❌ Editor: Suggestion ${index} has no position data`);
        return;
      }

      // Find the position in the editor content to determine which line to place the indicator on
      try {
        const plainText = editorRef.current!.textContent || '';
        const targetPosition = suggestion.position.start;
        
        // Create a range to find the element containing the target position
        const range = document.createRange();
        const walker = document.createTreeWalker(
          editorRef.current!,
          NodeFilter.SHOW_TEXT,
          null
        );

        let currentPos = 0;
        let targetElement: Element | null = null;

        while (walker.nextNode()) {
          const textNode = walker.currentNode as Text;
          const nodeLength = textNode.textContent?.length || 0;
          
          if (currentPos + nodeLength >= targetPosition) {
            // Find the closest block-level element (p, div, etc.)
            let element = textNode.parentElement;
            while (element && element !== editorRef.current) {
              const style = window.getComputedStyle(element);
              if (style.display === 'block' || element.tagName.toLowerCase() === 'p') {
                targetElement = element;
                break;
              }
              element = element.parentElement;
            }
            break;
          }
          currentPos += nodeLength;
        }

        if (targetElement && containerRef.current) {
          // Create the indicator element positioned relative to the container
          const indicator = document.createElement('div');
          indicator.className = 'suggestion-indicator absolute w-3 h-3 bg-blue-500 rounded-full cursor-pointer hover:bg-blue-600 transition-colors z-10';
          indicator.title = 'Click to see AI suggestion';
          
          // Add click handler
          indicator.addEventListener('click', (e) => {
            e.stopPropagation();
            onSuggestionIndicatorClick(suggestion, indicator);
          });

          // Position the indicator relative to the container
          const targetRect = targetElement.getBoundingClientRect();
          const containerRect = containerRef.current.getBoundingClientRect();
          const editorRect = editorRef.current!.getBoundingClientRect();
          
          // Calculate position relative to the container
          const relativeTop = targetRect.top - containerRect.top + targetRect.height / 2 - 6;
          // Position the indicator just outside the editor's right edge, in the margin
          const relativeLeft = editorRect.right - containerRect.left + 40; // 10px to the right of the editor's right edge
          
          indicator.style.left = `${relativeLeft}px`;
          indicator.style.top = `${relativeTop}px`;
          
          // Add to the container so it scrolls with the content
          containerRef.current.appendChild(indicator);
        }
      } catch (error) {
        console.warn('Failed to place suggestion indicator:', error);
      }
    });
  }, [suggestions, onSuggestionIndicatorClick, blueIndicatorsVisible]);

  // Cleanup indicators when component unmounts
  useEffect(() => {
    return () => {
      if (containerRef.current) {
        const existingIndicators = containerRef.current.querySelectorAll('.suggestion-indicator');
        existingIndicators.forEach(indicator => indicator.remove());
      }
    };
  }, []);

  const handleInput = () => {
    if (editorRef.current && !readOnly) {
      const newContent = editorRef.current.innerHTML;
      onContentChange(newContent);
      setCurrentVersion(newContent);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 's' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      // toast({
      //   title: "Document saved",
      //   description: "All changes have been saved.",
      // });
    }

    // Handle suggestion keyboard shortcuts when diff is showing
    if (showingDiffFor && suggestions.length > 0) {
      const activeSuggestion = suggestions.find(s => s.id === showingDiffFor);
      if (activeSuggestion) {
        if (e.key === 'Enter' && onAcceptSuggestion) {
          e.preventDefault();
          onAcceptSuggestion(activeSuggestion);
        } else if (e.key === 'Escape' && onRejectSuggestion) {
          e.preventDefault();
          onRejectSuggestion(activeSuggestion);
        }
      }
    }
  };

  return (
    <div ref={containerRef} className="editor-container relative">
      <style>{`
        .suggestion-actions {
          user-select: none;
          pointer-events: auto;
        }
        .suggestion-actions button {
          font-size: 11px;
          line-height: 1.2;
          padding: 2px 6px;
          border-radius: 3px;
          border: none;
          cursor: pointer;
          transition: all 0.15s ease;
          white-space: nowrap;
        }
        .suggestion-actions button:hover {
          transform: translateY(-1px);
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .suggestion-diff {
          position: relative;
          display: inline;
        }
        .suggestion-highlight {
          border-bottom: 2px dotted #3b82f6;
          border-radius: 2px;
          position: relative;
        }
        .suggestion-highlight:hover {
          background-color: rgba(59, 130, 246, 0.1);
        }
        .editor[contenteditable="true"] .suggestion-actions {
          pointer-events: auto;
          position: relative;
          z-index: 10;
        }
        .editor[contenteditable="true"] .suggestion-actions button {
          pointer-events: auto;
          cursor: pointer;
        }
        .editor[contenteditable="true"] .suggestion-highlight {
          pointer-events: auto;
          cursor: pointer;
        }
      `}</style>
      <div 
        ref={editorRef}
        className={`editor prose prose-sm sm:prose-base lg:prose-lg ${readOnly ? 'cursor-default' : ''}`}
        contentEditable={!readOnly}
        onInput={handleInput}
        onKeyDown={handleKeyDown}
        suppressContentEditableWarning={true}
      />
    </div>
  );
};

export default Editor;
