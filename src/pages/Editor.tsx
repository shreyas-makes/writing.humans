import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Editor from '@/components/Editor';
import SuggestionPanel, { type Suggestion } from '@/components/SuggestionPanel';
import { useToast } from '@/hooks/use-toast';
import { useIsMobile } from '@/hooks/use-mobile';
import { useDocuments } from '@/hooks/useDocuments';
import { useAuth } from '@/contexts/AuthContext';
import { useAISuggestions } from '@/hooks/useAISuggestions';
import { FileText, ArrowLeft, Settings, User, LogOut, Bold, Italic, Underline, Eye, EyeOff, Share, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import LogoHeader from '@/components/ui/LogoHeader';

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
  const [blueIndicatorsVisible, setBlueIndicatorsVisible] = useState(true);
  
  const isMobile = useIsMobile();
  const { toast } = useToast();
  const { user, signOut, loading: authLoading } = useAuth();
  
  const {
    currentDocument,
    isLoading,
    isSaving,
    loadDocument,
    saveDocument,
    createDocumentWithId,
    createShareLink,
  } = useDocuments();

  const {
    suggestions,
    isGenerating,
    error: aiError,
    removeSuggestion,
    hasApiKey,
    manuallyTriggerSuggestions,
  } = useAISuggestions({ content, enabled: aiPanelOpen, documentTitle });

  // Calculate max suggestions based on document length (1 suggestion per 5 lines)
  const calculateMaxSuggestions = (textContent: string) => {
    const plainText = textContent.replace(/<[^>]*>?/gm, '');
    // Count lines more accurately by considering both \n and estimated line breaks
    const explicitLines = plainText.split('\n').length;
    // Estimate lines based on content length (assuming ~80 characters per line)
    const estimatedLines = Math.ceil(plainText.length / 80);
    // Use the higher of the two to account for long lines
    const lines = Math.max(explicitLines, estimatedLines);
    return Math.max(1, Math.floor(lines / 5)); // At least 1 suggestion, 1 per 5 lines
  };

  // useEffect to log suggestion data for debugging
  useEffect(() => {
    console.log("🎯 AI Suggestions Hook Data:", {
      suggestions,
      suggestionsCount: suggestions?.length || 0,
      isGenerating,
      aiError,
      hasApiKey,
      aiPanelOpen,
      blueIndicatorsVisible,
      content: content.substring(0, 100) + '...',
      contentLength: content.length
    });
    // Check if any suggestions have position data
    if (suggestions && suggestions.length > 0) {
      suggestions.forEach(s => {
        if (!s.position) {
          console.warn(`❌ Suggestion ID ${s.id} is missing position data.`);
        } else {
          console.log(`✅ Suggestion ID ${s.id} has position:`, s.position);
        }
      });
    } else {
      console.log("📭 No suggestions available");
    }
  }, [suggestions, isGenerating, aiError, hasApiKey, aiPanelOpen, blueIndicatorsVisible, content]);

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

  const handleShare = async () => {
    if (!documentId) {
      toast({
        title: "Error",
        description: "Document must be saved before sharing.",
        variant: "destructive",
      });
      return;
    }

    // Ensure document is saved before sharing
    if (hasUnsavedChanges) {
      await handleSave();
    }

    await createShareLink(documentId);
  };

  const getSaveStatusText = () => {
    switch (saveStatus) {
      case 'saving':
        return (
          <div className="flex items-center gap-1 px-2 py-1 bg-blue-50 text-blue-600 rounded-full text-xs font-medium">
            <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse"></div>
            Saving
          </div>
        );
      case 'unsaved':
        return (
          <div className="flex items-center gap-1 px-2 py-1 bg-orange-50 text-orange-600 rounded-full text-xs font-medium">
            <div className="w-1.5 h-1.5 bg-orange-500 rounded-full"></div>
            Unsaved
          </div>
        );
      case 'saved':
        return (
          <div className="flex items-center gap-1 px-2 py-1 bg-green-50 text-green-600 rounded-full text-xs font-medium">
            <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
            Saved
          </div>
        );
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
      {/* Minimal Header for focused writing */}
      <header className="border-b border-gray-200 bg-gray-50 sticky top-0 z-10">
        <div className="container flex items-center justify-between h-12 sm:h-14 px-3 sm:px-6">
          <div className="flex items-center gap-2 sm:gap-4 flex-1 min-w-0">
            <LogoHeader onClick={() => navigate('/home')} minimal />
            <input
              type="text"
              value={documentTitle}
              onChange={(e) => setDocumentTitle(e.target.value)}
              className="bg-transparent border-none outline-none focus:ring-0 text-sm sm:text-base font-medium text-gray-800 placeholder-gray-400 min-w-0 flex-1 truncate"
              placeholder="Untitled Document"
              aria-label="Document title"
            />
          </div>
          
          {/* Desktop Actions */}
          <div className="hidden md:flex items-center gap-2">
            {/* Formatting Options */}
            <div className="flex items-center border-r border-gray-200 pr-2 mr-2">
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0 hover:bg-gray-100" onClick={handleToggleBold} title="Bold">
                <Bold className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0 hover:bg-gray-100" onClick={handleToggleItalic} title="Italic">
                <Italic className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0 hover:bg-gray-100" onClick={handleToggleUnderline} title="Underline">
                <Underline className="h-4 w-4" />
              </Button>
            </div>
            {getSaveStatusText()}
            <Button 
              variant="ghost" 
              size="sm"
              onClick={handleShare}
              className="h-8 w-8 p-0 hover:bg-gray-100"
              title="Share document"
              disabled={!documentId}
            >
              <Share size={16} />
            </Button>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => {
                const newAiPanelOpenState = !aiPanelOpen;
                setAiPanelOpen(newAiPanelOpenState);
                setSelectedSuggestion(null);
              }}
              className="h-8 w-8 p-0 hover:bg-gray-100"
              title={aiPanelOpen ? "Hide AI Suggestions" : "Show AI Suggestions"}
            >
              {aiPanelOpen ? <EyeOff size={16} /> : <Eye size={16} />}
            </Button>
            
            {/* Blue Indicator Toggle */}
            <div className="flex items-center gap-2 border-l border-gray-200 pl-2 ml-2">
              <Switch
                checked={blueIndicatorsVisible}
                onCheckedChange={setBlueIndicatorsVisible}
                className="data-[state=checked]:bg-blue-500 scale-75"
              />
            </div>
            {/* Simplified User Menu */}
            {user && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0 hover:bg-gray-100">
                    <User size={16} />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>{user.email}</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => navigate('/settings')}>
                    <Settings className="mr-2 h-4 w-4" />
                    Settings
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={signOut}>
                    <LogOut className="mr-2 h-4 w-4" />
                    Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>

          {/* Mobile Actions - Essential buttons only */}
          <div className="flex md:hidden items-center gap-1">
            {saveStatus === 'unsaved' && (
              <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
            )}
            {saveStatus === 'saving' && (
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
            )}
            {saveStatus === 'saved' && (
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            )}
            
            <Button 
              variant="ghost" 
              size="sm"
              onClick={handleShare}
              className="h-8 w-8 p-0 hover:bg-gray-100"
              title="Share document"
              disabled={!documentId}
            >
              <Share size={16} />
            </Button>
            
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => {
                const newAiPanelOpenState = !aiPanelOpen;
                setAiPanelOpen(newAiPanelOpenState);
                setSelectedSuggestion(null);
              }}
              className="h-8 w-8 p-0 hover:bg-gray-100"
              title={aiPanelOpen ? "Hide AI Suggestions" : "Show AI Suggestions"}
            >
              {aiPanelOpen ? <EyeOff size={16} /> : <Eye size={16} />}
            </Button>

            {/* Mobile User Menu */}
            {user && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0 hover:bg-gray-100">
                    <User size={16} />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel className="text-xs">{user.email}</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleToggleBold}>
                    <Bold className="mr-2 h-4 w-4" />
                    Bold
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleToggleItalic}>
                    <Italic className="mr-2 h-4 w-4" />
                    Italic
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleToggleUnderline}>
                    <Underline className="mr-2 h-4 w-4" />
                    Underline
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => setBlueIndicatorsVisible(!blueIndicatorsVisible)}>
                    <Eye className="mr-2 h-4 w-4" />
                    {blueIndicatorsVisible ? 'Hide' : 'Show'} Indicators
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => navigate('/settings')}>
                    <Settings className="mr-2 h-4 w-4" />
                    Settings
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={signOut}>
                    <LogOut className="mr-2 h-4 w-4" />
                    Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>
      </header>
      
      <div className="flex flex-1 overflow-hidden">
        {/* Main Editor - Takes full width when AI panel is closed */}
        <div className={`flex-1 overflow-auto p-3 sm:p-6 md:p-8 ${!aiPanelOpen && "w-full"}`}>
          <Editor 
            content={content} 
            onContentChange={setContent}
            suggestions={suggestions} // Pass all suggestions to Editor
            onSuggestionIndicatorClick={handleSuggestionIndicatorClick} // Pass handler for dot clicks
            blueIndicatorsVisible={blueIndicatorsVisible}
          />
        </div>
        
        {/* AI Suggestions Panel */}
        {aiPanelOpen && (
          <aside className={`bg-light-gray border-l border-border ${isMobile ? 'fixed inset-y-0 right-0 z-20 w-full sm:w-3/4' : 'w-80 lg:w-96'} overflow-y-auto`}>
            <div className="sticky top-0 bg-light-gray p-3 sm:p-4 border-b border-border">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <h2 className="font-medium text-dark-gray text-sm sm:text-base">Edits suggested</h2>
                  {isGenerating && (
                    <div className="w-3 h-3 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" title="Generating AI suggestions..."></div>
                  )}
                </div>
                {isMobile && (
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => setAiPanelOpen(false)}
                    className="h-8 w-8 p-0"
                  >
                    <X size={16} />
                  </Button>
                )}
              </div>
            </div>
            <SuggestionPanel 
              suggestion={selectedSuggestion} // Pass the selected suggestion to SuggestionPanel
              isGenerating={isGenerating} // Pass loading state for better UX
              hasApiKey={hasApiKey} // Debug: API key status
              suggestions={suggestions} // Debug: All suggestions
              error={aiError} // Debug: Any errors
            />
          </aside>
        )}
      </div>
    </div>
  );
};

export default EditorPage; 