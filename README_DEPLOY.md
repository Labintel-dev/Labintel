# Deploying LabIntel (Render backend, Vercel frontend)

Short steps to deploy both services.

Render (backend)
- Render can use the existing `backend/render.yaml` file. It defines a `labintel-api` web service.
- In the Render dashboard, create a new service from the repository, or push and let Render auto-detect `render.yaml`.
- Set these as **secrets** in the Render service settings (do NOT commit them to git):
  - `SUPABASE_URL`, `SUPABASE_SERVICE_KEY`, `SUPABASE_ANON_KEY`
  - `DATABASE_URL`
  - `JWT_SECRET` (generate securely)
  - `GEMINI_API_KEY`
  - `PDF_STORAGE_BUCKET` (e.g. `pdfs`)
  - `FRONTEND_URL` (Vercel URL)

Vercel (frontend)
- Create a new project in Vercel and point it to the repository.
- In project settings, set the Root Directory to `frontend` (or deploy the `frontend` folder as a separate project).
- Vercel will run `npm install` and `npm run build` using `frontend/package.json` and serve the static `dist` output.
- Add any environment variables the frontend needs (prefix client vars with `VITE_`), e.g. `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`.

Local testing
- Backend: `npm --prefix backend run dev` (requires a local `.env` copy of `backend/.env.example`).
- Frontend: `npm --prefix frontend run dev`.

Notes
- `render.yaml` already exists at `backend/render.yaml` and configures the backend service.
- `vercel.json` at repo root configures Vercel to build the `frontend` package.
