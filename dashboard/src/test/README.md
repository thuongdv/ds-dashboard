# Dashboard Unit Tests

This directory contains comprehensive unit tests for the Test Results Dashboard application.

## Test Structure

### Test Files

- **`utils.test.ts`** - Tests for utility functions

  - `parseTestReport()` - Parse test report data
  - `calculateSummary()` - Calculate test statistics
  - `calculatePassedRate()` - Calculate pass rate percentage
  - `parseDuration()` - Parse duration strings
  - `formatDuration()` - Format seconds to HH:MM:SS
  - `groupTestsByName()` - Group tests by name and scenario
  - `calculateFlakyTests()` - Identify flaky tests
  - `calculateProjectSummary()` - Calculate project-level statistics
  - `getTestCases()` - Convert test results to test cases
  - `extractDateFromPath()` - Extract date from file paths

- **`dataLoader.test.ts`** - Tests for data loading functions

  - `generateSummaryRows()` - Generate summary data from reports
  - `loadReportByIndex()` - Load reports by index

- **`components/Card/Card.test.tsx`** - Tests for Card components

  - `Card` - Basic card rendering with title, content, and actions
  - `StatCard` - Statistics card with icon, label, value, and trends

- **`components/Dashboard.test.tsx`** - Tests for Dashboard component

  - Loading states
  - Data rendering
  - View switching (Summary, Flaky Tests, PODS Queue)
  - Statistics calculations
  - Navigation

- **`components/ReportDetail.test.tsx`** - Tests for ReportDetail component
  - Loading and displaying report data
  - Filtering tests by status
  - Chart rendering
  - Export to Excel functionality
  - Copy test names to clipboard
  - Screenshot modal
  - Error handling

### Test Utilities

- **`setup.ts`** - Test environment configuration

  - Configures jsdom environment
  - Sets up cleanup after each test
  - Mocks browser APIs (matchMedia, clipboard, execCommand)

- **`mockData.ts`** - Mock data for tests
  - Sample test results
  - Mock reports
  - Flaky test data

## Running Tests

### Run all tests

```bash
npm test
```

### Run tests in watch mode

```bash
npm test -- --watch
```

### Run tests with UI

```bash
npm run test:ui
```

### Run tests with coverage

```bash
npm run test:coverage
```

### Run specific test file

```bash
npm test -- utils.test.ts
```

### Run tests matching a pattern

```bash
npm test -- -t "calculateSummary"
```

## Test Coverage

The test suite covers:

- ✅ All utility functions (100% coverage)
- ✅ Data loading and processing
- ✅ Component rendering
- ✅ User interactions
- ✅ Error handling
- ✅ Edge cases

## Writing New Tests

### Example test structure:

```typescript
import { describe, expect, it } from "vitest";
import { functionToTest } from "../yourModule";

describe("YourModule", () => {
  describe("functionToTest", () => {
    it("should do something specific", () => {
      const result = functionToTest(input);
      expect(result).toBe(expectedOutput);
    });

    it("should handle edge cases", () => {
      expect(functionToTest(edgeCase)).toBe(expectedResult);
    });
  });
});
```

### Component test example:

```typescript
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { YourComponent } from "./YourComponent";

describe("YourComponent", () => {
  it("should render correctly", () => {
    render(<YourComponent />);
    expect(screen.getByText("Expected text")).toBeInTheDocument();
  });

  it("should handle user interaction", async () => {
    const user = userEvent.setup();
    render(<YourComponent />);

    await user.click(screen.getByRole("button"));

    await waitFor(() => {
      expect(screen.getByText("Updated text")).toBeInTheDocument();
    });
  });
});
```

## Best Practices

1. **Test behavior, not implementation** - Focus on what the code does, not how it does it
2. **Use descriptive test names** - "should calculate correct pass rate" is better than "test1"
3. **Arrange-Act-Assert** - Structure tests with clear setup, action, and verification
4. **Mock external dependencies** - Isolate units under test
5. **Test edge cases** - Empty arrays, null values, invalid inputs
6. **Keep tests independent** - Each test should run in isolation
7. **Use beforeEach for setup** - Clean slate for each test

## Troubleshooting

### Tests failing due to import errors

Run `npm install` to ensure all dependencies are installed.

### React component tests failing

Check that the component is wrapped in necessary providers (Router, Context, etc.).

### Async tests timing out

Increase timeout in individual test: `it("test", async () => {...}, 10000)`

### Coverage not generating

Install coverage provider: `npm install -D @vitest/coverage-v8`

## CI/CD Integration

Tests can be integrated into CI/CD pipelines:

```yaml
# Example GitHub Actions workflow
- name: Run tests
  run: npm test

- name: Generate coverage
  run: npm run test:coverage
```

## Additional Resources

- [Vitest Documentation](https://vitest.dev/)
- [React Testing Library](https://testing-library.com/react)
- [Testing Best Practices](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)
