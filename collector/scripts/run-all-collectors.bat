@echo off
cd "%~dp0.."

echo Running DWS Test Results Collector with custom parameters...
set TEST_TIMEOUT=1200
set NUMBER_OF_QUEUE_RESULTS=3
set NUMBER_OF_TESTS_PER_QUEUE=200
set LOG_LEVEL=debug
npx playwright test
