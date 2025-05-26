import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Bold, Italic, Underline, Save, FileText, Loader2, User, LogOut, Settings, Eye, Menu, X } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAuth } from '@/contexts/AuthContext';

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
  onLogoClick?: () => void;
  onToggleBlueIndicators?: () => void;
  blueIndicatorsVisible?: boolean;
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
  hasUnsavedChanges = false,
  onLogoClick,
  onToggleBlueIndicators,
  blueIndicatorsVisible = true
}: HeaderProps) => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const renderLogo = () => (
    <h1 className="font-semibold text-soft-blue text-sm sm:text-base">writing.humans</h1>
  );

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  return (
    <>
      <header className="border-b border-border bg-light-gray sticky top-0 z-50">
        <div className="container flex items-center justify-between h-12 sm:h-14 px-3 sm:px-4">
          {/* Left side - Logo and Title */}
          <div className="flex items-center gap-2 sm:gap-4 flex-1 min-w-0">
            {onLogoClick ? (
              <button onClick={onLogoClick} className="p-0 h-auto bg-transparent border-none cursor-pointer flex-shrink-0">
                {renderLogo()}
              </button>
            ) : (
              <div className="flex-shrink-0">{renderLogo()}</div>
            )}
            <input
              type="text"
              value={documentTitle}
              onChange={(e) => onDocumentTitleChange(e.target.value)}
              className="bg-transparent border-none outline-none focus:ring-0 text-sm sm:text-lg font-medium min-w-0 flex-1 truncate"
              placeholder="Untitled Document"
              aria-label="Document title"
            />
          </div>

          {/* Desktop Actions */}
          <div className="hidden md:flex items-center gap-3">
            <Button 
              variant={documentListOpen ? "secondary" : "outline"} 
              onClick={onToggleDocumentList}
              size="sm"
              className="flex items-center gap-2"
            >
              <FileText size={16} />
              <span>Documents</span>
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
              <span>{isSaving ? 'Saving...' : 'Save'}</span>
            </Button>

            <div className="flex items-center border-r pr-3 mr-3">
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

            {hasUnsavedChanges && (
              <span className="text-xs text-orange-500 font-medium">• Unsaved</span>
            )}

            <Button 
              variant={aiPanelOpen ? "secondary" : "outline"} 
              onClick={onToggleAiPanel}
              size="sm"
            >
              {aiPanelOpen ? "Hide AI" : "Show AI"}
            </Button>

            {onToggleBlueIndicators && (
              <Switch
                checked={blueIndicatorsVisible}
                onCheckedChange={onToggleBlueIndicators}
                className="data-[state=checked]:bg-blue-500"
              />
            )}

            {user && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="flex items-center gap-2">
                    <User size={16} />
                    <span>{user.email}</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>My Account</DropdownMenuLabel>
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
            {hasUnsavedChanges && (
              <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
            )}
            
            <Button 
              onClick={onSave}
              size="sm"
              disabled={isSaving}
              variant="ghost"
              className="h-8 w-8 p-0"
            >
              {isSaving ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <Save size={16} />
              )}
            </Button>

            <Button 
              variant="ghost" 
              size="sm"
              onClick={toggleMobileMenu}
              className="h-8 w-8 p-0"
            >
              {mobileMenuOpen ? <X size={16} /> : <Menu size={16} />}
            </Button>
          </div>
        </div>
      </header>

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-40 bg-black bg-opacity-50" onClick={toggleMobileMenu}>
          <div className="absolute top-12 sm:top-14 right-0 left-0 bg-white border-b border-gray-200 shadow-lg" onClick={(e) => e.stopPropagation()}>
            <div className="p-4 space-y-3">
              {/* AI Panel Toggle */}
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">AI Suggestions</span>
                <Button 
                  variant={aiPanelOpen ? "secondary" : "outline"} 
                  onClick={() => {
                    onToggleAiPanel();
                    setMobileMenuOpen(false);
                  }}
                  size="sm"
                >
                  {aiPanelOpen ? "Hide" : "Show"}
                </Button>
              </div>

              {/* Blue Indicators Toggle */}
              {onToggleBlueIndicators && (
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Blue Indicators</span>
                  <Switch
                    checked={blueIndicatorsVisible}
                    onCheckedChange={onToggleBlueIndicators}
                    className="data-[state=checked]:bg-blue-500"
                  />
                </div>
              )}

              {/* Formatting Tools */}
              <div className="border-t pt-3">
                <span className="text-sm font-medium text-gray-600 block mb-2">Formatting</span>
                <div className="flex items-center gap-2">
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
              </div>

              {/* Documents */}
              <div className="border-t pt-3">
                <Button 
                  variant={documentListOpen ? "secondary" : "outline"} 
                  onClick={() => {
                    onToggleDocumentList();
                    setMobileMenuOpen(false);
                  }}
                  size="sm"
                  className="w-full flex items-center gap-2"
                >
                  <FileText size={16} />
                  Documents
                </Button>
              </div>

              {/* User Menu */}
              {user && (
                <div className="border-t pt-3 space-y-2">
                  <div className="text-sm text-gray-600">{user.email}</div>
                  <div className="flex flex-col gap-2">
                    <Button 
                      variant="ghost" 
                      onClick={() => {
                        navigate('/settings');
                        setMobileMenuOpen(false);
                      }}
                      size="sm"
                      className="w-full justify-start"
                    >
                      <Settings className="mr-2 h-4 w-4" />
                      Settings
                    </Button>
                    <Button 
                      variant="ghost" 
                      onClick={() => {
                        signOut();
                        setMobileMenuOpen(false);
                      }}
                      size="sm"
                      className="w-full justify-start"
                    >
                      <LogOut className="mr-2 h-4 w-4" />
                      Sign Out
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Header;
