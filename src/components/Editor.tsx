
import React, { useState, useRef, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';

interface EditorProps {
  content: string;
  onContentChange: (content: string) => void;
}

const Editor = ({ content, onContentChange }: EditorProps) => {
  const { toast } = useToast();
  const editorRef = useRef<HTMLDivElement>(null);
  const [currentVersion, setCurrentVersion] = useState(content);

  // Update the rendered content when the content prop changes
  useEffect(() => {
    if (editorRef.current && content !== currentVersion) {
      editorRef.current.innerHTML = content;
      setCurrentVersion(content);
    }
  }, [content, currentVersion]);

  const handleInput = () => {
    if (editorRef.current) {
      const newContent = editorRef.current.innerHTML;
      onContentChange(newContent);
      setCurrentVersion(newContent);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 's' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      toast({
        title: "Document saved",
        description: "All changes have been saved.",
      });
    }
  };

  return (
    <div className="editor-container">
      <div 
        ref={editorRef}
        className="editor prose prose-sm sm:prose-base lg:prose-lg"
        contentEditable
        onInput={handleInput}
        onKeyDown={handleKeyDown}
        suppressContentEditableWarning={true}
        dangerouslySetInnerHTML={{ __html: content }}
      />
    </div>
  );
};

export default Editor;
