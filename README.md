# Digital Twin - AI-Powered Professional Portfolio

A modern Next.js application featuring an AI-powered digital twin with RAG (Retrieval-Augmented Generation) chat capabilities.

## 🚀 Features

- **PostgreSQL Database**: Complete professional data storage
- **Vector Database**: Semantic search with Upstash Vector + mixbread-large embeddings
- **RAG Chat**: AI-powered conversations about professional background
- **Modern Stack**: Next.js 14, TypeScript, Tailwind CSS

## 📋 Prerequisites

- Node.js 18+
- Neon PostgreSQL database account
- Upstash Vector database (via Vercel)

## ⚡ Quick Setup

### 1. Install Dependencies
```bash
npm install
```

### 2. Environment Variables
Create `.env.local` with your database credentials:
```bash
# PostgreSQL (Neon)
DATABASE_URL="your_neon_database_url"

# Vector Database (Upstash)
UPSTASH_VECTOR_REST_URL="your_upstash_vector_url"
UPSTASH_VECTOR_REST_TOKEN="your_upstash_vector_token"

# Authentication (Stack Auth)
NEXT_PUBLIC_STACK_PROJECT_ID="your_stack_project_id"
NEXT_PUBLIC_STACK_PUBLISHABLE_CLIENT_KEY="your_stack_key"
STACK_SECRET_SERVER_KEY="your_stack_secret"
```

### 3. Database Setup

**Option A: One-Command Setup**
```bash
npx tsx scripts/setup.ts
```

**Option B: Step-by-Step Setup**
```bash
# Create database schema
npx tsx scripts/create-schema.ts

# Populate with professional data
npx tsx scripts/populate-database.ts

# Migrate to vector database
npx tsx scripts/migrate-to-vector.ts
```

### 4. Run Development Server
```bash
npm run dev
```

## 📁 Project Structure

```
├── src/
│   ├── app/          # Next.js app router
│   └── components/   # React components
├── scripts/
│   ├── create-schema.ts     # Database schema creation
│   ├── populate-database.ts # Professional data population
│   └── migrate-to-vector.ts # Vector database migration
└── .env.local        # Environment variables
```

## 🛠️ Scripts

- `setup.ts` - **One-command setup** for the entire system
- `create-schema.ts` - Creates PostgreSQL tables and indexes
- `populate-database.ts` - Inserts professional data into PostgreSQL
- `migrate-to-vector.ts` - Migrates data to vector database for semantic search

## 🎯 Tech Stack

- **Frontend**: Next.js 14, TypeScript, Tailwind CSS
- **Database**: PostgreSQL (Neon), Upstash Vector
- **AI**: RAG with semantic search and embeddings
- **Auth**: Stack Auth
- **Deployment**: Vercel

## 📝 License

MIT License - see LICENSE file for details.
