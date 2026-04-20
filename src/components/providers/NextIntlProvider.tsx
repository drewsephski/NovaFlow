import { NextIntlClientProvider } from 'next-intl';
import { useEffect, useState } from 'react';

// Load locale messages
async function loadMessages(locale: string) {
  try {
    return (await import(`../../../messages/${locale}.json`)).default;
  } catch (error) {
    console.error(`Failed to load messages for locale: ${locale}`, error);
    // If loading fails, fallback to English
    return (await import(`../../../messages/en.json`)).default;
  }
}

// Load English messages as fallback
async function loadFallbackMessages() {
  return (await import(`../../../messages/en.json`)).default;
}

// Deep merge objects, fill missing translations with English
function deepMerge(target: any, source: any): any {
  const result = { ...target };
  
  for (const key in source) {
    if (source.hasOwnProperty(key)) {
      if (typeof source[key] === 'object' && source[key] !== null && !Array.isArray(source[key])) {
        // If object, recursively merge
        result[key] = deepMerge(target[key] || {}, source[key]);
      } else if (!(key in target)) {
        // If key doesn't exist in target, use source (English) value
        result[key] = source[key];
      }
    }
  }
  
  return result;
}

export function NextIntlProvider({ children }: { children: React.ReactNode }) {
  const [messages, setMessages] = useState<any>(null);
  const [locale, setLocale] = useState<string>('en');

  useEffect(() => {
    // Get language setting from localStorage
    const savedLocale = localStorage.getItem('app-language') || 'en';
    setLocale(savedLocale);
    
    // Load locale messages and English fallback
    Promise.all([
      loadMessages(savedLocale),
      loadFallbackMessages()
    ]).then(([currentMessages, fallbackMessages]) => {
      // If English, use directly
      if (savedLocale === 'en') {
        setMessages(currentMessages);
      } else {
        // Other languages, fill missing translations with English
        const mergedMessages = deepMerge(currentMessages, fallbackMessages);
        setMessages(mergedMessages);
      }
    });
  }, []);

  // Wait for messages to load
  if (!messages) {
    return null;
  }

  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      {children}
    </NextIntlClientProvider>
  );
}
