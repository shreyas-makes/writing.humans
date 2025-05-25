import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Header from '@/components/Header';
import Editor from '@/components/Editor';
import SuggestionPanel, { type Suggestion } from '@/components/SuggestionPanel';
import { useToast } from '@/hooks/use-toast';
import { useIsMobile } from '@/hooks/use-mobile';
import { useDocuments } from '@/hooks/useDocuments';
import { useAuth } from '@/contexts/AuthContext';
import { useAISuggestions } from '@/hooks/useAISuggestions';
import { FileText, ArrowLeft, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';

const EditorPage = () => {
  const { documentId } = useParams<{ documentId: string }>();
  const navigate = useNavigate();
  const [documentTitle, setDocumentTitle] = useState("Untitled Document");
  const [content, setContent] = useState("<p>Start writing your document here...</p>");
  const [aiPanelOpen, setAiPanelOpen] = useState(true);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [lastSavedContent, setLastSavedContent] = useState("");
  const [lastSavedTitle, setLastSavedTitle] = useState("");
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'unsaved'>('saved');
  const [selectedSuggestion, setSelectedSuggestion] = useState<Suggestion | null>(null);
  
  const isMobile = useIsMobile();
  const { toast } = useToast();
  const { user, loading: authLoading } = useAuth();
  
  const {
    currentDocument,
    isLoading,
    isSaving,
    loadDocument,
    saveDocument,
    createDocumentWithId,
  } = useDocuments();

  const {
    suggestions,
    isGenerating,
    error: aiError,
    removeSuggestion,
    hasApiKey,
  } = useAISuggestions({ content, enabled: aiPanelOpen, documentTitle });

  // useEffect to log suggestion data for debugging
  useEffect(() => {
    console.log("AI Suggestions Hook Data:", {
      suggestions,
      isGenerating,
      aiError,
      hasApiKey,
      aiPanelOpen,
    });
    // Check if any suggestions have position data
    if (suggestions && suggestions.length > 0) {
      suggestions.forEach(s => {
        if (!s.position) {
          console.warn(`Suggestion ID ${s.id} is missing position data.`);
        } else {
          console.log(`Suggestion ID ${s.id} has position:`, s.position);
        }
      });
    }
  }, [suggestions, isGenerating, aiError, hasApiKey, aiPanelOpen]);

  // Load document when component mounts or documentId changes
  useEffect(() => {
    if (documentId && user) {
      console.log('Loading document for authenticated user:', user.email);
      loadDocument(documentId).then((result) => {
        if (result && typeof result === 'object' && 'notFound' in result) {
          // Document not found, create a new one
          console.log('Creating new document with ID:', documentId);
          createDocumentWithId(documentId);
        }
      });
    }
  }, [documentId, loadDocument, createDocumentWithId, user]);

  // Check for unsaved changes
  useEffect(() => {
    const hasChanges = content !== lastSavedContent || documentTitle !== lastSavedTitle;
    setHasUnsavedChanges(hasChanges);
    if (hasChanges && saveStatus === 'saved') {
      setSaveStatus('unsaved');
    }
  }, [content, documentTitle, lastSavedContent, lastSavedTitle, saveStatus]);

  // Auto-save every 2 seconds if there are unsaved changes
  useEffect(() => {
    if (!hasUnsavedChanges || !documentId) return;

    const autoSaveTimer = setTimeout(() => {
      handleSave();
    }, 2000); // 2 seconds for more responsive auto-save

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

  const handleSave = async () => {
    if (!documentId) return;
    
    setSaveStatus('saving');
    const savedDoc = await saveDocument(documentTitle, content, documentId);
    if (savedDoc) {
      setLastSavedTitle(documentTitle);
      setLastSavedContent(content);
      setHasUnsavedChanges(false);
      setSaveStatus('saved');
    } else {
      setSaveStatus('unsaved');
    }
  };

  const handleAcceptSuggestion = (suggestionToAccept: Suggestion) => {
    if (!suggestionToAccept) return;
    let newContent = content;
    
    // Apply the change
    newContent = newContent.replace(suggestionToAccept.originalText, suggestionToAccept.suggestedText);
    setContent(newContent);
    
    // Remove from the list of available suggestions
    removeSuggestion(suggestionToAccept.id); 
    setSelectedSuggestion(null); // Clear the selected suggestion
    
    toast({
      title: "Suggestion accepted",
      description: "The change has been applied to your document.",
    });
  };

  const handleRejectSuggestion = (suggestionToReject: Suggestion) => {
    if (!suggestionToReject) return;
    
    // Remove from the list of available suggestions
    removeSuggestion(suggestionToReject.id);
    setSelectedSuggestion(null); // Clear the selected suggestion
    
    toast({
      title: "Suggestion rejected",
      description: "The suggestion has been dismissed.",
    });
  };

  const handleSuggestionIndicatorClick = (suggestion: Suggestion) => {
    setSelectedSuggestion(suggestion);
    // Optionally, ensure the AI panel is open when a dot is clicked
    if (!aiPanelOpen) {
      setAiPanelOpen(true);
    }
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
    // No need for confirmation since auto-save handles everything
    navigate('/home');
  };

  const getSaveStatusText = () => {
    switch (saveStatus) {
      case 'saving':
        return <span className="text-xs text-blue-500 font-medium">• Saving...</span>;
      case 'unsaved':
        return <span className="text-xs text-orange-500 font-medium">• Unsaved</span>;
      case 'saved':
        return <span className="text-xs text-green-500 font-medium">• Saved</span>;
      default:
        return null;
    }
  };

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">
            {authLoading ? 'Checking authentication...' : 'Loading document...'}
          </p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500 mb-4">You need to be signed in to access this document.</p>
          <Button onClick={() => navigate('/login')}>
            Sign In
          </Button>
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
            {getSaveStatusText()}
          </div>
          <div className="flex items-center gap-3">
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
              onClick={() => {
                const newAiPanelOpenState = !aiPanelOpen;
                setAiPanelOpen(newAiPanelOpenState);
                // if (!newAiPanelOpenState) { // If closing panel
                //   setSelectedSuggestion(null); // Clear selection when hiding panel
                // }
                // Let's always clear selection when toggling panel for simplicity,
                // or rely on user clicking a dot again if they re-open.
                setSelectedSuggestion(null);
              }}
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
          <Editor 
            content={content} 
            onContentChange={setContent}
            suggestions={suggestions} // Pass all suggestions to Editor
            onSuggestionIndicatorClick={handleSuggestionIndicatorClick} // Pass handler for dot clicks
          />
        </div>
        
        {/* AI Suggestions Panel */}
        {aiPanelOpen && (
          <aside className={`bg-light-gray border-l border-border ${isMobile ? 'fixed inset-y-0 right-0 z-20 w-3/4' : 'w-80 lg:w-96'} overflow-y-auto`}>
            <div className="sticky top-0 bg-light-gray p-4 border-b border-border">
              <h2 className="font-medium text-dark-gray">AI Suggestion</h2> {/* Changed title */}
              <p className="text-xs text-muted-foreground mt-1">
                {selectedSuggestion ? "Details for the selected suggestion." : "Click an indicator in the text to see a suggestion."}
              </p>
            </div>
            <SuggestionPanel 
              suggestion={selectedSuggestion} // Pass the selected suggestion to SuggestionPanel
            />
          </aside>
        )}
      </div>
    </div>
  );
};

export default EditorPage; 