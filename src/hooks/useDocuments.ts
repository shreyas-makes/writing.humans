import { useState, useEffect } from 'react'
import { supabase, testSupabaseConnection, type Document } from '@/lib/supabase'
import { useToast } from '@/hooks/use-toast'

export const useDocuments = () => {
  const [documents, setDocuments] = useState<Document[]>([])
  const [currentDocument, setCurrentDocument] = useState<Document | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const { toast } = useToast()

  // Test connection on mount
  useEffect(() => {
    const testConnection = async () => {
      const result = await testSupabaseConnection()
      if (!result.success) {
        console.error('❌ Supabase connection failed:', result.error)
        toast({
          title: "Database Connection Error",
          description: "Failed to connect to database. Check console for details.",
          variant: "destructive",
        })
      }
    }
    testConnection()
  }, [])

  // Load all documents
  const loadDocuments = async () => {
    setIsLoading(true)
    try {
      const { data, error } = await supabase
        .from('documents')
        .select('*')
        .order('updated_at', { ascending: false })

      if (error) {
        console.error('Supabase error details:', error)
        throw error
      }
      setDocuments(data || [])
    } catch (error) {
      console.error('Error loading documents:', error)
      toast({
        title: "Error",
        description: `Failed to load documents: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Load a specific document
  const loadDocument = async (id: string) => {
    setIsLoading(true)
    try {
      const { data, error } = await supabase
        .from('documents')
        .select('*')
        .eq('id', id)
        .single()

      if (error) {
        console.error('Supabase error details:', error)
        throw error
      }
      setCurrentDocument(data)
      return data
    } catch (error) {
      console.error('Error loading document:', error)
      toast({
        title: "Error",
        description: `Failed to load document: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: "destructive",
      })
      return null
    } finally {
      setIsLoading(false)
    }
  }

  // Save or update a document
  const saveDocument = async (title: string, content: string, id?: string) => {
    setIsSaving(true)
    try {
      console.log('Attempting to save document:', { title, contentLength: content.length, id })
      
      if (id) {
        // Update existing document
        const { data, error } = await supabase
          .from('documents')
          .update({
            title,
            content,
            updated_at: new Date().toISOString(),
          })
          .eq('id', id)
          .select()
          .single()

        if (error) {
          console.error('Supabase update error details:', error)
          throw error
        }
        setCurrentDocument(data)
        
        // Update the document in the documents list
        setDocuments(prev => 
          prev.map(doc => doc.id === id ? data : doc)
        )
        
        toast({
          title: "Document updated",
          description: "Your changes have been saved.",
        })
        
        return data
      } else {
        // Create new document
        const { data, error } = await supabase
          .from('documents')
          .insert({
            title,
            content,
          })
          .select()
          .single()

        if (error) {
          console.error('Supabase insert error details:', error)
          throw error
        }
        setCurrentDocument(data)
        setDocuments(prev => [data, ...prev])
        
        toast({
          title: "Document saved",
          description: "Your document has been created.",
        })
        
        return data
      }
    } catch (error) {
      console.error('Error saving document:', error)
      console.error('Error details:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        error
      })
      
      toast({
        title: "Error",
        description: `Failed to save document: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: "destructive",
      })
      return null
    } finally {
      setIsSaving(false)
    }
  }

  // Delete a document
  const deleteDocument = async (id: string) => {
    try {
      const { error } = await supabase
        .from('documents')
        .delete()
        .eq('id', id)

      if (error) {
        console.error('Supabase delete error details:', error)
        throw error
      }
      
      setDocuments(prev => prev.filter(doc => doc.id !== id))
      
      // If we're deleting the current document, clear it
      if (currentDocument?.id === id) {
        setCurrentDocument(null)
      }
      
      toast({
        title: "Document deleted",
        description: "The document has been removed.",
      })
      
      return true
    } catch (error) {
      console.error('Error deleting document:', error)
      toast({
        title: "Error",
        description: `Failed to delete document: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: "destructive",
      })
      return false
    }
  }

  // Create a new document (clears current document)
  const createNewDocument = () => {
    setCurrentDocument(null)
  }

  // Auto-save functionality
  const autoSave = async (title: string, content: string, documentId?: string) => {
    if (!title.trim() || !content.trim()) return
    
    try {
      await saveDocument(title, content, documentId)
    } catch (error) {
      console.error('Auto-save failed:', error)
    }
  }

  // Load documents on mount
  useEffect(() => {
    loadDocuments()
  }, [])

  return {
    documents,
    currentDocument,
    isLoading,
    isSaving,
    loadDocuments,
    loadDocument,
    saveDocument,
    deleteDocument,
    createNewDocument,
    autoSave,
  }
} 