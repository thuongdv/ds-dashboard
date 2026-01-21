#!/bin/bash
# DWS Test Results Collector - Custom Parameters - Bash Script
# Collects more test results with custom parameters
# Default: 1 queue result, 150 tests per queue

cd "$(dirname "$0")/.."

echo "Running DWS Test Results Collector with custom parameters..."
TEST_TIMEOUT=1200 NUMBER_OF_QUEUE_RESULTS=3 NUMBER_OF_TESTS_PER_QUEUE=200 npx playwright test dws-test-results-collector.spec.ts
