# Production Readiness Checklist (Full Stack)

This document is a practical checklist to move the Coin Catalog stack to production.

## Frontend (this repository)

- [ ] Set real production environment variables (see `.env.example`)
- [ ] Set `APP_ENV=production`
- [ ] Set `API_URL` to your public HTTPS backend URL
- [ ] Keep `ALLOW_OFFLINE_AUTH=false` in production
- [ ] Disable verbose logs (`ENABLE_VERBOSE_LOGGING=false`)
- [ ] Build and verify web export:
  ```bash
  npm ci
  npm run build:web
  ```
- [ ] Build and run container:
  ```bash
  docker build -t coin-catalog-fe .
  docker run -p 8080:80 coin-catalog-fe
  ```
- [ ] Verify health endpoint:
  ```bash
  curl http://localhost:8080/healthz
  ```

## Backend (`coin-catalog-BE`)

- [ ] Enforce strict request validation (DTO/schema validation)
- [ ] Configure CORS to allow only trusted app domains
- [ ] Enforce HTTPS and secure headers at ingress/reverse proxy
- [ ] Add centralized error handling with sanitized responses
- [ ] Add auth rate limiting (login/register/pro-code endpoints)
- [ ] Add DB migration strategy and rollback plan
- [ ] Add health/readiness/liveness endpoints
- [ ] Add structured logs + request IDs
- [ ] Add metrics + monitoring (error rate, latency, saturation)
- [ ] Add CI with tests, lint, and build checks
- [ ] Add deployment strategy (staging -> production promotion)
- [ ] Store secrets in secret manager (never in repo)

## Release gates (must pass)

1. CI green on both FE and BE
2. Smoke tests against staging backend
3. Security checks (dependency audit + config review)
4. Rollback plan documented and tested
5. Observability dashboards and alerts enabled
