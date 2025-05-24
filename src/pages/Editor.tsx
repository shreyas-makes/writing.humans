import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Header from '@/components/Header';
import Editor from '@/components/Editor';
import SuggestionPanel from '@/components/SuggestionPanel';
import { type Suggestion } from '@/components/SuggestionPanel';
import { useToast } from '@/hooks/use-toast';
import { useIsMobile } from '@/hooks/use-mobile';
import { useDocuments } from '@/hooks/useDocuments';
import { FileText, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

const EditorPage = () => {
  const { documentId } = useParams<{ documentId: string }>();
  const navigate = useNavigate();
  const [documentTitle, setDocumentTitle] = useState("Untitled Document");
  const [content, setContent] = useState("<p>Start writing your document here...</p>");
  const [aiPanelOpen, setAiPanelOpen] = useState(true);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [lastSavedContent, setLastSavedContent] = useState("");
  const [lastSavedTitle, setLastSavedTitle] = useState("");
  
  const isMobile = useIsMobile();
  const { toast } = useToast();
  
  const {
    currentDocument,
    isLoading,
    isSaving,
    loadDocument,
    saveDocument,
  } = useDocuments();

  // Load document when component mounts or documentId changes
  useEffect(() => {
    if (documentId) {
      loadDocument(documentId);
    }
  }, [documentId, loadDocument]);

  // Check for unsaved changes
  useEffect(() => {
    const hasChanges = content !== lastSavedContent || documentTitle !== lastSavedTitle;
    setHasUnsavedChanges(hasChanges);
  }, [content, documentTitle, lastSavedContent, lastSavedTitle]);

  // Auto-save every 30 seconds if there are unsaved changes
  useEffect(() => {
    if (!hasUnsavedChanges || !documentId) return;

    const autoSaveTimer = setTimeout(() => {
      handleSave();
    }, 30000); // 30 seconds

    return () => clearTimeout(autoSaveTimer);
  }, [hasUnsavedChanges, content, documentTitle, documentId]);

  // Load document when currentDocument changes
  useEffect(() => {
    if (currentDocument) {
      setDocumentTitle(currentDocument.title);
      setContent(currentDocument.content);
      setLastSavedTitle(currentDocument.title);
      setLastSavedContent(currentDocument.content);
      setHasUnsavedChanges(false);
    }
  }, [currentDocument]);

  // Mock function to generate AI suggestions based on content
  useEffect(() => {
    const timer = setTimeout(() => {
      if (content.trim() !== "<p>Start writing your document here...</p>" && content.length > 50) {
        generateMockSuggestion(content);
      }
    }, 2000);
    
    return () => clearTimeout(timer);
  }, [content]);

  const generateMockSuggestion = (currentContent: string) => {
    if (suggestions.length >= 3) return;
    
    let plainText = currentContent.replace(/<[^>]*>?/gm, '');
    
    if (plainText.length < 50) return;
    
    const startIdx = Math.floor(Math.random() * (plainText.length - 30));
    const endIdx = Math.min(startIdx + Math.floor(Math.random() * 20) + 10, plainText.length);
    const extractedText = plainText.substring(startIdx, endIdx);
    
    if (suggestions.some(s => s.originalText === extractedText)) return;
    if (extractedText.length < 5) return;
    
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

  const handleSave = async () => {
    if (!documentId) return;
    
    const savedDoc = await saveDocument(documentTitle, content, documentId);
    if (savedDoc) {
      setLastSavedTitle(documentTitle);
      setLastSavedContent(content);
      setHasUnsavedChanges(false);
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

  const handleToggleBold = () => {
    document.execCommand('bold', false, undefined);
  };

  const handleToggleItalic = () => {
    document.execCommand('italic', false, undefined);
  };

  const handleToggleUnderline = () => {
    document.execCommand('underline', false, undefined);
  };

  const handleBackToHome = () => {
    if (hasUnsavedChanges) {
      const confirmExit = window.confirm("You have unsaved changes. Do you want to save before leaving?");
      if (confirmExit) {
        handleSave();
      }
    }
    navigate('/');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">Loading document...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* Clean Header without document list toggle */}
      <header className="border-b border-border bg-background sticky top-0 z-10">
        <div className="container flex items-center justify-between h-14 px-4">
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handleBackToHome}
              className="flex items-center gap-2"
            >
              <ArrowLeft size={16} />
              <span className="hidden sm:inline">Back</span>
            </Button>
            <h1 className="font-semibold text-soft-blue">writing.humans</h1>
            <input
              type="text"
              value={documentTitle}
              onChange={(e) => setDocumentTitle(e.target.value)}
              className="bg-transparent border-none outline-none focus:ring-0 text-lg font-medium"
              aria-label="Document title"
            />
            {hasUnsavedChanges && (
              <span className="text-xs text-orange-500 font-medium">• Unsaved</span>
            )}
          </div>
          <div className="flex items-center gap-3">
            <Button 
              onClick={handleSave}
              size="sm"
              disabled={isSaving}
              className="flex items-center gap-2"
            >
              {isSaving ? 'Saving...' : 'Save'}
            </Button>

            <div className="hidden sm:flex items-center border-r pr-3 mr-3">
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={handleToggleBold}>
                <span className="font-bold">B</span>
              </Button>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={handleToggleItalic}>
                <span className="italic">I</span>
              </Button>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={handleToggleUnderline}>
                <span className="underline">U</span>
              </Button>
            </div>
            <Button 
              variant={aiPanelOpen ? "secondary" : "outline"} 
              onClick={() => setAiPanelOpen(!aiPanelOpen)}
              className="text-xs sm:text-sm"
            >
              {aiPanelOpen ? "Hide AI Suggestions" : "Show AI Suggestions"}
            </Button>
          </div>
        </div>
      </header>
      
      <div className="flex flex-1 overflow-hidden">
        {/* Main Editor - Takes full width when AI panel is closed */}
        <div className={`flex-1 overflow-auto p-6 md:p-8 ${!aiPanelOpen && "w-full"}`}>
          <Editor content={content} onContentChange={setContent} />
        </div>
        
        {/* AI Suggestions Panel */}
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

export default EditorPage; 