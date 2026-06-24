# ProcurePilot

ProcurePilot is an AI procurement intelligence demo product built with Next.js
15, TypeScript, Tailwind CSS, shadcn-style UI primitives, and Framer Motion.

## What is included

- Landing page with investor-ready positioning and demo CTA
- Drag-and-drop upload page with multi-file support and premium file cards
- Animated AI processing flow
- Executive analysis dashboard with vendor scoring and AI reasoning
- Final decision report with winner, hidden costs, negotiation suggestions, and export
- Server-side OpenAI analysis route with safe demo fallback

## Project structure

- `app/` - Next.js App Router routes and global styles
- `app/api/analyze/` - secure AI procurement analysis endpoint
- `components/` - reusable product and UI components
- `components/ui/` - shadcn-inspired primitives
- `data/` - realistic sample procurement scenario and processing steps
- `lib/` - utilities and scoring helpers
- `types/` - procurement domain types

## Run locally

```bash
npm install
npm run dev
```

## AI configuration

Create `.env.local` from `.env.example` and set:

```bash
OPENAI_API_KEY=your-openai-key
```

The browser never receives the key. The UI calls `/api/analyze`, which uses
OpenAI on the server and falls back to the seeded demo recommendation if no key
is configured.
