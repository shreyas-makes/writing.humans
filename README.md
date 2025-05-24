# writing.humans - AI-Assisted Document Editor

A clean, minimal document editor with AI suggestions and persistent data storage using Supabase.

## Features

- 📝 Rich text editing with formatting controls
- 🤖 AI-powered writing suggestions
- 💾 Persistent document storage with Supabase
- 📱 Responsive design for mobile and desktop
- 🔄 Auto-save functionality
- 📂 Document management (create, save, load, delete)
- ⚡ Real-time sync across devices

## Tech Stack

- **Frontend**: React 18, TypeScript, Vite
- **UI**: Tailwind CSS, Radix UI components
- **Database**: Supabase (PostgreSQL)
- **State Management**: React hooks, TanStack Query

## Setup Instructions

### 1. Clone and Install Dependencies

```bash
git clone <your-repo-url>
cd blue-scribe-suggest
npm install
```

### 2. Set up Supabase

1. Go to [supabase.com](https://supabase.com) and create a new project
2. In your Supabase dashboard, go to the SQL Editor
3. Copy and paste the contents of `supabase-schema.sql` and run it
4. Go to Settings → API to get your project URL and anon key

### 3. Configure Environment Variables

Create a `.env` file in the root directory:

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

Replace the placeholder values with your actual Supabase project URL and anon key.

### 4. Run the Application

```bash
npm run dev
```

The application will be available at `http://localhost:5173`

## Database Schema

The application uses a simple `documents` table with the following structure:

```sql
documents (
  id UUID PRIMARY KEY,
  title TEXT,
  content TEXT,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
)
```

## Usage

### Document Management

- **Create New Document**: Click the "New" button in the documents sidebar or header
- **Save Document**: Click the "Save" button or use auto-save (every 30 seconds)
- **Load Document**: Click on any document in the documents list
- **Delete Document**: Click the trash icon next to a document in the list

### Writing Features

- **Rich Text Editing**: Use the formatting toolbar for bold, italic, and underline
- **AI Suggestions**: The AI panel provides real-time writing suggestions
- **Auto-Save**: Documents are automatically saved every 30 seconds when there are changes
- **Unsaved Changes Indicator**: See "• Unsaved" next to the document title when there are unsaved changes

### Navigation

- **Documents Panel**: Toggle with the "Documents" button in the header
- **AI Suggestions Panel**: Toggle with the "Show/Hide AI Suggestions" button
- **Mobile Responsive**: Panels automatically adapt for mobile devices

## Project Structure

```
src/
├── components/
│   ├── ui/              # Reusable UI components
│   ├── DocEditor.tsx    # Main editor component
│   ├── DocumentList.tsx # Document management sidebar
│   ├── Editor.tsx       # Text editor component
│   ├── Header.tsx       # Application header
│   └── SuggestionPanel.tsx # AI suggestions panel
├── hooks/
│   ├── useDocuments.ts  # Document operations hook
│   ├── use-mobile.ts    # Mobile detection hook
│   └── use-toast.ts     # Toast notifications hook
├── lib/
│   └── supabase.ts      # Supabase client configuration
└── pages/
    └── Index.tsx        # Main page component
```

## Customization

### Adding Authentication

To add user authentication:

1. Enable authentication in your Supabase project
2. Update the RLS policy in `supabase-schema.sql`:
   ```sql
   -- Remove the public policy
   DROP POLICY "Enable all operations for everyone" ON documents;
   
   -- Add authenticated users policy
   CREATE POLICY "Enable all operations for authenticated users" 
   ON documents FOR ALL USING (auth.role() = 'authenticated');
   ```
3. Add user authentication to your React app using Supabase Auth

### Customizing AI Suggestions

The current AI suggestions are mock data. To integrate with a real AI service:

1. Replace the `generateMockSuggestion` function in `DocEditor.tsx`
2. Add your AI service API calls
3. Update the suggestion generation logic

### Styling

The application uses Tailwind CSS for styling. You can customize:

- Colors: Update the Tailwind config
- Components: Modify the UI components in `src/components/ui/`
- Layout: Adjust the responsive breakpoints and spacing

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

MIT License - see LICENSE file for details

## Support

If you encounter any issues:

1. Check that your Supabase URL and key are correctly set
2. Verify the database schema was applied correctly
3. Check the browser console for any error messages
4. Ensure you have the latest dependencies installed

For additional help, create an issue in the GitHub repository.
