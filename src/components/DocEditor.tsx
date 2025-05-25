import React, { useState, useEffect } from 'react';


import Header from './Header';
import Editor from './Editor';
import SuggestionPanel from './SuggestionPanel';
import DocumentList from './DocumentList';
import { type Suggestion } from './SuggestionPanel';
import { useToast } from '@/hooks/use-toast';
import { useIsMobile } from '@/hooks/use-mobile';
import { useDocuments } from '@/hooks/useDocuments';

const DocEditor = () => {
  const [documentTitle, setDocumentTitle] = useState("Untitled Document");
  const [content, setContent] = useState("<p>Start writing your document here...</p>");
  const [aiPanelOpen, setAiPanelOpen] = useState(true);
  const [documentListOpen, setDocumentListOpen] = useState(true);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [lastSavedContent, setLastSavedContent] = useState("");
  const [lastSavedTitle, setLastSavedTitle] = useState("");
  const [blueIndicatorsVisible, setBlueIndicatorsVisible] = useState(true);
  
  const isMobile = useIsMobile();
  const { toast } = useToast();
  
  const {
    documents,
    currentDocument,
    isLoading,
    isSaving,
    loadDocument,
    saveDocument,
    deleteDocument,
    createNewDocument,
  } = useDocuments();

  // Check for unsaved changes
  useEffect(() => {
    const hasChanges = content !== lastSavedContent || documentTitle !== lastSavedTitle;
    setHasUnsavedChanges(hasChanges);
  }, [content, documentTitle, lastSavedContent, lastSavedTitle]);

  // Auto-save every 30 seconds if there are unsaved changes
  useEffect(() => {
    if (!hasUnsavedChanges) return;

    const autoSaveTimer = setTimeout(() => {
      handleSave();
    }, 30000); // 30 seconds

    return () => clearTimeout(autoSaveTimer);
  }, [hasUnsavedChanges, content, documentTitle]);

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
    const savedDoc = await saveDocument(documentTitle, content, currentDocument?.id);
    if (savedDoc) {
      setLastSavedTitle(documentTitle);
      setLastSavedContent(content);
      setHasUnsavedChanges(false);
    }
  };

  const handleDocumentSelect = async (document: any) => {
    if (hasUnsavedChanges) {
      const confirmSwitch = window.confirm("You have unsaved changes. Do you want to save before switching documents?");
      if (confirmSwitch) {
        await handleSave();
      }
    }
    
    await loadDocument(document.id);
  };

  const handleNewDocument = () => {
    if (hasUnsavedChanges) {
      const confirmNew = window.confirm("You have unsaved changes. Do you want to save before creating a new document?");
      if (confirmNew) {
        handleSave();
      }
    }
    
    createNewDocument();
    setDocumentTitle("Untitled Document");
    setContent("<p>Start writing your document here...</p>");
    setLastSavedTitle("");
    setLastSavedContent("");
    setHasUnsavedChanges(false);
    setSuggestions([]);
  };

  const handleDeleteDocument = async (id: string) => {
    const confirmDelete = window.confirm("Are you sure you want to delete this document? This action cannot be undone.");
    if (confirmDelete) {
      await deleteDocument(id);
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

  // Close document list on mobile when AI panel is open
  useEffect(() => {
    if (isMobile && aiPanelOpen) {
      setDocumentListOpen(false);
    }
  }, [isMobile, aiPanelOpen]);

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header 
        documentTitle={documentTitle} 
        onDocumentTitleChange={setDocumentTitle}
        onToggleAiPanel={() => setAiPanelOpen(!aiPanelOpen)}
        aiPanelOpen={aiPanelOpen}
        onToggleBold={handleToggleBold}
        onToggleItalic={handleToggleItalic}
        onToggleUnderline={handleToggleUnderline}
        onSave={handleSave}
        onToggleDocumentList={() => setDocumentListOpen(!documentListOpen)}
        documentListOpen={documentListOpen}
        isSaving={isSaving}
        hasUnsavedChanges={hasUnsavedChanges}
        onToggleBlueIndicators={() => setBlueIndicatorsVisible(!blueIndicatorsVisible)}
        blueIndicatorsVisible={blueIndicatorsVisible}
      />
      
      <div className="flex flex-1 overflow-hidden">
        {/* Document List Sidebar */}
        {documentListOpen && !isMobile && (
          <DocumentList
            documents={documents}
            currentDocument={currentDocument}
            isLoading={isLoading}
            onDocumentSelect={handleDocumentSelect}
            onNewDocument={handleNewDocument}
            onDeleteDocument={handleDeleteDocument}
          />
        )}
        
        {/* Main Editor */}
        <div className={`flex-1 overflow-auto p-6 md:p-4 ${!aiPanelOpen && "w-full"}`}>
          <Editor 
            content={content} 
            onContentChange={setContent}
            blueIndicatorsVisible={blueIndicatorsVisible}
          />
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
              suggestion={suggestions.length > 0 ? suggestions[0] : null}
            />
          </aside>
        )}
      </div>

      {/* Mobile Document List Overlay */}
      {documentListOpen && isMobile && (
        <div className="fixed inset-0 z-30 bg-black bg-opacity-50" onClick={() => setDocumentListOpen(false)}>
          <div className="fixed inset-y-0 left-0 w-80 bg-white" onClick={(e) => e.stopPropagation()}>
            <DocumentList
              documents={documents}
              currentDocument={currentDocument}
              isLoading={isLoading}
              onDocumentSelect={(doc) => {
                handleDocumentSelect(doc);
                setDocumentListOpen(false);
              }}
              onNewDocument={() => {
                handleNewDocument();
                setDocumentListOpen(false);
              }}
              onDeleteDocument={handleDeleteDocument}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default DocEditor;
