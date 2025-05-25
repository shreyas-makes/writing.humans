-- Create the documents table
CREATE TABLE IF NOT EXISTS documents (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL DEFAULT 'Untitled Document',
  content TEXT NOT NULL DEFAULT '',
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create the document_shares table for shareable links
CREATE TABLE IF NOT EXISTS document_shares (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  document_id UUID REFERENCES documents(id) ON DELETE CASCADE,
  share_token TEXT UNIQUE NOT NULL,
  created_by UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT NULL, -- NULL means never expires
  is_active BOOLEAN DEFAULT TRUE
);

-- Create the user_settings table
CREATE TABLE IF NOT EXISTS user_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  openai_api_key TEXT,
  ai_model TEXT DEFAULT 'gpt-3.5-turbo',
  suggestion_frequency TEXT DEFAULT 'normal', -- 'low', 'normal', 'high'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_documents_updated_at ON documents(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_settings_user_id ON user_settings(user_id);
CREATE INDEX IF NOT EXISTS idx_document_shares_token ON document_shares(share_token);
CREATE INDEX IF NOT EXISTS idx_document_shares_document_id ON document_shares(document_id);

-- Create a function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers to automatically update updated_at when a row is modified
DROP TRIGGER IF EXISTS update_documents_updated_at ON documents;
CREATE TRIGGER update_documents_updated_at
    BEFORE UPDATE ON documents
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_user_settings_updated_at ON user_settings;
CREATE TRIGGER update_user_settings_updated_at
    BEFORE UPDATE ON user_settings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (RLS)
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_shares ENABLE ROW LEVEL SECURITY;

-- Remove any existing policies before creating new ones
DROP POLICY IF EXISTS "Enable all operations for everyone" ON documents; 
DROP POLICY IF EXISTS "Users can insert their own documents" ON documents;
DROP POLICY IF EXISTS "Users can view their own documents" ON documents;
DROP POLICY IF EXISTS "Users can update their own documents" ON documents;
DROP POLICY IF EXISTS "Users can delete their own documents" ON documents;

DROP POLICY IF EXISTS "Users can insert their own settings" ON user_settings;
DROP POLICY IF EXISTS "Users can view their own settings" ON user_settings;
DROP POLICY IF EXISTS "Users can update their own settings" ON user_settings;
DROP POLICY IF EXISTS "Users can delete their own settings" ON user_settings;

-- Documents policies
CREATE POLICY "Users can insert their own documents"
ON documents
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own documents"
ON documents
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Anyone can view shared documents"
ON documents
FOR SELECT
TO anon, authenticated
USING (
  EXISTS (
    SELECT 1 FROM document_shares 
    WHERE document_shares.document_id = documents.id 
    AND document_shares.is_active = true 
    AND (document_shares.expires_at IS NULL OR document_shares.expires_at > NOW())
  )
);

CREATE POLICY "Users can update their own documents"
ON documents
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own documents"
ON documents
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- User settings policies
CREATE POLICY "Users can insert their own settings"
ON user_settings
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own settings"
ON user_settings
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own settings"
ON user_settings
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own settings"
ON user_settings
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- Document shares policies
CREATE POLICY "Users can create shares for their own documents"
ON document_shares
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = created_by AND 
  EXISTS (
    SELECT 1 FROM documents 
    WHERE documents.id = document_shares.document_id 
    AND documents.user_id = auth.uid()
  )
);

CREATE POLICY "Users can view their own document shares"
ON document_shares
FOR SELECT
TO authenticated
USING (auth.uid() = created_by);

CREATE POLICY "Anyone can view active shares by token"
ON document_shares
FOR SELECT
TO anon, authenticated
USING (is_active = true AND (expires_at IS NULL OR expires_at > NOW()));

CREATE POLICY "Users can update their own document shares"
ON document_shares
FOR UPDATE
TO authenticated
USING (auth.uid() = created_by)
WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can delete their own document shares"
ON document_shares
FOR DELETE
TO authenticated
USING (auth.uid() = created_by); 
