import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Editor from '@/components/Editor';
import { useToast } from '@/hooks/use-toast';
import { useDocuments } from '@/hooks/useDocuments';
import { FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';

const SharedDocumentPage = () => {
  const { shareToken } = useParams<{ shareToken: string }>();
  const navigate = useNavigate();
  const [documentTitle, setDocumentTitle] = useState("Shared Document");
  const [content, setContent] = useState("");
  const [notFound, setNotFound] = useState(false);
  const [expired, setExpired] = useState(false);
  
  const { toast } = useToast();
  
  const {
    currentDocument,
    isLoading,
    loadSharedDocument,
  } = useDocuments();

  // Load shared document when component mounts
  useEffect(() => {
    if (shareToken) {
      console.log('Loading shared document with token:', shareToken);
      loadSharedDocument(shareToken).then((result) => {
        if (result && typeof result === 'object') {
          if ('notFound' in result) {
            setNotFound(true);
          } else if ('expired' in result) {
            setExpired(true);
          }
        }
      });
    }
  }, [shareToken, loadSharedDocument]);

  // Update local state when document loads
  useEffect(() => {
    if (currentDocument) {
      setDocumentTitle(currentDocument.title);
      setContent(currentDocument.content);
    }
  }, [currentDocument]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">Loading...</p>
        </div>
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center max-w-md">
          <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h1 className="text-xl font-semibold text-gray-900 mb-2">Document Not Found</h1>
          <p className="text-gray-500 mb-4">
            This document doesn't exist or the link is invalid.
          </p>
        </div>
      </div>
    );
  }

  if (expired) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center max-w-md">
          <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h1 className="text-xl font-semibold text-gray-900 mb-2">Link Expired</h1>
          <p className="text-gray-500 mb-4">
            This link has expired or is no longer active.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Document content - clean and focused */}
      <div className="max-w-4xl mx-auto px-3 sm:px-6 py-4 sm:py-6 md:px-8 md:py-16">
        <Editor 
          content={content} 
          onContentChange={() => {}} // Read-only, no changes allowed
          suggestions={[]} // No AI suggestions for shared documents
          onSuggestionIndicatorClick={() => {}} // No suggestion interactions
          blueIndicatorsVisible={false} // No blue indicators for shared documents
          readOnly={true} // Make the editor read-only
        />
        
        {/* Subtle footnote */}
        <div className="mt-4 pt-6 sm:pt-8 border-t border-gray-100">
          <p className="text-xs text-gray-400 text-center">
            This essay is 100% written by a human on{' '}
            <a 
              href="/" 
              className="text-gray-400 hover:text-gray-500 transition-colors underline"
              target="_blank"
              rel="noopener noreferrer"
            >
              writing.humans
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default SharedDocumentPage; 