import React, { useState, useRef, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { type Suggestion } from '@/components/SuggestionPanel';

interface EditorProps {
  content: string;
  onContentChange: (content: string) => void;
  suggestions?: Suggestion[];
  onSuggestionIndicatorClick?: (suggestion: Suggestion) => void;
}

const Editor = ({ content, onContentChange, suggestions = [], onSuggestionIndicatorClick }: EditorProps) => {
  const { toast } = useToast();
  const editorRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [currentVersion, setCurrentVersion] = useState(content);

  // Update the rendered content when the content prop changes
  useEffect(() => {
    if (editorRef.current && content !== currentVersion) {
      editorRef.current.innerHTML = content;
      setCurrentVersion(content);
    }
  }, [content, currentVersion]);

  // Render suggestion indicators when suggestions change
  useEffect(() => {
    if (!editorRef.current || !containerRef.current || !onSuggestionIndicatorClick) return;

    // Remove existing suggestion indicators
    const existingIndicators = containerRef.current.querySelectorAll('.suggestion-indicator');
    existingIndicators.forEach(indicator => indicator.remove());

    // Add new suggestion indicators
    suggestions.forEach(suggestion => {
      if (!suggestion.position) return;

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
            onSuggestionIndicatorClick(suggestion);
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
  }, [suggestions, onSuggestionIndicatorClick]);

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
    if (editorRef.current) {
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
  };

  return (
    <div ref={containerRef} className="editor-container relative">
      <div 
        ref={editorRef}
        className="editor prose prose-sm sm:prose-base lg:prose-lg"
        contentEditable
        onInput={handleInput}
        onKeyDown={handleKeyDown}
        suppressContentEditableWarning={true}
      />
    </div>
  );
};

export default Editor;
