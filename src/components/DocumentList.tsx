import React from 'react'
import { formatDistanceToNow } from 'date-fns'
import { FileText, Plus, Trash2, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { type Document } from '@/lib/supabase'

interface DocumentListProps {
  documents: Document[]
  currentDocument: Document | null
  isLoading: boolean
  onDocumentSelect: (document: Document) => void
  onNewDocument: () => void
  onDeleteDocument: (id: string) => void
}

const DocumentList: React.FC<DocumentListProps> = ({
  documents,
  currentDocument,
  isLoading,
  onDocumentSelect,
  onNewDocument,
  onDeleteDocument
}) => {
  const truncateText = (text: string, maxLength: number = 100) => {
    // Remove HTML tags and get plain text
    const plainText = text.replace(/<[^>]*>?/gm, '')
    return plainText.length > maxLength 
      ? plainText.substring(0, maxLength) + '...'
      : plainText
  }

  return (
    <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Documents</h2>
          <Button
            onClick={onNewDocument}
            size="sm"
            className="flex items-center gap-2"
          >
            <Plus size={16} />
            New
          </Button>
        </div>
      </div>

      {/* Document List */}
      <ScrollArea className="flex-1">
        {isLoading ? (
          <div className="flex items-center justify-center p-8">
            <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
            <span className="ml-2 text-gray-500">Loading documents...</span>
          </div>
        ) : documents.length === 0 ? (
          <div className="p-8 text-center">
            <FileText className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 mb-4">No documents yet</p>
            <Button onClick={onNewDocument} variant="outline" size="sm">
              Create your first document
            </Button>
          </div>
        ) : (
          <div className="p-2">
            {documents.map((document) => (
              <div
                key={document.id}
                className={`group p-3 rounded-lg cursor-pointer border mb-2 transition-all ${
                  currentDocument?.id === document.id
                    ? 'bg-blue-50 border-blue-200'
                    : 'bg-white border-gray-200 hover:bg-gray-50'
                }`}
                onClick={() => onDocumentSelect(document)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-gray-900 truncate mb-1">
                      {document.title || 'Untitled Document'}
                    </h3>
                    <p className="text-sm text-gray-500 mb-2">
                      {truncateText(document.content)}
                    </p>
                    <p className="text-xs text-gray-400">
                      {formatDistanceToNow(new Date(document.updated_at), { addSuffix: true })}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="opacity-0 group-hover:opacity-100 transition-opacity ml-2"
                    onClick={(e) => {
                      e.stopPropagation()
                      onDeleteDocument(document.id)
                    }}
                  >
                    <Trash2 size={14} className="text-red-500" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  )
}

export default DocumentList 