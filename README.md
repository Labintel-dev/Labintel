# LabIntel Hub

Monorepo with a clear split:

- `client/`: React + Vite frontend
- `server/`: Express backend

## Run

From project root:

```bash
npm run install:all
npm run dev:client
npm run dev:server
```

## Build

```bash
npm run build:client
```

## Notes

- Root-level duplicate frontend files were removed so `client/` is the only frontend source of truth.
- Backend entrypoint: `server/server.js`.
