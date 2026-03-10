import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach, beforeEach, vi } from 'vitest';

type StorageData = Record<string, unknown>;
type RuntimeListener = (
  message: unknown,
  sender: chrome.runtime.MessageSender,
  sendResponse: (response?: unknown) => void,
) => boolean | void;

function createStorageArea(initial: StorageData = {}) {
  let data = { ...initial };

  return {
    async get(keys?: string | string[] | Record<string, unknown> | null) {
      if (keys == null) {
        return { ...data };
      }

      if (typeof keys === 'string') {
        return { [keys]: data[keys] };
      }

      if (Array.isArray(keys)) {
        return keys.reduce<Record<string, unknown>>((result, key) => {
          result[key] = data[key];
          return result;
        }, {});
      }

      return Object.keys(keys).reduce<Record<string, unknown>>((result, key) => {
        result[key] = key in data ? data[key] : keys[key];
        return result;
      }, {});
    },
    async set(items: StorageData) {
      data = { ...data, ...items };
    },
    async remove(keys: string | string[]) {
      const allKeys = Array.isArray(keys) ? keys : [keys];
      for (const key of allKeys) {
        delete data[key];
      }
    },
    async clear() {
      data = {};
    },
  };
}

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

beforeEach(() => {
  const listeners = new Set<RuntimeListener>();
  const storage = createStorageArea();

  const onMessage = {
    addListener: vi.fn((listener: RuntimeListener) => listeners.add(listener)),
    removeListener: vi.fn((listener: RuntimeListener) => listeners.delete(listener)),
    hasListener: vi.fn((listener: RuntimeListener) => listeners.has(listener)),
    hasListeners: vi.fn(() => listeners.size > 0),
    getRules: vi.fn(),
    addRules: vi.fn(),
    removeRules: vi.fn(),
  } as unknown as chrome.events.Event<RuntimeListener>;

  const runtime = {
    sendMessage: vi.fn(),
    openOptionsPage: vi.fn(),
    onMessage,
  } as unknown as typeof chrome.runtime;

  const permissions = {
    contains: vi.fn(async () => true),
    request: vi.fn(async () => true),
    getAll: vi.fn(),
    remove: vi.fn(),
    addHostAccessRequest: vi.fn(),
    removeHostAccessRequest: vi.fn(),
    onAdded: { addListener: vi.fn(), removeListener: vi.fn() },
    onRemoved: { addListener: vi.fn(), removeListener: vi.fn() },
  } as unknown as typeof chrome.permissions;

  const storageLocal = {
    get: vi.fn(storage.get as chrome.storage.StorageArea['get']),
    set: vi.fn(storage.set as chrome.storage.StorageArea['set']),
    remove: vi.fn(storage.remove as chrome.storage.StorageArea['remove']),
    clear: vi.fn(storage.clear as chrome.storage.StorageArea['clear']),
  } as unknown as chrome.storage.StorageArea;

  const tabs = {
    captureVisibleTab: vi.fn(async () => 'data:image/png;base64,Zm9v'),
    query: vi.fn(async () => []),
    sendMessage: vi.fn(async () => undefined),
  } as unknown as typeof chrome.tabs;

  const windows = {
    WINDOW_ID_CURRENT: -2,
  } as unknown as typeof chrome.windows;

  Object.defineProperty(globalThis, 'chrome', {
    configurable: true,
    value: {
      runtime,
      permissions,
      storage: {
        local: storageLocal,
      },
      tabs,
      windows,
    } as unknown as typeof chrome,
  });

  Object.defineProperty(window, 'close', {
    configurable: true,
    value: vi.fn(),
  });

  Object.defineProperty(globalThis.navigator, 'clipboard', {
    configurable: true,
    value: {
      writeText: vi.fn(async () => undefined),
    },
  });

  vi.stubGlobal('fetch', vi.fn());
});
