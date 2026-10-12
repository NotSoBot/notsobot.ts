import { Command, Interaction } from 'detritus-client';
import { ComponentContext } from 'detritus-client/lib/utils';

import UserSettingsStore from '../../stores/usersettings';

import { English } from './languages/en';
import { PortugueseBrazil } from './languages/pt-BR';
import { Russian } from './languages/ru';
import { Spanish } from './languages/es';
import { Turkish } from './languages/tr';


export enum Languages {
  ENGLISH = 'en',
  PORTUGUESE_BRAZIL = 'pt-BR',
  RUSSIAN = 'ru',
  SPANISH = 'es',
  TURKISH = 'tr',
}

export type TranslationKey = keyof typeof English;
// values are turned into strings with String(), so users/channels/numbers can be passed in directly like in template literals
export type TranslationVariables = Record<string, unknown>;
export type Translations = Partial<Record<TranslationKey, string>>;

export const LanguageTranslations: Record<Languages, Translations> = Object.freeze({
  [Languages.ENGLISH]: English,
  [Languages.PORTUGUESE_BRAZIL]: PortugueseBrazil,
  [Languages.RUSSIAN]: Russian,
  [Languages.SPANISH]: Spanish,
  [Languages.TURKISH]: Turkish,
});


// Converts any locale string ('es', 'es-ES', 'es-419', 'en-US', 'pt-BR', etc) into a supported language
// an exact match wins ('pt-BR'), otherwise it matches on the base language ('pt-PT' and 'pt' use 'pt-BR')
export function languageFromLocale(locale?: string | null): Languages | null {
  if (locale) {
    const normalized = locale.toLowerCase().replace(/_/g, '-');
    const base = normalized.split('-').shift();
    const languages = Object.values(Languages);
    for (let language of languages) {
      if (language.toLowerCase() === normalized) {
        return language;
      }
    }
    for (let language of languages) {
      if (language.toLowerCase().split('-').shift() === base) {
        return language;
      }
    }
  }
  return null;
}


export type LanguageContext = Command.Context | Interaction.InteractionContext | ComponentContext;

// User's notsobot setting -> User's discord client locale (interactions only) -> Guild's preferred locale -> English
export function resolveLanguage(context: LanguageContext, settings?: {locale: string | null} | null): Languages {
  const language = (
    languageFromLocale(settings && settings.locale) ||
    languageFromLocale((context instanceof Command.Context) ? null : context.locale) ||
    languageFromLocale((context.guild) ? context.guild.preferredLocale : null)
  );
  return language || Languages.ENGLISH;
}

export async function getLanguage(context: LanguageContext): Promise<Languages> {
  const settings = await UserSettingsStore.getOrFetch(context, context.userId);
  return resolveLanguage(context, settings);
}


export function t(
  language: Languages,
  key: TranslationKey,
  variables?: TranslationVariables,
): string {
  let text = LanguageTranslations[language][key] ?? English[key];
  if (variables) {
    text = text.replace(/\{(\w+)\}/g, (match, name) => {
      return (name in variables) ? String(variables[name]) : match;
    });
  }
  return text;
}


// Returns `t` with the language already bound, so formatters can call `translate('key')`
export function createTranslator(language: Languages) {
  return (key: TranslationKey, variables?: TranslationVariables) => t(language, key, variables);
}


export interface Translator {
  // for english lookup tables (permission names, badges), keyed by the english text: label('permissions', 'Manage Messages')
  label: (group: string, english: string) => string,
  language: Languages,
  // name of a language code (like 'en' or 'pt-BR'), english keeps notsobot's own names so those replies don't change
  languageName: (code: string, englishText: string, options?: {capitalize?: boolean}) => string,
  translate: (key: TranslationKey, variables?: TranslationVariables) => string,
  // for keys built at runtime (like `presence.status.${status}`), returns the fallback when we don't have the key
  translateMaybe: (key: string, fallback: string) => string,
}

export function getTranslatorForLanguage(language: Languages): Translator {
  const translate = createTranslator(language);
  const translateMaybe = (key: string, fallback: string) => (key in English) ? translate(key as TranslationKey) : fallback;
  return {
    label: (group, english) => translateMaybe(`${group}.${english.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '')}`, english),
    language,
    languageName: (code, englishText, options = {}) => getLanguageName(language, code, englishText, options),
    translate,
    translateMaybe,
  };
}


