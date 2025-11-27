# Digital Twin - AI-Powered Professional Portfolio

A modern Next.js portfolio application featuring an AI-powered digital twin with RAG (Retrieval-Augmented Generation) chat capabilities, admin dashboard, and dynamic content management.

## 🚀 Features

- **AI Chat Assistant**: RAG-powered chatbot that answers questions about your professional background
- **Admin Dashboard**: Comprehensive content management for profile, projects, experience, skills, and education
- **Vector Search**: Semantic search powered by Upstash Vector with mixbread-large embeddings
- **PostgreSQL Database**: Complete professional data storage with Neon
- **Authentication**: Secure admin access with Stack Auth
- **Modern Design**: Elegant UI with Tailwind CSS and custom typography
- **CV Management**: Upload and manage downloadable CV/resume files
- **Email Notifications**: Contact form with Resend integration
- **MCP Server**: Model Context Protocol server for external integrations

## 🛠️ Tech Stack

- **Frontend**: Next.js 15, React 19, TypeScript, Tailwind CSS 4
- **Database**: PostgreSQL (Neon), Upstash Vector
- **AI/ML**: Groq API, RAG with semantic search
- **Auth**: Stack Auth (Neon Auth integration)
- **Email**: Resend
- **Deployment**: Vercel-ready

## 📋 Prerequisites

- Node.js 18+
- Neon PostgreSQL database
- Upstash Vector database
- Stack Auth account
- Groq API key
- Resend API key (for contact form)

## ⚡ Quick Setup

### 1. Clone and Install

```bash
git clone https://github.com/louis-adriano/digital-twin.git
cd digital-twin
npm install
```

### 2. Environment Variables

Create `.env.local` with your credentials:

```bash
# Database
DATABASE_URL="postgresql://user:pass@host/db?sslmode=require"

# Vector Database (Upstash)
UPSTASH_VECTOR_REST_URL="https://your-vector-db.upstash.io"
UPSTASH_VECTOR_REST_TOKEN="your_token"
UPSTASH_VECTOR_REST_READONLY_TOKEN="your_readonly_token"

# Authentication (Stack Auth)
NEXT_PUBLIC_STACK_PROJECT_ID="your_project_id"
NEXT_PUBLIC_STACK_PUBLISHABLE_CLIENT_KEY="your_key"
STACK_SECRET_SERVER_KEY="your_secret"

# AI (Groq)
GROQ_API_KEY="your_groq_api_key"

# Email (Resend)
RESEND_API_KEY="your_resend_api_key"
NOTIFICATION_EMAIL="your_email@example.com"

# Admin Access
ADMIN_PASSWORD="your_secure_password"
```

### 3. Database Setup

Run the setup script to create schema and populate initial data:

```bash
npm run setup
```

Or run individual steps:

```bash
# Create database schema
npm run db:schema

# Migrate data to vector database
npm run db:migrate
```

### 4. Run Development Server

```bash
npm run dev
```

Visit `http://localhost:3000` to see your portfolio!

## 📁 Project Structure

```
digital-twin/
├── src/
│   ├── app/
│   │   ├── page.tsx              # Homepage
│   │   ├── portfolio/            # Portfolio/CV page
│   │   ├── contact/              # Contact page
│   │   ├── admin/                # Admin dashboard
│   │   └── api/                  # API routes
│   ├── components/
│   │   ├── admin/                # Admin components
│   │   ├── ChatBot.tsx           # AI chat interface
│   │   └── FloatingChat.tsx      # Chat button
│   └── types/
│       └── profile.ts            # TypeScript types
├── scripts/
│   ├── setup.ts                  # One-command setup
│   ├── create-schema.ts          # Database schema
│   ├── migrate-to-vector.ts      # Vector DB migration
│   └── install-mcp.ts            # MCP server setup
├── mcp-server/                   # MCP server implementation
├── public/
│   ├── images/                   # Profile images
│   └── uploads/                  # CV and project files
└── middleware.ts                 # Auth middleware
```

## 🎨 Key Pages

- `/` - Homepage with hero, about, projects, and contact sections
- `/portfolio` - Detailed CV-style page with summary, experience, projects, education, and skills
- `/contact` - Contact form with email notifications
- `/admin` - Protected admin dashboard for content management
  - `/admin/content` - Edit profile information
  - `/admin/database` - Manage experiences, projects, skills, education
  - `/admin/analytics` - View chat analytics
  - `/admin/embeddings` - Manage vector embeddings

## 🔒 Admin Access

Access the admin dashboard at `/admin/login` with your configured `ADMIN_PASSWORD`.

## 📦 Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run lint` - Run ESLint
- `npm run type-check` - TypeScript type checking
- `npm run setup` - Complete database setup
- `npm run db:schema` - Create database schema
- `npm run db:migrate` - Migrate to vector database
- `npm run mcp:install` - Install MCP server

## 🚀 Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Import project in Vercel
3. Add environment variables
4. Deploy!

The application is optimized for Vercel with automatic builds and serverless functions.

## 🤝 Contributing

Contributions are welcome! Feel free to open issues or submit pull requests.

## 📝 License

MIT License - see LICENSE file for details.

## 🙏 Acknowledgments

Built with Next.js, powered by Neon, Upstash, Stack Auth, Groq, and Resend.
