
import React, { useState, useEffect } from 'react';
import Header from './Header';
import Editor from './Editor';
import SuggestionPanel from './SuggestionPanel';
import { type Suggestion } from './SuggestionPanel';
import { useToast } from '@/hooks/use-toast';
import { useIsMobile } from '@/hooks/use-mobile';

const DocEditor = () => {
  const [documentTitle, setDocumentTitle] = useState("Untitled Document");
  const [content, setContent] = useState("<p>Start writing your document here...</p>");
  const [aiPanelOpen, setAiPanelOpen] = useState(true);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const isMobile = useIsMobile();
  const { toast } = useToast();

  // Mock function to generate AI suggestions based on content
  useEffect(() => {
    const timer = setTimeout(() => {
      if (content.trim() !== "<p>Start writing your document here...</p>" && content.length > 50) {
        // This is just a mock - in a real app, you'd call an API for AI suggestions
        generateMockSuggestion(content);
      }
    }, 2000);
    
    return () => clearTimeout(timer);
  }, [content]);

  const generateMockSuggestion = (currentContent: string) => {
    // Only generate a suggestion if we don't have too many already
    if (suggestions.length >= 3) return;
    
    // Extract some text from the content for the mock suggestion
    let plainText = currentContent.replace(/<[^>]*>?/gm, '');
    
    if (plainText.length < 50) return;
    
    // Create a random selection of text to suggest a change for
    const startIdx = Math.floor(Math.random() * (plainText.length - 30));
    const endIdx = Math.min(startIdx + Math.floor(Math.random() * 20) + 10, plainText.length);
    const extractedText = plainText.substring(startIdx, endIdx);
    
    // Skip if we've already suggested this text
    if (suggestions.some(s => s.originalText === extractedText)) return;

    // Don't suggest if text is too short
    if (extractedText.length < 5) return;
    
    // Mock suggestions
    const suggestionsOptions = [
      {
        suggestedText: extractedText.charAt(0).toUpperCase() + extractedText.slice(1),
        explanation: "Consider capitalizing the first letter for better readability."
      },
      {
        suggestedText: extractedText.replace(/\s+/g, ' ').trim(),
        explanation: "I noticed extra spaces. This is a cleaner version."
      },
      {
        suggestedText: extractedText.replace(/\b(very|really)\b/gi, 'significantly'),
        explanation: "Replace vague intensifiers with more specific language."
      }
    ];
    
    // Select a random suggestion option
    const suggestionOption = suggestionsOptions[Math.floor(Math.random() * suggestionsOptions.length)];
    
    if (extractedText !== suggestionOption.suggestedText) {
      const newSuggestion: Suggestion = {
        id: Date.now().toString(),
        originalText: extractedText,
        suggestedText: suggestionOption.suggestedText,
        explanation: suggestionOption.explanation
      };
      
      setSuggestions(prev => [...prev, newSuggestion]);
    }
  };

  const handleAcceptSuggestion = (suggestion: Suggestion) => {
    let newContent = content;
    newContent = newContent.replace(suggestion.originalText, suggestion.suggestedText);
    setContent(newContent);
    
    setSuggestions(prev => prev.filter(s => s.id !== suggestion.id));
    
    toast({
      title: "Suggestion accepted",
      description: "The change has been applied to your document.",
    });
  };

  const handleRejectSuggestion = (suggestion: Suggestion) => {
    setSuggestions(prev => prev.filter(s => s.id !== suggestion.id));
    
    toast({
      title: "Suggestion rejected",
      description: "The suggestion has been dismissed.",
    });
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header 
        documentTitle={documentTitle} 
        onDocumentTitleChange={setDocumentTitle} 
        onToggleAiPanel={() => setAiPanelOpen(!aiPanelOpen)}
        aiPanelOpen={aiPanelOpen}
      />
      
      <div className="flex flex-1 overflow-hidden">
        <div className={`flex-1 overflow-auto p-4 md:p-8 ${!aiPanelOpen && "w-full"}`}>
          <Editor content={content} onContentChange={setContent} />
        </div>
        
        {aiPanelOpen && (
          <aside className={`bg-light-gray border-l border-border ${isMobile ? 'fixed inset-y-0 right-0 z-20 w-3/4' : 'w-80 lg:w-96'} overflow-y-auto`}>
            <div className="sticky top-0 bg-light-gray p-4 border-b border-border">
              <h2 className="font-medium text-dark-gray">AI Suggestions</h2>
              <p className="text-xs text-muted-foreground mt-1">
                AI will suggest improvements as you write
              </p>
            </div>
            <SuggestionPanel 
              suggestions={suggestions}
              onAcceptSuggestion={handleAcceptSuggestion}
              onRejectSuggestion={handleRejectSuggestion}
            />
          </aside>
        )}
      </div>
    </div>
  );
};

export default DocEditor;
