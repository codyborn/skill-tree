# Next Steps - Skill Tree Migration

## ✅ Completed

The full-stack migration has been successfully implemented with the following components:

### Core Infrastructure
- ✅ Next.js 14 project structure with TypeScript and Tailwind CSS
- ✅ Database schema with Prisma (User, Tree, Share, Account, Session models)
- ✅ NextAuth.js with Google OAuth integration
- ✅ All core TypeScript modules (SkillTree, NodeRenderer, themes)

### API Endpoints
- ✅ `/api/trees` - CRUD operations for skill trees
- ✅ `/api/generate` - AI-powered skill tree generation with OpenAI
- ✅ `/api/share` - Create and manage shareable links
- ✅ `/api/auth/[...nextauth]` - Authentication endpoints

### Frontend Components
- ✅ Landing page with Google sign-in
- ✅ SkillTreeEditor component (with dynamic Cytoscape loading)
- ✅ Tree editor page (`/tree/[id]`)
- ✅ Shared tree viewer (`/share/[id]`)
- ✅ AuthProvider and SignInButton components

## 🔧 Setup Required

Before running the application, you need to configure the following:

### 1. Environment Variables

Create `.env.local` from the template:

```bash
cp .env.local.template .env.local
```

Then fill in:

#### Database (Required)
```env
DATABASE_URL="postgresql://user:password@localhost:5432/skill_tree"
```

