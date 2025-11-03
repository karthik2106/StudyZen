export {};

declare global {
  interface ChromeStorageArea {
    get: (
      keys: string | string[] | Record<string, unknown> | null,
      callback: (items: Record<string, unknown>) => void,
    ) => void;
    set: (items: Record<string, unknown>, callback: () => void) => void;
  }

  interface ChromeRuntime {
    lastError?: { message?: string };
    setUninstallURL?: (url: string) => void;
  }

  interface Chrome {
    storage?: {
      sync?: ChromeStorageArea;
    };
    runtime?: ChromeRuntime;
  }

  const chrome: Chrome | undefined;
}
