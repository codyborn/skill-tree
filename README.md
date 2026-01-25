# Skill Tree Builder

A full-stack Next.js application for creating, visualizing, and tracking progress through interactive skill trees with AI-powered generation.

## Features

- 🎮 **Interactive Skill Trees**: Build and navigate through your skill progression
- 🤖 **AI-Powered Generation**: Automatically generate comprehensive skill trees using GPT-4
- 🔒 **Authentication**: Secure Google OAuth sign-in
- 💾 **Cloud Storage**: Save and manage multiple skill trees
- 🔗 **Share**: Create shareable read-only links
- 🎨 **Themes**: Light and dark mode support
- ✅ **Progress Tracking**: Track completion and unlock new skills

## Tech Stack

- **Frontend**: Next.js 14, React, TypeScript, Tailwind CSS
- **Visualization**: Cytoscape.js
- **Backend**: Next.js API Routes, Prisma ORM
- **Database**: PostgreSQL (Vercel Postgres)
- **Authentication**: NextAuth.js with Google OAuth
- **AI**: OpenAI GPT-4
- **Deployment**: Vercel

## Setup

### Prerequisites

- Node.js 18+ and npm
- PostgreSQL database (local or Vercel Postgres)
- Google OAuth credentials
- OpenAI API key

### Installation

1. **Clone the repository**
   ```bash
   cd skill_tree
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.local.template .env.local
   ```

   Edit `.env.local` and fill in:
   - `DATABASE_URL`: Your PostgreSQL connection string
   - `NEXTAUTH_SECRET`: Generate with `openssl rand -base64 32`
   - `NEXTAUTH_URL`: `http://localhost:3000` for development
   - `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`: From Google Cloud Console
   - `OPENAI_API_KEY`: From OpenAI platform

4. **Set up Google OAuth**
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Create a new project or select existing
   - Enable Google+ API
   - Create OAuth 2.0 credentials
   - Add authorized redirect URI: `http://localhost:3000/api/auth/callback/google`
   - Copy Client ID and Client Secret to `.env.local`

5. **Set up database**
   ```bash
   npx prisma generate
   npx prisma db push
   ```

6. **Run development server**
   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000)

## Usage

### Creating a Skill Tree

1. Sign in with Google
2. Click "Create New Tree"
3. Add nodes by right-clicking on existing nodes
4. Edit node properties (label, description, weight, icon)
5. Mark nodes as complete to unlock children

### AI Generation

1. Right-click on any node
2. Select "Generate AI Subtree"
3. Enter a topic (e.g., "Web Development", "Piano Skills")
4. Choose style and node count
5. AI generates a complete subtree as children of the selected node

### Sharing

1. Click "Share" button in toolbar
2. Optionally set expiration time
3. Copy the generated link
4. Share with anyone - no login required to view

## Project Structure

```
skill_tree/
├── app/                    # Next.js app directory
│   ├── api/               # API routes
│   │   ├── auth/         # NextAuth endpoints
│   │   ├── trees/        # Tree CRUD
│   │   ├── generate/     # AI generation
│   │   └── share/        # Sharing
│   ├── tree/[id]/        # Tree editor page
│   ├── share/[id]/       # Shared tree view
│   └── page.tsx          # Landing page
├── components/            # React components
├── lib/                   # Utilities and core logic
│   ├── skill-tree/       # TypeScript skill tree modules
│   └── prisma.ts         # Prisma client
├── prisma/               # Database schema
├── types/                # TypeScript types
└── public/               # Static assets
```

## Development

### Database Migrations

```bash
# After schema changes
npx prisma generate
npx prisma db push
```

### Testing

```bash
# Run Playwright tests
npm test

# Run with UI
npm run test:headed

# Debug mode
npm run test:debug
```

## Deployment

### Deploy to Vercel

1. **Push to GitHub**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin <your-repo-url>
   git push -u origin main
   ```

2. **Deploy to Vercel**
   - Go to [Vercel](https://vercel.com)
   - Import your GitHub repository
   - Add environment variables from `.env.local`
   - Deploy

3. **Set up Vercel Postgres**
   - In Vercel dashboard, go to Storage
   - Create a new Postgres database
   - Copy connection string to environment variables
   - Run: `npx prisma db push` (using Vercel CLI or in build settings)

4. **Update OAuth redirect URIs**
   - Add production URL to Google OAuth settings
   - Update `NEXTAUTH_URL` in Vercel environment variables

## License

MIT

## Contributing

Contributions welcome! Please open an issue or submit a pull request.
