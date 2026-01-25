# Claude Code Instructions for Skill Tree Builder

## Development Workflow

### Before Committing Changes

**CRITICAL:** Always run a build check before committing and pushing code:

```bash
npm run build
```

This ensures:
- TypeScript compilation succeeds
- ESLint rules pass
- No build errors that would break Vercel deployment

### Commit and Push Process

1. **Build Check** (Required)
   ```bash
   npm run build
   ```

2. **Stage Changes**
   ```bash
   git add -A
   git status  # Review changes
   ```

3. **Commit**
   ```bash
   git commit -m "Descriptive commit message

   Detailed explanation of changes...

   Co-Authored-By: Claude Sonnet 4.5 (1M context) <noreply@anthropic.com>"
   ```

4. **Push**
   ```bash
   git push origin main
   ```

### Common ESLint Issues

- **Unescaped quotes in JSX**: Use `&quot;`, `&ldquo;`, `&rdquo;`, or `&#34;` instead of raw quotes
- **Missing dependencies in useEffect**: Add all dependencies or use `useCallback` for functions

### Project Structure

```
skill_tree/
├── app/                    # Next.js app directory
│   ├── api/               # API routes
│   ├── tree/[id]/         # Tree editor page
│   ├── share/[id]/        # Shared tree view
│   └── page.tsx           # Landing page
├── components/            # React components
├── lib/                   # Utilities and core logic
│   ├── skill-tree/       # TypeScript skill tree modules
│   └── prisma.ts         # Prisma client
├── prisma/               # Database schema
├── types/                # TypeScript types
└── public/               # Static assets
```

### Key Features

1. **Root Node**: Uneditable, no title by default, encourages adding children
2. **Graying Logic**: Nodes with `subtreeCompletion === 0` are dimmed
3. **Shared Trees**: Read-only with "Copy skillset to my tree" option
4. **AI Generation**: Tips cycle during generation
5. **Theme Support**: Light/dark mode with CSS variables

### API Endpoints

- `POST /api/trees` - Create new tree
- `PUT /api/trees/[id]` - Update tree
- `POST /api/share` - Create share link
- `GET /api/share/[id]` - Get shared tree
- `POST /api/copy-skillset` - Copy skillset from shared tree
- `POST /api/generate` - AI generation

### Database

Uses Prisma ORM with PostgreSQL (Vercel Postgres):
- Run `npx prisma generate` after schema changes
- Run `npx prisma db push` to sync database

### Testing

```bash
npm test              # Run Playwright tests
npm run test:headed   # Run with UI
npm run test:debug    # Debug mode
```
