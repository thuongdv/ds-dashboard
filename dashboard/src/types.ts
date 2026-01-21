export interface TestResult {
  title: string;
  key: string;
  successful: string;
  executedByUserName: string;
  executionStartTimeStamp: string;
  executionEndTimeStamp: string;
  duration: string;
  projectName: string;
  scenarioName: string;
  testName: string;
  cErrorTitle?: string;
  cErrorDescription?: string;
  cImageUrl?: string;
  cJiraKey?: string | null;
}

export interface TestReport {
  data: {
    Value: TestResult[];
  };
  filename?: string; // Original filename without extension
}

export interface SummaryRow {
  date: string;
  total: number;
  passed: number;
  notPassed: number;
  passedRate: string;
  reportPath: string;
}

export interface FlakyTest {
  testName: string;
  scenario: string;
  totalRuns: number;
  pass: number;
  notPassed: number;
  flakyRate: string;
  lastStatus: string;
  jiraKey?: string;
}

export interface ProjectSummary {
  project: string;
  total: number;
  passed: number;
  notPassed: number;
  totalDuration: string;
}

export interface TestCase {
  index: number;
  testName: string;
  scenario: string;
  errorTitle: string;
  errorDescription: string;
  screenshot: string;
  executedBy: string;
  startTime: string;
  endTime: string;
  duration: string;
  status: string;
  jiraKey?: string;
}

export interface QueueResult {
  queueId: string;
  date: string;
  totalTests: number;
  passed: number;
  failed: number;
  passedRate: string;
  duration: string;
}

export interface DwsQueue {
  name: string;
  standardName: string;
  storeStatusFile: string;
}
