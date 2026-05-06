# CI/CD Pipeline

This project deploys the React frontend and Express backend to a VPS with Docker Compose.

## Branch Workflow

- Work happens on `feature/cicd-testing`.
- CI/CD runs only for `feature/cicd-testing` and `main`.
- Pushes to either selected branch run dependency installation, backend tests, frontend build, Docker image builds, and VPS deployment.
- Pull requests targeting either selected branch run validation and Docker builds without deployment.

## GitHub Secrets

Create these repository secrets in GitHub under Settings > Secrets and variables > Actions:

| Secret | Purpose |
| --- | --- |
| `VPS_HOST` | VPS IP address or DNS name |
| `VPS_USERNAME` | SSH user for deployment |
| `VPS_SSH_KEY` | Private SSH key with access to the VPS |
| `VPS_PORT` | SSH port, usually `22` |
| `VPS_SSH_FINGERPRINT` | Optional VPS SSH host fingerprint for host verification |
| `VPS_APP_DIR` | Optional app path on the VPS, defaults to `/opt/labintel` |
| `BACKEND_ENV_FILE` | Optional backend env path, defaults to `./backend/.env.production` |
| `VITE_SUPABASE_URL` | Public Supabase URL for the frontend build |
| `VITE_SUPABASE_ANON_KEY` | Public Supabase anon key for the frontend build |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Optional Supabase publishable key |
| `DOCKERHUB_USERNAME` | Optional Docker Hub username |
| `DOCKERHUB_TOKEN` | Optional Docker Hub access token |

Use SSH keys for VPS deployment. Do not commit passwords, private keys, Supabase service keys, JWT secrets, or database URLs.

## VPS Setup

Install Docker, Docker Compose v2, Git, and OpenSSH server on the VPS. Clone the repository into the app directory:

```bash
sudo mkdir -p /opt/labintel
sudo chown "$USER":"$USER" /opt/labintel
git clone <YOUR_REPOSITORY_URL> /opt/labintel
cd /opt/labintel
git checkout feature/cicd-testing
```

Create production env files on the VPS:

```bash
cp .env.production.example .env
cp backend/.env.production.example backend/.env.production
```

Edit both files with real production values. `backend/.env.production` must contain server-only secrets such as `SUPABASE_SERVICE_KEY`, `DATABASE_URL`, and `JWT_SECRET`.

Run the first deployment manually to confirm Docker works:

```bash
APP_DIR=/opt/labintel DEPLOY_BRANCH=feature/cicd-testing bash scripts/deploy-vps.sh
```

## Deployment Behavior

The deploy job connects with SSH, fetches the selected branch, fast-forwards the working tree, rebuilds Docker images, starts containers, removes orphaned containers, prints `docker compose ps`, and prunes unused images.

The frontend container serves static files with nginx and proxies `/api/*` to the backend container. The backend is not exposed directly to the public internet by Compose.

## Checking GitHub Actions Logs

After pushing the branch, open the repository on GitHub, go to Actions, select the `CI/CD` workflow run, and verify:

- `Install, Test, and Build` completed successfully.
- `Build Docker Images` produced frontend and backend images.
- `Deploy to VPS` shows the SSH session output, including `docker compose build`, `docker compose up -d`, and `docker compose ps`.

If deployment fails because `backend/.env.production` is missing, create it on the VPS from the example file and rerun the workflow.