For local development, install PostgreSQL or use a service like:
- [Neon](https://neon.tech) - Free PostgreSQL
- [Supabase](https://supabase.com) - Free PostgreSQL
- Docker: `docker run --name postgres -e POSTGRES_PASSWORD=password -p 5432:5432 -d postgres`

#### NextAuth (Required)
```env
NEXTAUTH_SECRET="generate-with-openssl-rand-base64-32"
NEXTAUTH_URL="http://localhost:3000"
```

Generate secret:
```bash
openssl rand -base64 32
```

#### Google OAuth (Required)
```env
GOOGLE_CLIENT_ID="your-client-id.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="your-client-secret"
```

Setup instructions:
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Go to "APIs & Services" → "Credentials"
4. Click "Create Credentials" → "OAuth 2.0 Client ID"
5. Application type: "Web application"
6. Authorized redirect URIs: `http://localhost:3000/api/auth/callback/google`
7. Copy Client ID and Client Secret

#### OpenAI (Required for AI generation)
```env
OPENAI_API_KEY="sk-proj-..."
```

Get from [OpenAI Platform](https://platform.openai.com/api-keys)

### 2. Database Setup

Initialize the database:

```bash
# Generate Prisma client
npx prisma generate

# Push schema to database (creates tables)
npx prisma db push

# Optional: Open Prisma Studio to view data
npx prisma studio
```

### 3. Install Dependencies (if needed)

```bash
npm install
```

## 🚀 Running the Application

### Development Mode

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### Test the Application

1. **Sign In**
   - Click "Sign in with Google"
   - Should redirect to Google OAuth
   - After auth, redirect to `/tree/new`

2. **Create a Skill Tree**
   - Right-click on the canvas or a node to add nodes
   - Edit node properties
   - Mark nodes as complete

3. **AI Generation** (requires OpenAI API key)
   - Right-click a node
   - Select "Generate AI Subtree"
   - Enter a topic and generate

4. **Save Tree** (requires implementation in UI)
   - Currently, tree auto-saves to localStorage
   - Backend API is ready for cloud saves

5. **Share Tree** (requires implementation in UI)
   - Backend API is ready
   - Create share link via `/api/share`

## 📝 Remaining Work

### High Priority

#### 1. Connect Frontend to Backend APIs

The APIs are built but not yet connected to the UI. You need to:

**In `app/tree/[id]/page.tsx`:**
- Load tree data from `/api/trees/:id` on mount
- Implement Save button to call `PUT /api/trees/:id`
- Implement Share button to call `POST /api/share`

**Example implementation:**
```typescript
// In tree page or a new Toolbar component
const handleSave = async () => {
  const treeData = skillTree?.getTreeData();
  await fetch(`/api/trees/${treeId}`, {
    method: 'PUT',
    body: JSON.stringify({ data: treeData }),
  });
};

const handleShare = async () => {
  const res = await fetch('/api/share', {
    method: 'POST',
    body: JSON.stringify({ treeId, expiresIn: '7d' }),
  });
  const { url } = await res.json();
  // Copy URL to clipboard or show in dialog
};
```

#### 2. Add Context Menus

The SkillTree class supports callbacks but context menus need to be implemented:

**Create `components/ContextMenu.tsx`:**
```typescript
// Show on node right-click with options:
// - Add Child Node
// - Edit Node
// - Delete Node
// - Mark Complete/Incomplete
// - Generate AI Subtree (call /api/generate)
```

#### 3. Add Detail Panel

Show node details when clicked:

**Create `components/DetailPanel.tsx`:**
```typescript
// Display:
// - Node label and description
// - Completion status
// - Prerequisites
// - Subtree progress
// - Edit button
```

#### 4. Add Tree List Page

Allow users to see all their trees:

**Create `app/trees/page.tsx`:**
```typescript
// Fetch from GET /api/trees
// Display grid of tree cards with:
// - Thumbnail
// - Name
// - Last modified
// - Open/Delete buttons
```

### Medium Priority

#### 5. Add Proper Error Handling

- Toast notifications for errors
- Loading states
- Error boundaries

#### 6. Implement Tree Thumbnails

Generate thumbnails when saving:
```typescript
// In SkillTreeEditor, capture canvas as image
const generateThumbnail = () => {
  const cy = skillTree?.getCytoscapeInstance();
  const png = cy?.png({ scale: 0.5 });
  return png; // base64
};
```

#### 7. Add Keyboard Shortcuts

- `Ctrl+S` - Save
- `Delete` - Delete selected node
- `Ctrl+Z` - Undo
- `Ctrl+Y` - Redo

### Low Priority

#### 8. Enhance AI Generation UI

Create a modal dialog for AI generation with:
- Topic input
- Style selection (technical/creative/academic/gaming)
- Node count slider
- Preview before adding

#### 9. Add Theme Toggle

Implement theme switcher in header:
```typescript
import { ThemeManager } from '@/lib/skill-tree/themes';

const toggleTheme = () => {
  ThemeManager.toggleTheme();
  skillTree?.updateCytoscapeTheme();
};
```

#### 10. Add Export/Import

- Export tree as JSON
- Import from JSON file
- Export as image (PNG)

## 🧪 Testing

### Update Playwright Tests

The existing tests are for the old vanilla JS version. Update them for Next.js:

**`tests/basic.spec.ts`:**
```typescript
import { test, expect } from '@playwright/test';

test('landing page loads', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByText('Skill Tree Visualizer')).toBeVisible();
});

test('requires authentication', async ({ page }) => {
  await page.goto('/tree/new');
  // Should redirect to login
  await page.waitForURL('/');
});
```

Run tests:
```bash
npm test
```

## 🚢 Deployment

### Deploy to Vercel

1. **Push to GitHub:**
   ```bash
   git add .
   git commit -m "Complete Next.js migration"
   git push
   ```

2. **Create Vercel Project:**
   - Go to [Vercel Dashboard](https://vercel.com)
   - Import your repository
   - Framework: Next.js (auto-detected)

3. **Add Environment Variables:**
   Copy all variables from `.env.local` to Vercel:
   - `DATABASE_URL`
   - `NEXTAUTH_SECRET`
   - `NEXTAUTH_URL` (use your Vercel URL)
   - `GOOGLE_CLIENT_ID`
   - `GOOGLE_CLIENT_SECRET`
   - `OPENAI_API_KEY`

4. **Set up Vercel Postgres:**
   - In Vercel dashboard → Storage → Create Database → Postgres
   - Copy connection string to `DATABASE_URL` environment variable
   - Re-deploy to apply new env vars

5. **Update Google OAuth:**
   - Add production callback URL in Google Cloud Console:
     `https://your-app.vercel.app/api/auth/callback/google`

6. **Deploy:**
   ```bash
   vercel --prod
   ```

### Post-Deployment

- Test authentication flow
- Test tree creation and editing
- Test AI generation
- Test sharing
- Monitor logs in Vercel dashboard

## 🐛 Troubleshooting

### "Prisma Client not generated"
```bash
npx prisma generate
```

### "MODULE_NOT_FOUND: cytoscape"
Cytoscape is dynamically imported client-side. Make sure it's in dependencies:
```bash
npm install cytoscape cytoscape-dagre
```

### Database connection errors
- Check `DATABASE_URL` format
- Ensure database is accessible
- Run `npx prisma db push` to sync schema

### Google OAuth errors
- Verify redirect URIs match exactly
- Check environment variables are set
- Ensure Google+ API is enabled

### Build errors with Next.js
- Clear `.next` folder: `rm -rf .next`
- Clear node_modules: `rm -rf node_modules && npm install`
- Check for TypeScript errors: `npx tsc --noEmit`

## 📚 Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [Prisma Documentation](https://www.prisma.io/docs)
- [NextAuth.js Documentation](https://next-auth.js.org)
- [Cytoscape.js Documentation](https://js.cytoscape.org)
- [OpenAI API Documentation](https://platform.openai.com/docs)
- [Vercel Documentation](https://vercel.com/docs)

## 🎯 Success Criteria Checklist

- [ ] User can sign in with Google
- [ ] User can create and edit skill trees
- [ ] All existing features work (node creation, completion, locking)
- [ ] User can generate AI subtrees
- [ ] User can save trees to database
- [ ] User can load saved trees
- [ ] User can create share links
- [ ] Shared links work without authentication
- [ ] Application is deployed to Vercel
- [ ] All tests pass

## 📞 Support

If you encounter issues:

1. Check this guide's troubleshooting section
2. Review error messages in browser console
3. Check server logs (`npm run dev` output)
4. Verify environment variables are set correctly
5. Ensure database is properly initialized

Good luck with the migration! 🚀
