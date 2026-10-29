# Railway deployment guide

Deploy everything on **Railway**: one project with three services — **PostgreSQL**,
**backend (api)**, **frontend (web)**. No other hosting or database provider is required.

Build definitions are provided as Dockerfiles at the repo root so each service builds with
the full monorepo context (needed because the `@darundi/shared` workspace is shared):
`Dockerfile.api` and `Dockerfile.web`.

## 0. Prerequisites
- Push this repository to GitHub.
- A Railway account.

## 1. Create the project & PostgreSQL
1. Railway → **New Project** → **Deploy PostgreSQL**.
2. This creates a `Postgres` service exposing `DATABASE_URL` (and private networking).

## 2. Backend service (api)
1. **New Service → GitHub Repo** → pick this repo.
2. Settings → **Build**: set **Dockerfile Path** = `Dockerfile.api` (builder: Dockerfile).
   Leave Root Directory at the repo root (the Dockerfile copies the whole workspace).
3. Settings → **Variables**:
   - `DATABASE_URL` = `${{Postgres.DATABASE_URL}}`  *(Railway service reference)*
   - `NODE_ENV` = `production`
   - `SESSION_SECRET` = a long random string
     (`node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"`)
   - `ADMIN_TOKEN` = another long random string (guards question-bank edits)
   - `FRONTEND_URL` = the web service's public URL (fill in after step 3, then redeploy)
   - `PORT` is injected by Railway automatically.
4. Settings → **Networking**: generate a public domain for the API.
5. Settings → **Health Check**: path `/api/health`.
6. Deploy. The container runs `prisma migrate deploy` on start, then boots the API.

### Import the question banks (one-off, idempotent)
After the first successful deploy, run the importer once against the production DB:
- Railway → api service → **"Run a command"** (or a one-off shell):
  `npm run db:import -w @darundi/api`
- Safe to re-run; it upserts by original id and never duplicates.

## 3. Frontend service (web)
1. **New Service → GitHub Repo** → same repo.
2. Settings → **Build**: **Dockerfile Path** = `Dockerfile.web`.
3. Settings → **Variables**:
   - `NEXT_PUBLIC_API_URL` = the API service's public URL (e.g. `https://api-xxxx.up.railway.app`)
   - **Important:** `NEXT_PUBLIC_*` is baked in at **build time**. In Railway, variables are
     available to the Docker build, so set this before/at deploy. Changing it later requires a redeploy.
4. Settings → **Networking**: generate a public domain for the web app.
5. Deploy.

## 4. Wire the two together
- Set the api service's `FRONTEND_URL` to the web domain (CORS + cookies depend on it) and redeploy api.
- Confirm the web `NEXT_PUBLIC_API_URL` points at the api domain.

Because the services are on different subdomains, the judge session cookie is sent with
`SameSite=None; Secure` over HTTPS, and the browser uses `credentials: "include"`. (The app
also falls back to an `x-judge-token` header if third-party cookies are blocked.)

## 5. Verify
- `GET https://<api-domain>/api/health` → `{"ok":true,...}`
- `GET https://<api-domain>/api/health/db` → `{"ok":true,"db":"up"}`
- Open the web domain → **بداية سريعة** → play a full match.

## Environment variables reference
| Service | Variable | Notes |
|---|---|---|
| api | `DATABASE_URL` | Use `${{Postgres.DATABASE_URL}}` service reference |
| api | `SESSION_SECRET` | Long random; HMAC key for judge tokens |
| api | `ADMIN_TOKEN` | Long random; guards `/api/questions` edits & `/api/reports` list |
| api | `FRONTEND_URL` | Web public URL (CORS/cookies) |
| api | `NODE_ENV` | `production` |
| api | `PORT` | Injected by Railway |
| web | `NEXT_PUBLIC_API_URL` | API public URL (build-time) |

**Never** expose `DATABASE_URL` through any `NEXT_PUBLIC_*` variable. Secrets live only in
Railway, never in the repo. The start command runs `migrate deploy` (never a destructive reset).

## Notes / manual steps
- If you prefer Nixpacks over Dockerfiles, you must still ensure the build installs the whole
  workspace and runs `prisma generate` + the workspace build; the Dockerfiles do this reliably.
- The importer is a manual one-off (not part of the start command) so deploys never mutate data
  unexpectedly.
