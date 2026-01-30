#!/bin/bash
# DWS Queue Results Collector - Bash Script
# Collects queue-level summary data from DWS
# Default: 1 queue result, 150 tests per queue

cd "$(dirname "$0")/.."

echo "Running DWS Queue Results Collector..."
TEST_TIMEOUT=1200 NUMBER_OF_QUEUE_RESULTS=3 NUMBER_OF_TESTS_PER_QUEUE=200 npx playwright test dws-queue-results-collector.spec.ts
