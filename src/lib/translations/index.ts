import ko from './ko';
import en from './en';

export type Language = 'ko' | 'en';

type TranslationNamespace = { readonly [key: string]: string };
export type Translations = { readonly [ns: string]: TranslationNamespace };

const translations: Record<Language, Translations> = { ko, en };

export function getTranslations(lang: Language): Translations {
  return translations[lang];
}

export function t(
  translations: Translations,
  key: string,
  params?: Record<string, string | number>
): string {
  const keys = key.split('.');
  let value: any = translations;
  for (const k of keys) {
    value = value?.[k];
  }
  if (typeof value !== 'string') return key;
  if (!params) return value;
  return value.replace(/\{(\w+)\}/g, (_: string, name: string) =>
    params[name] !== undefined ? String(params[name]) : `{${name}}`
  );
}
