import {getRequestConfig} from 'next-intl/server';
import {notFound} from 'next/navigation';
 
// Supported language list
export const locales = ['en', 'zh', 'ja', 'pt-BR', 'zh-TW'];
export const defaultLocale = 'en';
 
export default getRequestConfig(async ({locale}) => {
  // Validate if language is supported
  if (!locales.includes(locale as any)) notFound();
 
  return {
    messages: (await import(`../messages/${locale}.json`)).default
  };
});
