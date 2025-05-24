-- Create the documents table
CREATE TABLE documents (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL DEFAULT 'Untitled Document',
  content TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create an index on updated_at for faster sorting
CREATE INDEX idx_documents_updated_at ON documents(updated_at DESC);

-- Create a function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create a trigger to automatically update updated_at when a row is modified
CREATE TRIGGER update_documents_updated_at
    BEFORE UPDATE ON documents
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (RLS)
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;

-- Create policy to allow all operations for now (you can modify this based on your authentication needs)
-- For authenticated users only, uncomment the line below and comment out the one after
-- CREATE POLICY "Enable all operations for authenticated users" ON documents FOR ALL USING (auth.role() = 'authenticated');

-- For now, allow all operations (remove this in production and implement proper authentication)
CREATE POLICY "Enable all operations for everyone" ON documents FOR ALL USING (true); 