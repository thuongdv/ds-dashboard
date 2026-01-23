# Copilot Instructions for ds-dashboard

This repo has three parts that work together:

- collector/: Playwright-based data collector that logs into DWS, pulls automated test results, enriches with Jira keys, and writes JSON reports + screenshots.
- dws-report/: Output data store (date-grouped JSON + screenshots) consumed by the dashboard.
- dashboard/: React + Vite UI that imports those JSON files at build time and visualizes summaries and details.
- iac/: Pulumi TypeScript infra (provisions AWS Fargate cluster with HAProxy/Nginx sidecar pattern; service selection is driven by a stack config key).

## Architecture & Data Flow

- Source of truth: DWS APIs (endpoints built from `DWS_URL`) and Jira search API.
- Collector writes reports to `REPORTS_PATH` as `YYYY-MM-DD/*.json` plus `screenshots/`.
- Dashboard loads reports via Vite glob import: `../../dws-report/reports/YYYY-MM-DD/*.json` (eager). New reports require a rebuild to appear in the UI.
- Types the dashboard expects are defined in `src/types.ts` (`TestReport`, `TestResult`). Collector should preserve these shapes.

Key references:

- Collector settings: `collector/src/settings.ts` (strict env validation).
- DWS constants and queues: `collector/src/constants/dws.ts` uses root `dws-queues.json`.
- DWS API client: `collector/src/utils/dws-api.ts` (uses Playwright `APIRequestContext`).
- File I/O helpers: `collector/src/utils/file-utils.ts`.
- Dashboard data load: `dashboard/src/dataLoader.ts` and processing in `dashboard/src/utils.ts`.
- Infra entry/factory: `iac/index.ts`, `iac/deployment/factory.ts`.

## Developer Workflows

- Collector (Playwright):
  - Env file: create `collector/.env` with `DWS_URL`, `DWS_EMAIL`, `DWS_PASSWORD`, `REPORTS_PATH`, `JIRA_BASE_URL`, `JIRA_API_TOKEN`, `JIRA_EMAIL`, `JIRA_PROJECT`.
  - Auth: tests rely on a logged-in storage state (`AUTH_FILE` in `settings.ts`: `playwright/.auth/dws-user.json`). Ensure login flow populates it before calling DWS APIs.
  - Run: `cd collector && npm install` then `npm run test:collector` (or `NUMBER_OF_QUEUE_RESULTS=1 npm run test:collector:single`).
  - Output: JSON to `REPORTS_PATH/YYYY-MM-DD/<Project>.json` and queue IDs tracked in `<abbr>-queue-ids-tracker.txt`; screenshots saved under `REPORTS_PATH/screenshots/` and referenced as `screenshots/<file>.png`.

- Dashboard (Vite + Vitest):
  - Dev: `cd dashboard && npm install && npm run dev` (http://localhost:5173).
  - Build/Preview: `npm run build && npm run preview`.
  - Tests: `npm test`, `npm run test:ui`, `npm run test:coverage` (see `dashboard/src/test/README.md`).
  - Data source: Reports are statically imported at build time via Vite glob. Add new reports under `dws-report/reports/YYYY-MM-DD/` then rebuild.
  - Deployment: Built artifacts are containerized in Fargate (HAProxy frontend, Nginx backend). Dashboard files are served via Nginx on localhost:80 inside the task; HAProxy exposes port 8080 to the ALB.

- Infra (Pulumi):
  - Stack config key `iac:serviceName` selects a registered service in `iac/deployment/factory.ts`.
  - Current registered key: `"dashboard-service"` → provisions AWS Fargate cluster with HAProxy/Nginx sidecar pattern and Application Load Balancer.
  - Typical flow: `cd iac && npm install && pulumi stack select <stack> && pulumi config set iac:serviceName dashboard-service && pulumi up`.

## Conventions & Patterns

- Queues registry: `dws-queues.json` drives both collector and dashboard. Each entry: `{ name, standardName, storeStatusFile }`.
- Report schema: Collector should emit objects matching `dashboard/src/types.ts` (`data.Value` array). Enrichment fields used by the UI: `cErrorTitle`, `cErrorDescription`, `cImageUrl`, `cJiraKey`.
- Jira caching: Root-level `test-name-jira-key-mapping.json` stores name→key lookups between runs (see `collector/src/tests/dws-test-results-collector.spec.ts`).
- Screenshots: Collector saves images locally and records relative paths (`screenshots/...`) so the dashboard can reference them when the folder is served alongside the app.
- Logging: Both apps have `logger.ts` utilities; keep messages actionable and non-verbose.

## Safe Changes & Gotchas for Agents

- Don’t move `dws-report/reports` or change the Vite glob pattern in `dashboard/src/dataLoader.ts` without updating data loading tests and rebuild behavior.
- When changing report shape, update `dashboard/src/types.ts` and all utility functions that consume it (`utils.ts`, `components/*`).
- If adding a service to infra, register it in `iac/deployment/factory.ts` and align `Pulumi.<stack>.yaml` `iac:serviceName` accordingly.
- Adding a new project: update `dws-queues.json` (kept at repo root) and ensure `storeStatusFile` is unique.
- Playwright auth: API calls reuse browser cookies; make sure `playwright/.auth/dws-user.json` is created by a login step before collectors run.

## Examples

- Run a single result per queue in the collector:
  - `cd collector && NUMBER_OF_QUEUE_RESULTS=1 npm run test:collector:single`
- Add a new date’s reports for the dashboard:
  - Copy JSON to `dws-report/reports/YYYY-MM-DD/`, then `cd dashboard && npm run build`.

If anything here seems off (e.g., desired dashboard deployment target, live data fetching vs. build-time import, or the intended Pulumi service key), tell us and we’ll clarify and update.

## Deployment Notes

- Dashboard is containerized and runs on AWS Fargate within a sidecar pattern: HAProxy (reverse proxy on :8080) and Nginx (static file server on :80).
- ALB routes HTTPS traffic to the HAProxy container; HAProxy forwards to Nginx via localhost.
- Fargate tasks are auto-managed by ECS Service for self-healing on crash.
- Screenshots in `dws-report/screenshots/` must be served alongside the built dashboard (Nginx static files).
