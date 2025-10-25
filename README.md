## PMS Frontend

React/Next.js app with shadcn UI, React Query, and JWT auth. Categories CRUD implemented with modal form, table listing, and server-side search/sort.

### Requirements
- Node 18+
- Backend running at `http://localhost:3001/api/v1` (configurable via `NEXT_PUBLIC_API_URL`)

### Setup
1. Install deps: `npm install`
2. Create `.env.local` (optional):
   ```env
   NEXT_PUBLIC_API_URL=http://localhost:3001/api/v1
   ```
3. Start dev: `npm run dev` → http://localhost:3000

### Auth
- Sign in via `/login`. On success, tokens are stored in `localStorage` and provided via `contexts/AuthContext.tsx`.
- Protected pages use `components/ProtectedRoute.tsx`.

### Categories (CRUD)
- Page: `app/(dashboard)/dashboard/categories/page.tsx`
- API service: `services/categoryService.ts`
- Types: `types/category.ts`
- Hooks: `hooks/useCategories.ts`
- Form: `components/CategoryForm.tsx`

Features:
- List with shadcn Table
- Create/Edit in shadcn Dialog (modal)
- Read-only View dialog (details + products)
- Delete with toast feedback (uses `sonner`)
- Server-side filtering/sorting via query params:
  - `page`, `limit`, `search`, `sortBy` (name|createdAt|updatedAt), `sortOrder` (asc|desc)

### UI
- Components in `components/ui/*` (shadcn variants)
- Global providers: `components/providers.tsx`
- Toaster mounted in `app/layout.tsx`

### Env Vars
- `NEXT_PUBLIC_API_URL`: API base (default `http://localhost:3001/api/v1`)

### Scripts
- `npm run dev` - Start dev server
- `npm run build` - Production build
- `npm start` - Start production
- `npm run lint` - Lint

### Notes
- JWT is read from `localStorage.accessToken` by `categoryService`.
- Adjust backend to accept `search`, `sortBy`, and `sortOrder` on GET `/categories` and return `{ categories, total }`.
