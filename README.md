<div align="center">

# ✍️ writing.humans

### AI-Assisted Document Editor for the Modern Writer

*Clean, minimal document editing with intelligent AI suggestions and seamless cloud sync*

[![MIT License](https://img.shields.io/badge/License-MIT-green.svg)](https://choosealicense.com/licenses/mit/)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-20232A?logo=react&logoColor=61DAFB)](https://reactjs.org/)
[![Vite](https://img.shields.io/badge/Vite-646CFF?logo=vite&logoColor=white)](https://vitejs.dev/)
[![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?logo=supabase&logoColor=white)](https://supabase.com/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)

[📖 Demo](#-demo) • [🚀 Quick Start](#-quick-start) • [📋 Features](#-features) • [🤝 Contributing](#-contributing)

---

</div>

<img width="894" alt="Screenshot 2025-06-01 at 7 54 06 PM" src="https://github.com/user-attachments/assets/7438d815-c495-4284-abcd-2f11b871d5b4" />

### Key Features Preview
![Feature 1](docs/images/feature-1.png) | ![Feature 2](docs/images/feature-2.png)
:---: | :---:
AI Suggestions | Document Management
-->

## 🌟 What Makes writing.humans Special

writing.humans combines powerful features with elegant simplicity. At its heart, it's a writing tool that understands and adapts to your needs. Whether you're drafting a novel, composing an essay, or jotting down ideas, our intelligent editor enhances your natural writing flow without getting in the way.

We've carefully crafted every aspect of the experience, from the clean, distraction-free interface to the subtle AI suggestions that appear exactly when you need them. The editor syncs seamlessly to the cloud, ensuring your work is always safe and accessible across all your devices.

### ✨ Core Features
- 📝 **Rich Text Editor** - Clean, distraction-free writing experience
- 🤖 **AI-Powered Suggestions** - Intelligent writing assistance and improvements
- 💾 **Cloud Sync** - Persistent storage with Supabase backend
- 📱 **Responsive Design** - Works seamlessly on desktop and mobile
- 🔄 **Auto-Save** - Never lose your work with automatic saving
- 📂 **Document Management** - Create, organize, and manage your documents

### 🎯 AI Assistance
- **Visual Indicators** - Blue dots and underlines show suggestion locations
- **Interactive Diff View** - See exactly what changes are suggested
- **Context-Aware** - Suggestions based on your writing style and content
- **Smart Limits** - Automatically calculated suggestion density
- **Multiple Interaction Methods** - Click, hover, or use keyboard shortcuts

### 📱 User Experience
- **Mobile-First Design** - Touch-friendly interface for all devices
- **Keyboard Shortcuts** - Power user shortcuts for quick actions
- **Real-time Sync** - Changes sync across all your devices
- **Offline Support** - Continue writing even without internet

## 🛠️ Tech Stack

| Category | Technology |
|----------|------------|
| **Frontend** | React 18, TypeScript, Vite |
| **Styling** | Tailwind CSS, Radix UI |
| **Backend** | Supabase (PostgreSQL) |
| **State Management** | React Hooks, TanStack Query |
| **Build Tool** | Vite |

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and npm
- A Supabase account (free tier available)

### 1️⃣ Clone & Install

```bash
git clone https://github.com/yourusername/writing.humans.git
cd writing.humans
npm install
```

### 2️⃣ Database Setup

1. Create a new project at [supabase.com](https://supabase.com)
2. In your Supabase dashboard, navigate to the SQL Editor
3. Copy and execute the schema from `supabase-schema.sql`
4. Get your project URL and anon key from Settings → API

### 3️⃣ Environment Configuration

Create a `.env` file in the project root:

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 4️⃣ Launch

```bash
npm run dev
```

Visit `http://localhost:5173` and start writing! 🎉

## 📚 Usage Guide

### Document Management

| Action | Method |
|--------|--------|
| **Create Document** | Click "New" button or use `Ctrl+N` |
| **Save Document** | Click "Save" or auto-save (every 30s) |
| **Load Document** | Click document in sidebar |
| **Delete Document** | Click trash icon next to document |

### AI Suggestions

1. **Write content** in the editor
2. **Look for blue indicators** next to lines with suggestions
3. **Click indicators or underlined text** to view suggestions
4. **Review the diff** showing additions (green) and deletions (red)
5. **Accept with Enter** or **reject with Escape**

### Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl/Cmd + N` | New document |
| `Ctrl/Cmd + S` | Save document |
| `Enter` | Accept suggestion (in diff view) |
| `Escape` | Reject suggestion (in diff view) |

## 🏗️ Project Structure

```
src/
├── components/
│   ├── ui/              # Reusable UI components (Radix)
│   ├── DocEditor.tsx    # Main editor with AI integration
│   ├── DocumentList.tsx # Document management sidebar
│   ├── Editor.tsx       # Core text editor component
│   ├── Header.tsx       # Navigation and controls
│   └── SuggestionPanel.tsx # AI suggestions interface
├── hooks/
│   ├── useDocuments.ts  # Document CRUD operations
│   ├── use-mobile.ts    # Responsive design utilities
│   └── use-toast.ts     # Notification system
├── lib/
│   └── supabase.ts      # Database client configuration
└── pages/
    └── Index.tsx        # Main application page
```

## 🔧 Configuration

### Adding Authentication

To add user authentication:

1. **Enable auth in Supabase** project settings
2. **Update RLS policies** in your database:
   ```sql
   DROP POLICY "Enable all operations for everyone" ON documents;
   CREATE POLICY "Enable all operations for authenticated users" 
   ON documents FOR ALL USING (auth.role() = 'authenticated');
   ```
3. **Integrate Supabase Auth** in your React components

### Customizing AI Integration

Replace mock suggestions with real AI:

1. **Update `generateMockSuggestion`** in `DocEditor.tsx`
2. **Add your AI API calls** (OpenAI, Anthropic, etc.)
3. **Configure suggestion logic** for your use case

## 🤝 Contributing

We love your input! We want to make contributing as easy and transparent as possible.

### Development Setup

1. Fork the repo and create your branch from `main`
2. Install dependencies: `npm install`
3. Make your changes and add tests if applicable
4. Ensure the test suite passes: `npm test`
5. Make sure your code lints: `npm run lint`
6. Issue a pull request!

### Contribution Guidelines

- 🐛 **Bug Reports**: Use GitHub issues with detailed reproduction steps
- 💡 **Feature Requests**: Open an issue to discuss before implementing
- 📝 **Code Style**: Follow existing patterns and run `npm run lint`
- ✅ **Tests**: Add tests for new features
- 📖 **Documentation**: Update docs for any API changes

### Good First Issues

Look for issues labeled `good first issue` to get started!

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **[Supabase](https://supabase.com)** - For the amazing backend-as-a-service
- **[Radix UI](https://www.radix-ui.com/)** - For accessible, unstyled UI components
- **[Tailwind CSS](https://tailwindcss.com/)** - For the utility-first CSS framework
- **[Vite](https://vitejs.dev/)** - For the lightning-fast build tool

## 💬 Community & Support

- 📫 **Questions**: Open a [GitHub Discussion](../../discussions)
- 🐛 **Bug Reports**: Use [GitHub Issues](../../issues)
- 💬 **Chat**: Join our [Discord Community](#) (coming soon)
- 🐦 **Updates**: Follow [@writinghumans](#) (coming soon)

---

<div align="center">

**[⭐ Star this repo](../../stargazers) if you find it helpful!**

Made with ❤️ by the writing.humans team

</div>
