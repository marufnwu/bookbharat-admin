# BookBharat Admin Panel

## Stack
- Framework: React 19 (CRA with Craco)
- Styling: Tailwind CSS 3.3
- State: Zustand + TanStack Query
- Forms: React Hook Form + Zod
- Rich Text: Tiptap
- Charts: Recharts
- Package Manager: npm

## Key Commands
- `npm start` - Start dev server (port 3003)
- `npm run build` - Production build
- `PORT=3003 npm start` - Force specific port

## Architecture
- Router: React Router v7
- Components: `src/components/`
- Hooks: `src/hooks/`
- Stores: `src/stores/`
- Types: `src/types/`
- API client: `src/lib/api.ts`

## API Integration
- Backend API: `http://localhost:8000/api`
- Uses Axios for API calls

## Related Projects
- Backend (Laravel): ../bookbharat-backend (port 8000)
- Frontend (Next.js): ../bookbharat-frontend (port 3000)