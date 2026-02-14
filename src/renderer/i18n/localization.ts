import {configureLocalization} from '@lit/localize';
import {sourceLocale, targetLocales} from './locale-codes.js';

/**
 * Simplified runtime localization.
 * This provides locale switching using lit-localize.
 */

export const {getLocale, setLocale} = configureLocalization({
  sourceLocale,
  targetLocales,
  loadLocale: (locale) => import(`./locales/${locale}.ts`),
});

