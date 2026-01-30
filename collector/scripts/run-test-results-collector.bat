@echo off
REM DWS Test Results Collector - Custom Parameters - Windows Batch Script
REM Collects more test results with custom parameters
REM Default: 1 queue result, 150 tests per queue

cd "%~dp0.."

echo Running DWS Test Results Collector with custom parameters...
set TEST_TIMEOUT=1200
set NUMBER_OF_QUEUE_RESULTS=3
set NUMBER_OF_TESTS_PER_QUEUE=200
npx playwright test dws-test-results-collector.spec.ts
