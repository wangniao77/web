import '@testing-library/jest-dom/vitest';
import { vi } from 'vitest';

class ResizeObserverMock {
  observe() {
    return undefined;
  }

  unobserve() {
    return undefined;
  }

  disconnect() {
    return undefined;
  }
}

Object.defineProperty(window, 'ResizeObserver', {
  writable: true,
  configurable: true,
  value: ResizeObserverMock
});

vi.mock('echarts', () => {
  const chart = {
    setOption: vi.fn(),
    resize: vi.fn(),
    dispose: vi.fn()
  };

  return {
    init: vi.fn(() => chart),
    registerMap: vi.fn(),
    graphic: {
      LinearGradient: class LinearGradient {
        constructor(
          public x: number,
          public y: number,
          public x2: number,
          public y2: number,
          public colorStops: Array<{ offset: number; color: string }>
        ) {}
      }
    }
  };
});
