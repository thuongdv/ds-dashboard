# Test Results Dashboard

A React.js dashboard for visualizing automated test results from DWS reports.

## Features

- **Overall Summary**: View test execution summary across all dates with pass rates
- **Flaky Tests Detection**: Automatically identifies and displays flaky tests by project
- **Detailed Reports**: Click on any report to see:
  - Pie chart visualization of pass/fail distribution
  - Summary by project
  - Detailed test cases with filtering capabilities

## Getting Started

### Prerequisites

- Node.js 16+ and npm

### Installation

1. Navigate to the dashboard directory:

   ```bash
   cd dashboard
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. **Set up development environment** (creates symlink to screenshots):

   ```bash
   npm run setup:dev
   ```

   > **Note**: This step is required for screenshots to display in development mode. It creates a symlink from `public/dws-report/reports/screenshots` to the actual screenshots folder.
   >
   > On Windows, you may need to run the command prompt as Administrator, or enable Developer Mode in Windows Settings.

### Development

Run the development server:

```bash
npm run dev
```

The dashboard will be available at `http://localhost:5173`

### Building for Production

Build the dashboard:

```bash
npm run build
```

The built files will be in the `dist` directory.

Preview the production build:

```bash
npm run preview
```

## Project Structure

```
dashboard/
├── src/
│   ├── components/          # React components
│   │   ├── Dashboard.tsx    # Main dashboard page
│   │   ├── Dashboard.css
│   │   ├── ReportDetail.tsx # Detailed report page
│   │   └── ReportDetail.css
│   ├── types.ts            # TypeScript type definitions
│   ├── utils.ts            # Utility functions for data processing
│   ├── dataLoader.ts       # Data loading logic
│   ├── App.tsx             # Main App component with routing
│   ├── App.css
│   └── main.tsx            # Application entry point
├── index.html
├── package.json
├── tsconfig.json
└── vite.config.ts
```

## Data Source

The dashboard reads test data from `../dws-report/reports/` directory. Test reports are organized by date:

- `2025-11-24/`
- `2025-11-26/`
- `2025-11-30/`

Each date folder contains JSON files for different projects:

- `01.) JDEdwards Finance.json`
- `02.) JDEdwards Sales & Distribution.json`
- `03.) JDEdwards Manufacturing.json`

## Adding New Reports

To add new reports:

1. Place the JSON files in `dws-report/reports/YYYY-MM-DD/` directory

## Technologies Used

- **React 18** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool and dev server
- **React Router** - Client-side routing
- **Chart.js** & **react-chartjs-2** - Data visualization
- **date-fns** - Date formatting and manipulation
