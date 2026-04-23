// localStorage — persists across sessions

export const local = {
  set: (key: string, value: unknown): void => {
    localStorage.setItem(key, JSON.stringify(value));
  },
  get: <T>(key: string): T | null => {
    const item = localStorage.getItem(key);
    if (!item) return null;
    try {
      return JSON.parse(item) as T;
    } catch {
      return null;
    }
  },
  remove: (key: string): void => {
    localStorage.removeItem(key);
  },
  clear: (): void => {
    localStorage.clear();
  },
};

// sessionStorage — cleared when tab closes
export const session = {
  set: (key: string, value: unknown): void => {
    sessionStorage.setItem(key, JSON.stringify(value));
  },
  get: <T>(key: string): T | null => {
    const item = sessionStorage.getItem(key);
    if (!item) return null;
    try {
      return JSON.parse(item) as T;
    } catch {
      return null;
    }
  },
  remove: (key: string): void => {
    sessionStorage.removeItem(key);
  },
  clear: (): void => {
    sessionStorage.clear();
  },
};

// cookieStorage — survives tab close, readable by server
export const cookies = {
  set: (key: string, value: string, days = 7): void => {
    const expires = new Date();
    expires.setDate(expires.getDate() + days);
    document.cookie = `${key}=${encodeURIComponent(value)};expires=${expires.toUTCString()};path=/;SameSite=Strict`;
  },
  get: (key: string): string | null => {
    const match = document.cookie
      .split('; ')
      .find((row) => row.startsWith(`${key}=`));
    return match ? decodeURIComponent(match.split('=')[1]) : null;
  },
  remove: (key: string): void => {
    document.cookie = `${key}=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/`;
  },
};