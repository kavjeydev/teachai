import '@testing-library/jest-dom'

// Mock DOM properties that might not be available in test environment
Object.defineProperty(window, 'performance', {
  value: {
    now: jest.fn(() => Date.now())
  }
});

// Mock console methods for cleaner test output
global.console = {
  ...console,
  // Uncomment to silence warnings in tests
  // warn: jest.fn(),
  // error: jest.fn(),
};
