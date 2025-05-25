import React from 'react';
import { formatDistanceToNow } from 'date-fns';
import { FileText, Plus, Loader2, Edit, Trash2, User, LogOut, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useDocuments } from '@/hooks/useDocuments';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';

const Home = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, signOut } = useAuth();
  const {
    documents,
    isLoading,
    deleteDocument,
    saveDocument,
  } = useDocuments();

  const handleNewDocument = async () => {
    const newDoc = await saveDocument("Untitled Document", "<p>Start writing your document here...</p>");
    if (newDoc) {
      navigate(`/editor/${newDoc.id}`);
    }
  };

  const handleDocumentClick = (documentId: string) => {
    navigate(`/editor/${documentId}`);
  };

  const handleDeleteDocument = async (e: React.MouseEvent, documentId: string) => {
    e.stopPropagation();
    const confirmDelete = window.confirm("Are you sure you want to delete this document? This action cannot be undone.");
    if (confirmDelete) {
      await deleteDocument(documentId);
      toast({
        title: "Document deleted",
        description: "The document has been permanently deleted.",
      });
    }
  };

  const truncateText = (text: string, maxLength: number = 120) => {
    const plainText = text.replace(/<[^>]*>?/gm, '');
    return plainText.length > maxLength 
      ? plainText.substring(0, maxLength) + '...'
      : plainText;
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="border-b border-gray-200 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <FileText className="h-8 w-8 text-blue-600 mr-3" />
              <h1 className="text-xl font-semibold text-gray-900">writing.humans</h1>
            </div>
            
            {/* User Menu */}
            {user && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="flex items-center gap-2">
                    <User size={16} />
                    <span className="hidden sm:inline">{user.email}</span>
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
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Start a new document
          </h2>
          <p className="text-lg text-gray-600 mb-8">
            Create and edit documents with AI-powered suggestions
          </p>
          
          {/* New Document Button */}
          <div className="flex justify-center mb-8">
            <button
              onClick={handleNewDocument}
              className="group relative w-40 h-52 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-400 hover:bg-blue-50 transition-all duration-200 flex flex-col items-center justify-center"
            >
              <Plus className="h-12 w-12 text-gray-400 group-hover:text-blue-500 mb-3" />
              <span className="text-sm font-medium text-gray-600 group-hover:text-blue-700">
                Blank Document
              </span>
            </button>
          </div>
        </div>

        {/* Recent Documents Section */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
            <span className="ml-3 text-gray-500">Loading your documents...</span>
          </div>
        ) : documents.length > 0 ? (
          <div>
            <h3 className="text-xl font-semibold text-gray-900 mb-6">Recent documents</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
              {documents.map((document) => (
                <div
                  key={document.id}
                  onClick={() => handleDocumentClick(document.id)}
                  className="group relative bg-white border border-gray-200 rounded-lg hover:shadow-lg transition-all duration-200 cursor-pointer overflow-hidden"
                >
                  {/* Document Preview */}
                  <div className="aspect-[3/4] bg-gray-50 border-b border-gray-200 p-4 relative">
                    <div className="text-xs text-gray-700 leading-relaxed line-clamp-6">
                      {truncateText(document.content)}
                    </div>
                    
                    {/* Hover Overlay */}
                    <div className="absolute inset-0 bg-blue-600 bg-opacity-90 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center">
                      <Edit className="h-8 w-8 text-white" />
                    </div>
                  </div>

                  {/* Document Info */}
                  <div className="p-4">
                    <h4 className="font-medium text-gray-900 truncate mb-1">
                      {document.title || 'Untitled Document'}
                    </h4>
                    <p className="text-sm text-gray-500">
                      Edited {formatDistanceToNow(new Date(document.updated_at), { addSuffix: true })}
                    </p>
                  </div>

                  {/* Actions */}
                  <button
                    onClick={(e) => handleDeleteDocument(e, document.id)}
                    className="absolute top-2 right-2 p-2 rounded-full bg-white shadow-md opacity-0 group-hover:opacity-100 transition-opacity duration-200 hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="text-center py-12">
            <FileText className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No documents yet</h3>
            <p className="text-gray-500 mb-6">Get started by creating your first document</p>
            <Button onClick={handleNewDocument} className="flex items-center gap-2">
              <Plus size={16} />
              Create Document
            </Button>
          </div>
        )}
      </main>
    </div>
  );
};

export default Home; 