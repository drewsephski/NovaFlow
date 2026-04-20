import { platform } from "@tauri-apps/plugin-os";

// Cache platform detection results
let cachedResult: boolean | null = null;
let cachedTauriResult: boolean | null = null;

// Check if running in Tauri environment (sync check, no API call)
function isTauriEnvironment(): boolean {
  return typeof window !== 'undefined' && !!(window as any).__TAURI__;
}

// Async function to check if device is mobile
export function isMobileDevice() {
  // Return cached result if already checked
  if (cachedResult !== null) {
    return cachedResult;
  }

  // Use user agent detection if not in Tauri environment
  if (!isTauriEnvironment()) {
    if (typeof window !== 'undefined' && typeof navigator !== 'undefined') {
      const userAgent = navigator.userAgent.toLowerCase();
      cachedResult = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent);
      return cachedResult;
    }
    cachedResult = false;
    return false;
  }

  try {
    const platformName = platform();
    cachedResult = platformName === 'android' || platformName === 'ios';
    return cachedResult;
  } catch {
    // Fall back to user agent detection if Tauri API fails
    if (typeof window !== 'undefined' && typeof navigator !== 'undefined') {
      const userAgent = navigator.userAgent.toLowerCase();
      cachedResult = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent);
      return cachedResult;
    }
    cachedResult = false;
    return false;
  }
}

// Check if running in Tauri environment
export function checkIsTauri(): boolean {
  // Return cached result if already checked
  if (cachedTauriResult !== null) {
    return cachedTauriResult;
  }

  cachedTauriResult = isTauriEnvironment();
  return cachedTauriResult;
}
