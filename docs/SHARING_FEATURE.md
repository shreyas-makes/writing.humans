# Document Sharing Feature

## Overview

The document sharing feature allows users to create shareable links for their documents that can be viewed by anyone with the link, without requiring authentication.

## How It Works

### Database Schema

The sharing functionality is built on a new `document_shares` table with the following structure:

- `id`: Unique identifier for the share record
- `document_id`: Reference to the shared document
- `share_token`: Unique token used in the shareable URL
- `created_by`: User who created the share
- `created_at`: When the share was created
- `expires_at`: Optional expiration date (NULL means never expires)
- `is_active`: Boolean flag to enable/disable the share

### Security

- Row Level Security (RLS) is enabled on all tables
- Users can only create shares for documents they own
- Anyone can view documents through active, non-expired share links
- Share tokens are randomly generated UUIDs with hyphens removed

### User Interface

#### Creating a Share Link

1. Open any document in the editor
2. Click the paper airplane (Send) icon in the header toolbar
3. The system will:
   - Ensure the document is saved
   - Generate a unique share token
   - Create a share record in the database
   - Copy the shareable URL to the clipboard
   - Show a success notification

#### Viewing Shared Documents

1. Anyone with a share link can visit `/shared/{shareToken}`
2. The shared document page shows:
   - Document title and content in read-only mode
   - "Shared Document" badge
   - Link to create an account on writing.humans
   - No AI suggestions or editing capabilities

### Error Handling

The system handles several error cases:

- **Document Not Found**: Shows error page if share token is invalid
- **Expired Link**: Shows error page if share has expired or is inactive
- **Unsaved Changes**: Automatically saves document before creating share
- **Permission Errors**: Only document owners can create shares

### API Endpoints

The sharing feature uses the following Supabase operations:

- `INSERT` into `document_shares` to create new shares
- `SELECT` from `document_shares` to validate share tokens
- `SELECT` from `documents` to fetch shared document content

### URL Structure

Shareable URLs follow this pattern:
```
https://your-domain.com/shared/{shareToken}
```

Where `{shareToken}` is a 32-character string (UUID with hyphens removed).

## Usage Examples

### Creating a Share

```typescript
const shareUrl = await createShareLink(documentId);
// Returns: "https://your-domain.com/shared/abc123def456..."
```

### Loading a Shared Document

```typescript
const result = await loadSharedDocument(shareToken);
// Returns document data or error object
```

## Future Enhancements

Potential improvements to the sharing feature:

1. **Expiration Settings**: Allow users to set custom expiration dates
2. **Password Protection**: Add optional password protection for shares
3. **View Analytics**: Track how many times a document has been viewed
4. **Share Management**: UI to view and manage existing shares
5. **Permissions**: Different permission levels (view, comment, edit) 