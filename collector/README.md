# Data Collector

The collector is a Playwright-based automation tool that logs into DWS Dashboard (Dimension SwifTest Dashboard), pulls automated test results, enriches them with Jira keys, and generates JSON reports with screenshots.

## Overview

This collector performs the following tasks:

- **Authentication**: Logs into DWS and maintains a session via browser storage state
- **Test Data Extraction**: Pulls automated test results from DWS APIs using Playwright's `APIRequestContext`
- **Queue Results Collection**: Retrieves results from configured DWS queues
- **Jira Enrichment**: Enriches test data with Jira issue keys and metadata
- **Report Generation**: Writes structured JSON reports to the reports directory, organized by date
- **Screenshot Capture**: Saves test execution screenshots for visual reference

## Setup

### Prerequisites

- Node.js 16+ and npm
- DWS account credentials
- Jira API token (for enrichment)
- Valid `dws-queues.json` configuration at the repo root

### Environment Configuration

Create a `.env` file in the `collector/` directory with the following variables:

```
DWS_URL=https://your-dws-instance.com
DWS_EMAIL=your-email@example.com
DWS_PASSWORD=your-password
REPORTS_PATH=../dws-report/reports
JIRA_BASE_URL=https://your-jira-instance.com
JIRA_API_TOKEN=your-jira-api-token
JIRA_EMAIL=your-jira-email@example.com
JIRA_PROJECT=YOUR-PROJECT-KEY
```

### Installation

```bash
cd collector
npm install
```

## Authentication

The collector uses Playwright's browser automation with a persistent authentication state:

1. On first run, the collector logs into DWS using provided credentials
2. The authentication state is stored in `playwright/.auth/dws-user.json`
3. Subsequent runs reuse this session to avoid re-authentication
4. Ensure the auth file exists and is valid before running collectors; re-run the login flow if the session expires

## Running the Collector

### Run All Collectors

Collects results from all configured queues in `dws-queues.json`:

```bash
npm run test:collector
```

On Windows:

```bash
scripts/run-all-collectors.bat
```

On macOS/Linux:

```bash
scripts/run-all-collectors.sh
```

### Run Specific Collectors

#### Test Results Collector

Pulls automated test results from DWS:

```bash
npm run test:results-collector
```

#### Queue Results Collector

Retrieves results from configured DWS queues:

```bash
npm run test:queue-results-collector
```

### Run with Limited Results

To collect only a single result per queue (useful for testing):

```bash
NUMBER_OF_QUEUE_RESULTS=1 npm run test:collector:single
```

## Output

### Report Structure

Reports are organized by date in the following structure:

```
dws-report/reports/
├── YYYY-MM-DD/
│   ├── 01.) Queue Name_HH-MM-SS.json
│   ├── 02.) Queue Name_HH-MM-SS.json
│   └── ...
├── screenshots/
│   ├── queue-name-test-1.png
│   ├── queue-name-test-2.png
│   └── ...
└── queue-ids-tracker.txt
```

### Report Schema

Each JSON report contains test execution data matching the dashboard's expected schema (see [types.ts](../dashboard/src/types.ts)):

```json
{
  "Value": [
    {
      "testName": "Test Case Name",
      "queueName": "Queue Name",
      "status": "PASS|FAIL|ERROR",
      "duration": 123,
      "executedAt": "2025-01-23T10:30:00Z",
      "cErrorTitle": "Error Title",
      "cErrorDescription": "Error Description",
      "cImageUrl": "screenshots/file.png",
      "cJiraKey": "PROJ-123"
    }
  ]
}
```

### Enrichment Fields

The collector enriches test data with:

- **cJiraKey**: Jira issue key linked to the test (from Jira search)
- **cErrorTitle**: Error summary from test execution
- **cErrorDescription**: Detailed error message
- **cImageUrl**: Relative path to screenshot (e.g., `screenshots/file.png`)

## Key Files

- **[settings.ts](./src/settings.ts)**: Environment variable validation and configuration
- **[constants/dws.ts](./src/constants/dws.ts)**: DWS API constants and queue registry
- **[utils/dws-api.ts](./src/utils/dws-api.ts)**: DWS API client using Playwright's `APIRequestContext`
- **[utils/file-utils.ts](./src/utils/file-utils.ts)**: File I/O helpers for reports and screenshots
- **[utils/jira-client.ts](./src/utils/jira-client.ts)**: Jira API client for issue lookup and enrichment
- **[tests/dws-test-results-collector.spec.ts](./src/tests/dws-test-results-collector.spec.ts)**: Test results collection logic
- **[tests/dws-queue-results-collector.spec.ts](./src/tests/dws-queue-results-collector.spec.ts)**: Queue results collection logic

## Jira Caching

The collector maintains a cache file at the repo root:

- **test-name-jira-key-mapping.json**: Maps test names to Jira keys across runs
- Speeds up enrichment by avoiding redundant Jira API calls
- Updated automatically as new test names are encountered

## Queue Configuration

Queues are defined in [dws-queues.json](../dws-queues.json) at the repo root:

```json
[
  {
    "name": "Queue Display Name",
    "standardName": "queue_standard_name",
    "storeStatusFile": "unique-file-name.json"
  }
]
```

Each queue entry specifies:

- **name**: Display name for reports
- **standardName**: Normalized name used in API calls
- **storeStatusFile**: Unique tracking file for queue state

## Logging

The collector uses a logger utility for actionable, non-verbose output:

- Error messages indicate failures in data collection or enrichment
- Info messages track progress through queue processing
- Debug messages (if enabled) provide detailed API call information

See [logger.ts](./src/logger.ts) for implementation.

## Troubleshooting

### Authentication Failures

- Verify DWS credentials in `.env` are correct
- Delete `playwright/.auth/dws-user.json` and re-run to re-authenticate
- Check that DWS_URL is accessible and responsive

### Missing Jira Enrichment

- Verify JIRA_API_TOKEN is valid
- Ensure JIRA_PROJECT matches your Jira project key
- Check Jira connectivity if API calls timeout

### Report Not Generated

- Verify `REPORTS_PATH` directory exists or is writable
- Check collector logs for specific error messages
- Ensure DWS queue is not empty and API returns valid data

### Screenshots Missing

- Confirm Playwright dependency is installed
- Verify screenshot capture is enabled in DWS test config
- Check file permissions in the screenshots directory

## Development

### Testing

Run the collector tests:

```bash
npm test
```

### Type Checking

```bash
npm run type-check
```

### Building

```bash
npm run build
```

## Integration with Dashboard

The dashboard automatically imports reports generated by this collector:

1. Collector writes JSON to `dws-report/reports/YYYY-MM-DD/`
2. Dashboard's Vite loader imports reports at build time
3. Dashboard must be rebuilt for new reports to appear in the UI

See [Dashboard README](../dashboard/README.md) for more details.
