import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';

// These QR tests retain DOM-based Testing Library assertions alongside upstream's native browser tests.
afterEach(() => {
  cleanup();
});
