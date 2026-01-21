@echo off
REM DWS Queue Results Collector - Windows Batch Script
REM Collects queue-level summary data from DWS
REM Default: 1 queue result, 150 tests per queue

cd "%~dp0.."

echo Running DWS Queue Results Collector...
set TEST_TIMEOUT=1200
set NUMBER_OF_QUEUE_RESULTS=3
set NUMBER_OF_TESTS_PER_QUEUE=200
npx playwright test dws-queue-results-collector.spec.ts
