import { useState, useEffect, useCallback } from 'react'
import { supabase, testSupabaseConnection, type Document } from '@/lib/supabase'
import { useToast } from '@/hooks/use-toast'
import { useAuth } from '@/contexts/AuthContext'

export const useDocuments = () => {
  const [documents, setDocuments] = useState<Document[]>([])
  const [currentDocument, setCurrentDocument] = useState<Document | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const { toast } = useToast()
  const { user } = useAuth()

  // Test connection on mount
  useEffect(() => {
    const testConnection = async () => {
      console.log('🔍 Testing Supabase connection...')
      const result = await testSupabaseConnection()
      if (!result.success) {
        console.error('❌ Supabase connection failed:', result.error)
        toast({
          title: "Database Connection Error",
          description: "Failed to connect to database. Check console for details.",
          variant: "destructive",
        })
      } else {
        console.log('✅ Supabase connection successful')
      }
    }
    testConnection()
  }, [toast])

  // Load all documents
  const loadDocuments = useCallback(async () => {
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
  }, [toast])

  // Load a specific document
  const loadDocument = useCallback(async (id: string) => {
    setIsLoading(true)
    try {
      const { data, error } = await supabase
        .from('documents')
        .select('*')
        .eq('id', id)
        .single()

      if (error) {
        console.error('Supabase error details:', error)
        
        // If document not found, return a special error code
        if (error.code === 'PGRST116') {
          console.log('Document not found:', id)
          return { notFound: true, id }
        }
        
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
  }, [toast])

  // Save or update a document
  const saveDocument = useCallback(async (title: string, content: string, id?: string) => {
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
        
        return data
      } else {
        // Create new document
        const { data, error } = await supabase
          .from('documents')
          .insert({
            title,
            content,
            user_id: user?.id, // Use the authenticated user's ID
          })
          .select()
          .single()

        if (error) {
          console.error('Supabase insert error details:', error)
          throw error
        }
        setCurrentDocument(data)
        setDocuments(prev => [data, ...prev])
        
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
  }, [user?.id, toast])

  // Delete a document
  const deleteDocument = useCallback(async (id: string) => {
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
  }, [currentDocument?.id, toast])

  // Create a new document (clears current document)
  const createNewDocument = () => {
    setCurrentDocument(null)
  }

  // Create a document with a specific ID (for URL-based documents)
  const createDocumentWithId = useCallback(async (id: string, title: string = 'Untitled Document', content: string = '<p>Start writing your document here...</p>') => {
    setIsSaving(true)
    try {
      // Use upsert to handle the case where the document might already exist
      const { data, error } = await supabase
        .from('documents')
        .upsert({
          id,
          title,
          content,
          user_id: user?.id,
          updated_at: new Date().toISOString(),
        })
        .select()
        .single()

      if (error) {
        console.error('Supabase upsert error details:', error)
        throw error
      }
      
      setCurrentDocument(data)
      setDocuments(prev => {
        const existing = prev.find(doc => doc.id === id)
        if (existing) {
          return prev.map(doc => doc.id === id ? data : doc)
        } else {
          return [data, ...prev]
        }
      })
      
      return data
    } catch (error) {
      console.error('Error creating document with ID:', error)
      toast({
        title: "Error",
        description: `Failed to create document: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: "destructive",
      })
      return null
    } finally {
      setIsSaving(false)
    }
  }, [user?.id, toast])

  // Auto-save functionality
  const autoSave = useCallback(async (title: string, content: string, documentId?: string) => {
    if (!title.trim() || !content.trim()) return
    
    try {
      await saveDocument(title, content, documentId)
    } catch (error) {
      console.error('Auto-save failed:', error)
    }
  }, [saveDocument])

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
    createDocumentWithId,
    autoSave,
  }
} 