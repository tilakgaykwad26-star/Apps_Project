import { mr } from './mr';
import { hi } from './hi';
import { en } from './en';

export type LanguageCode = 'mr' | 'hi' | 'en';

export const translations = {
  mr,
  hi,
  en,
};

export const defaultLanguage: LanguageCode = 'mr';