export function getLanguageName(
  language: Languages,
  code: string,
  englishText: string,
  options: {capitalize?: boolean} = {},
): string {
  if (language === Languages.ENGLISH) {
    return englishText;
  }
  let name: string | undefined;
  try {
    name = new Intl.DisplayNames([language], {type: 'language'}).of(code);
  } catch(error) {
    // invalid codes throw a RangeError
  }
  if (!name || name === code) {
    return englishText;
  }
  // other languages lowercase language names ("español"), which looks off when it's a title on its own
  if (options.capitalize) {
    name = name.charAt(0).toLocaleUpperCase(language) + name.slice(1);
  }
  return name;
}

export async function getTranslator(context: LanguageContext): Promise<Translator> {
  return getTranslatorForLanguage(await getLanguage(context));
}

// for sync code (like argument parsers), uses the user's settings only if they're already cached
// both command clients load them before running a command, so this is usually the same as `getTranslator`
export function getCachedTranslator(context?: LanguageContext | null): Translator {
  if (!context) {
    return getTranslatorForLanguage(Languages.ENGLISH);
  }
  const settings = UserSettingsStore.get(context.userId);
  return getTranslatorForLanguage(resolveLanguage(context, settings));
}


// the discord client locales each language shows up for, english is left out since it's the command's default text
export const DiscordLocalesForLanguage: Record<Languages, Array<string>> = Object.freeze({
  [Languages.ENGLISH]: [],
  [Languages.PORTUGUESE_BRAZIL]: ['pt-BR'],
  [Languages.RUSSIAN]: ['ru'],
  [Languages.SPANISH]: ['es-419', 'es-ES'],
  [Languages.TURKISH]: ['tr'],
});


// for slash command `nameLocalizations`/`descriptionLocalizations`
// returns null instead of {} when nothing is translated, so detritus' command hash still matches what discord has
// keys are sorted since detritus compares the json of this against what discord sends back
export function localizations(key: TranslationKey): Record<string, string> | null {
  const entries: Array<[string, string]> = [];
  for (let language of Object.values(Languages)) {
    const text = LanguageTranslations[language][key];
    if (text) {
      for (let locale of DiscordLocalesForLanguage[language]) {
        entries.push([locale, text]);
      }
    }
  }
  if (!entries.length) {
    return null;
  }
  return Object.fromEntries(entries.sort(([x], [y]) => (x < y) ? -1 : 1));
}


// for slash command choice `nameLocalizations`, `english` is the choice's name without the '(Default)' suffix
// uses `key` when it's translated (falls back to `english`) and appends the translated '(Default)' when `isDefault`
// same null/sorting rules as `localizations` since detritus hashes choices with their localizations too
export function choiceLocalizations(
  english: string,
  key?: string | null,
  isDefault?: boolean,
): Record<string, string> | null {
  if (key && !(key in English)) {
    throw new Error(`Unknown localization key: ${key}`);
  }
  const entries: Array<[string, string]> = [];
  for (let language of Object.values(Languages)) {
    const translations = LanguageTranslations[language];
    let text = (key) ? translations[key as TranslationKey] : undefined;
    if (!text && !isDefault) {
      continue;
    }
    text = text || english;
    if (isDefault) {
      text = `${text} ${translations['choices.default'] ?? English['choices.default']}`;
    }
    for (let locale of DiscordLocalesForLanguage[language]) {
      entries.push([locale, text]);
    }
  }
  if (!entries.length) {
    return null;
  }
  return Object.fromEntries(entries.sort(([x], [y]) => (x < y) ? -1 : 1));
}


// for slash command options (plain objects), spread this in: `{name: 'size', ...optionLocalizations('commands.fun.emoji.size')}`
// uses `${key}.name` and `${key}.description` and leaves the fields out entirely when there's no translation
export function optionLocalizations(key: string): {
  descriptionLocalizations?: Record<string, string>,
  nameLocalizations?: Record<string, string>,
} {
  const result: {descriptionLocalizations?: Record<string, string>, nameLocalizations?: Record<string, string>} = {};
  const nameKey = `${key}.name`;
  const descriptionKey = `${key}.description`;
  if (!(nameKey in English) && !(descriptionKey in English)) {
    throw new Error(`Unknown localization key: ${key}`);
  }
  if (nameKey in English) {
    const value = localizations(nameKey as TranslationKey);
    if (value) {
      result.nameLocalizations = value;
    }
  }
  if (descriptionKey in English) {
    const value = localizations(descriptionKey as TranslationKey);
    if (value) {
      result.descriptionLocalizations = value;
    }
  }
  return result;
}
