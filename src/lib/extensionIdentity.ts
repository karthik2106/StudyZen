const STORAGE_KEY = "study-zen-extension-id";

const generateId = (): string => {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }

  const template = "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx";
  return template.replace(/[xy]/g, (char) => {
    const rand = (Math.random() * 16) | 0;
    const value = char === "x" ? rand : (rand & 0x3) | 0x8;
    return value.toString(16);
  });
};

let cachedId: string | null = null;

const getFromChromeStorage = async (): Promise<string | null> => {
  if (typeof chrome === "undefined" || !chrome.storage?.sync) {
    return null;
  }

  return new Promise((resolve) => {
    chrome.storage.sync.get(STORAGE_KEY, (result) => {
      if (chrome.runtime?.lastError) {
        console.warn("Unable to read extension ID from chrome.storage:", chrome.runtime.lastError);
        resolve(null);
        return;
      }

      resolve(typeof result[STORAGE_KEY] === "string" ? result[STORAGE_KEY] : null);
    });
  });
};

const persistToChromeStorage = async (id: string): Promise<void> => {
  if (typeof chrome === "undefined" || !chrome.storage?.sync) {
    return;
  }

  return new Promise((resolve) => {
    chrome.storage.sync.set({ [STORAGE_KEY]: id }, () => {
      if (chrome.runtime?.lastError) {
        console.warn("Unable to persist extension ID to chrome.storage:", chrome.runtime.lastError);
      }
      resolve();
    });
  });
};

const getFromLocalStorage = (): string | null => {
  if (typeof window === "undefined") {
    return null;
  }
  try {
    const value = window.localStorage.getItem(STORAGE_KEY);
    return value && value.length > 0 ? value : null;
  } catch (error) {
    console.warn("Unable to read extension ID from localStorage:", error);
    return null;
  }
};

const persistToLocalStorage = (id: string): void => {
  if (typeof window === "undefined") {
    return;
  }
  try {
    window.localStorage.setItem(STORAGE_KEY, id);
  } catch (error) {
    console.warn("Unable to persist extension ID to localStorage:", error);
  }
};

export const getExtensionIdentity = async (): Promise<string> => {
  if (cachedId) {
    return cachedId;
  }

  const storedChromeId = await getFromChromeStorage();
  if (storedChromeId) {
    cachedId = storedChromeId;
    persistToLocalStorage(storedChromeId);
    return storedChromeId;
  }

  const storedLocalId = getFromLocalStorage();
  if (storedLocalId) {
    cachedId = storedLocalId;
    await persistToChromeStorage(storedLocalId);
    return storedLocalId;
  }

  const newId = generateId();
  cachedId = newId;
  await persistToChromeStorage(newId);
  persistToLocalStorage(newId);
  return newId;
};
