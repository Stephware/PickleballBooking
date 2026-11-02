# Frontend — Phase 1

Next.js 16 App Router + TypeScript + Tailwind CSS 4 starter. UI is a clearly labeled development placeholder — booking, payment and venue branding are not implemented yet.

## Local development

Requires Node.js 20.9+ (22 LTS recommended). From `frontend/`:

```bash
npm install
npm run dev
```

Open http://localhost:3000. To test communication with the backend, first run the .NET API, then open http://localhost:3000/api/backend-health. A 503 response means the API isn't reachable from the Next.js server.

```bash
npm run check
npm run build
```

**Dependency lock:** A package-lock.json could not be generated in the authoring environment. After the first successful `npm install`, commit `frontend/package-lock.json` to pin the resolved dependency tree. Use `npm ci` on subsequent installs.

## Architecture

- `app/` routes, layouts, Tailwind imports
- `components/` reusable visual elements, booking and admin (implemented in later phases)
- `hooks/`, `lib/`, `types/` start empty until real workflows need them
- `.env.example` illustrates a non-public server-side API URL. `.env.local` must remain untracked.

Follow [the UI/UX guide](../docs/context/ui-ux.md). Replace placeholder colors with reusable tokens driven by each venue's configuration once branding is implemented.
