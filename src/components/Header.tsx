
import React from 'react';
import { Button } from '@/components/ui/button';
import { Bold, Italic, Underline } from 'lucide-react';

interface HeaderProps {
  documentTitle: string;
  onDocumentTitleChange: (title: string) => void;
  onToggleAiPanel: () => void;
  aiPanelOpen: boolean;
}

const Header = ({ 
  documentTitle, 
  onDocumentTitleChange, 
  onToggleAiPanel,
  aiPanelOpen 
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
        </div>
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center border-r pr-3 mr-3">
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
              <Bold className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
              <Italic className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
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
