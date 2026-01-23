# ds-dashboard

Data collection + dashboard for DWS automated test results. The collector logs into DWS and Jira, writes daily JSON reports and screenshots, and the dashboard statically imports those reports to visualize summaries and details. Optional Pulumi IaC provisions the dashboard behind an ALB on ECS/Fargate.

## Repository layout

- `collector/` — Playwright-based collector for DWS and Jira; emits JSON and screenshots.
- `dws-report/` — Generated reports and screenshots (source of truth for the UI build).
- `dashboard/` — React + Vite dashboard that imports reports at build time.
- `iac/` — Pulumi TypeScript infra (ECS/Fargate with HAProxy + Nginx sidecars).
- `dws-queues.json` — Queue registry shared by collector and dashboard.

## Prerequisites

- Node.js 18+ and npm.
- For infra: Pulumi CLI, AWS CLI with credentials, and an existing stack config.

## Quick start

1. Pull reports (or add them under `dws-report/reports/YYYY-MM-DD/`).
2. Build/run the dashboard from `dashboard/`.
3. (Optional) Deploy via Pulumi from `iac/`.

## Collector (Playwright)

- Create `collector/.env` with:
  - `DWS_URL`, `DWS_EMAIL`, `DWS_PASSWORD`
  - `REPORTS_PATH` (absolute path to `dws-report/reports`)
  - `JIRA_BASE_URL`, `JIRA_API_TOKEN`, `JIRA_EMAIL`, `JIRA_PROJECT`
- Ensure the Playwright auth file exists (`collector/playwright/.auth/dws-user.json`) by running the login flow once.
- Install deps and run:
  - `cd collector && npm install`
  - `npm run test:collector` (all queues)
  - `NUMBER_OF_QUEUE_RESULTS=1 npm run test:collector:single` (single item per queue)
- Outputs: `REPORTS_PATH/YYYY-MM-DD/*.json`, queue trackers `*-queue-ids-tracker.txt`, screenshots under `REPORTS_PATH/screenshots/` referenced as `screenshots/<file>.png`.

## Dashboard (Vite)

- Reports are statically imported; add new JSON under `dws-report/reports/YYYY-MM-DD/` then rebuild.
- Install deps and run:
  - `cd dashboard && npm install`
  - `npm run dev` (http://localhost:5173)
  - `npm run build` then `npm run preview`
- Tests: `npm test`, `npm run test:ui`, or `npm run test:coverage` (see `dashboard/src/test/README.md`).

## Infrastructure (Pulumi)

- Service selection is driven by stack config key `iac:serviceName` (registered in `iac/deployment/factory.ts`). Default service: `dashboard-service` (ECS/Fargate with HAProxy front, Nginx static server).
- Typical flow:
  - `cd iac && npm install`
  - `pulumi stack select <stack>`
  - `pulumi config set iac:serviceName dashboard-service`
  - `pulumi up`

## Data flow recap

- Source of truth: DWS APIs and Jira search API.
- Collector writes reports/screenshots → `dws-report/`.
- Dashboard imports those files at build time; new data requires a rebuild.

## Troubleshooting

- No data in UI: confirm new JSON landed under the correct date folder and rebuild the dashboard.
- Collector auth errors: regenerate `playwright/.auth/dws-user.json` by re-running the login flow.
- IaC failures: verify AWS credentials and stack config (especially `iac:serviceName`).

## License

MIT
