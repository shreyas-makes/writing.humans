import React from 'react';
import { Button } from '@/components/ui/button';
import { Bold, Italic, Underline, Save, FileText, Loader2 } from 'lucide-react';

interface HeaderProps {
  documentTitle: string;
  onDocumentTitleChange: (title: string) => void;
  onToggleAiPanel: () => void;
  aiPanelOpen: boolean;
  onToggleBold: () => void;
  onToggleItalic: () => void;
  onToggleUnderline: () => void;
  onSave: () => void;
  onToggleDocumentList: () => void;
  documentListOpen: boolean;
  isSaving: boolean;
  hasUnsavedChanges?: boolean;
}

const Header = ({ 
  documentTitle, 
  onDocumentTitleChange, 
  onToggleAiPanel,
  aiPanelOpen,
  onToggleBold,
  onToggleItalic,
  onToggleUnderline,
  onSave,
  onToggleDocumentList,
  documentListOpen,
  isSaving,
  hasUnsavedChanges = false
}: HeaderProps) => {
  return (
    <header className="border-b border-border bg-background sticky top-0 z-10">
      <div className="container flex items-center justify-between h-14 px-4">
        <div className="flex items-center gap-4">
          <h1 className="font-semibold text-soft-blue">writing.humans</h1>
          <input
            type="text"
            value={documentTitle}
            onChange={(e) => onDocumentTitleChange(e.target.value)}
            className="bg-transparent border-none outline-none focus:ring-0 text-lg font-medium"
            aria-label="Document title"
          />
          {hasUnsavedChanges && (
            <span className="text-xs text-orange-500 font-medium">• Unsaved</span>
          )}
        </div>
        <div className="flex items-center gap-3">
          <Button 
            variant={documentListOpen ? "secondary" : "outline"} 
            onClick={onToggleDocumentList}
            size="sm"
            className="flex items-center gap-2"
          >
            <FileText size={16} />
            <span className="hidden sm:inline">Documents</span>
          </Button>
          
          <Button 
            onClick={onSave}
            size="sm"
            disabled={isSaving}
            className="flex items-center gap-2"
          >
            {isSaving ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Save size={16} />
            )}
            <span className="hidden sm:inline">
              {isSaving ? 'Saving...' : 'Save'}
            </span>
          </Button>

          <div className="hidden sm:flex items-center border-r pr-3 mr-3">
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={onToggleBold}>
              <Bold className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={onToggleItalic}>
              <Italic className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={onToggleUnderline}>
              <Underline className="h-4 w-4" />
            </Button>
          </div>
          <Button 
            variant={aiPanelOpen ? "secondary" : "outline"} 
            onClick={onToggleAiPanel}
            className="text-xs sm:text-sm"
          >
            {aiPanelOpen ? "Hide AI Suggestions" : "Show AI Suggestions"}
          </Button>
        </div>
      </div>
    </header>
  );
};

export default Header;
