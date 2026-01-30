#!/bin/bash
cd "$(dirname "$0")/.."

echo "Running DWS Test Results Collector with custom parameters..."
TEST_TIMEOUT=1200 NUMBER_OF_QUEUE_RESULTS=3 NUMBER_OF_TESTS_PER_QUEUE=200 LOG_LEVEL=debug npx playwright test
