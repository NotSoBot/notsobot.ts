import { Command, Interaction } from 'detritus-client';
import { ComponentContext } from 'detritus-client/lib/utils';

import GuildSettingsStore from '../../stores/guildsettings';
import UserSettingsStore from '../../stores/usersettings';

import { Arabic } from './languages/ar';
import { Bulgarian } from './languages/bg';
import { ChineseSimplified } from './languages/zh-CN';
import { ChineseTraditional } from './languages/zh-TW';
import { Croatian } from './languages/hr';
import { Czech } from './languages/cs';
import { Danish } from './languages/da';
import { Dutch } from './languages/nl';
import { English } from './languages/en';
import { Finnish } from './languages/fi';
import { French } from './languages/fr';
import { German } from './languages/de';
import { Greek } from './languages/el';
import { Hebrew } from './languages/he';
import { Hindi } from './languages/hi';
import { Hungarian } from './languages/hu';
import { Indonesian } from './languages/id';
import { Italian } from './languages/it';
import { Japanese } from './languages/ja';
import { Korean } from './languages/ko';
import { Lithuanian } from './languages/lt';
import { Norwegian } from './languages/nb';
import { Polish } from './languages/pl';
import { PortugueseBrazil } from './languages/pt-BR';
import { PortuguesePortugal } from './languages/pt-PT';
import { Romanian } from './languages/ro';
import { Russian } from './languages/ru';
import { Spanish } from './languages/es';
import { Swedish } from './languages/sv';
import { Thai } from './languages/th';
import { Turkish } from './languages/tr';
import { Ukrainian } from './languages/uk';
import { Vietnamese } from './languages/vi';


export enum Languages {
  ARABIC = 'ar',
  BULGARIAN = 'bg',
  CHINESE_SIMPLIFIED = 'zh-CN',
  CHINESE_TRADITIONAL = 'zh-TW',
  CROATIAN = 'hr',
  CZECH = 'cs',
  DANISH = 'da',
  DUTCH = 'nl',
  ENGLISH = 'en',
  FINNISH = 'fi',
  FRENCH = 'fr',
  GERMAN = 'de',
  GREEK = 'el',
  HEBREW = 'he',
  HINDI = 'hi',
  HUNGARIAN = 'hu',
  INDONESIAN = 'id',
  ITALIAN = 'it',
  JAPANESE = 'ja',
  KOREAN = 'ko',
  LITHUANIAN = 'lt',
  NORWEGIAN = 'nb',
  POLISH = 'pl',
  PORTUGUESE_BRAZIL = 'pt-BR',
  PORTUGUESE_PORTUGAL = 'pt-PT',
  ROMANIAN = 'ro',
  RUSSIAN = 'ru',
  SPANISH = 'es',
  SWEDISH = 'sv',
  THAI = 'th',
  TURKISH = 'tr',
  UKRAINIAN = 'uk',
  VIETNAMESE = 'vi',
}

export type TranslationKey = keyof typeof English;
// values are turned into strings with String(), so users/channels/numbers can be passed in directly like in template literals
export type TranslationVariables = Record<string, unknown>;
export type Translations = Partial<Record<TranslationKey, string>>;

export const LanguageTranslations: Record<Languages, Translations> = Object.freeze({
  [Languages.ARABIC]: Arabic,
  [Languages.BULGARIAN]: Bulgarian,
  [Languages.CHINESE_SIMPLIFIED]: ChineseSimplified,
  [Languages.CHINESE_TRADITIONAL]: ChineseTraditional,
  [Languages.CROATIAN]: Croatian,
  [Languages.CZECH]: Czech,
  [Languages.DANISH]: Danish,
  [Languages.DUTCH]: Dutch,
  [Languages.ENGLISH]: English,
  [Languages.FINNISH]: Finnish,
  [Languages.FRENCH]: French,
  [Languages.GERMAN]: German,
  [Languages.GREEK]: Greek,
  [Languages.HEBREW]: Hebrew,
  [Languages.HINDI]: Hindi,
  [Languages.HUNGARIAN]: Hungarian,
  [Languages.INDONESIAN]: Indonesian,
  [Languages.ITALIAN]: Italian,
  [Languages.JAPANESE]: Japanese,
  [Languages.KOREAN]: Korean,
  [Languages.LITHUANIAN]: Lithuanian,
  [Languages.NORWEGIAN]: Norwegian,
  [Languages.POLISH]: Polish,
  [Languages.PORTUGUESE_BRAZIL]: PortugueseBrazil,
  [Languages.PORTUGUESE_PORTUGAL]: PortuguesePortugal,
  [Languages.ROMANIAN]: Romanian,
  [Languages.RUSSIAN]: Russian,
  [Languages.SPANISH]: Spanish,
  [Languages.SWEDISH]: Swedish,
  [Languages.THAI]: Thai,
  [Languages.TURKISH]: Turkish,
  [Languages.UKRAINIAN]: Ukrainian,
  [Languages.VIETNAMESE]: Vietnamese,
});


// older/alternate codes for languages we have, google uses 'iw' for hebrew and discord uses 'no' for norwegian
const LocaleAliases: Record<string, string> = Object.freeze({
  'iw': 'he',
  'nn': 'nb',
  'no': 'nb',
  // slovak readers understand czech fine
  'sk': 'cs',
  'zh-hk': 'zh-tw',
  'zh-mo': 'zh-tw',
});

// Converts any locale string ('es', 'es-ES', 'es-419', 'en-US', 'pt-BR', etc) into a supported language
// an exact match wins ('pt-PT'), otherwise it matches on the base language (the first one in `Languages`, so 'pt' uses 'pt-BR' and 'zh' uses 'zh-CN')
export function languageFromLocale(locale?: string | null): Languages | null {
  if (locale) {
    let normalized = locale.toLowerCase().replace(/_/g, '-');
    normalized = LocaleAliases[normalized] || LocaleAliases[normalized.split('-').shift()!] || normalized;
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

// User's notsobot setting -> User's discord client locale (interactions only) -> Guild's notsobot setting -> Guild's preferred locale -> English
// `guildSettings` defaults to whatever is cached for the context's guild
export function resolveLanguage(
  context: LanguageContext,
  settings?: {locale: string | null} | null,
  guildSettings?: {locale: string | null} | null,
): Languages {
  if (guildSettings === undefined) {
    guildSettings = (context.guildId) ? GuildSettingsStore.get(context.guildId) : null;
  }
  const language = (
    languageFromLocale(settings && settings.locale) ||
    languageFromLocale((context instanceof Command.Context) ? null : context.locale) ||
    languageFromLocale(guildSettings && guildSettings.locale) ||
    languageFromLocale((context.guild) ? context.guild.preferredLocale : null)
  );
  return language || Languages.ENGLISH;
}

export async function getLanguage(context: LanguageContext): Promise<Languages> {
  const [ settings, guildSettings ] = await Promise.all([
    UserSettingsStore.getOrFetch(context, context.userId),
    (context.guildId) ? GuildSettingsStore.getOrFetch(context, context.guildId) : null,
  ]);
  return resolveLanguage(context, settings, guildSettings);
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
// arabic, hebrew and european portuguese have no discord locale, so they only apply to replies
export const DiscordLocalesForLanguage: Record<Languages, Array<string>> = Object.freeze({
  [Languages.ARABIC]: [],
  [Languages.BULGARIAN]: ['bg'],
  [Languages.CHINESE_SIMPLIFIED]: ['zh-CN'],
  [Languages.CHINESE_TRADITIONAL]: ['zh-TW'],
  [Languages.CROATIAN]: ['hr'],
  [Languages.CZECH]: ['cs'],
  [Languages.DANISH]: ['da'],
  [Languages.DUTCH]: ['nl'],
  [Languages.ENGLISH]: [],
  [Languages.FINNISH]: ['fi'],
  [Languages.FRENCH]: ['fr'],
  [Languages.GERMAN]: ['de'],
  [Languages.GREEK]: ['el'],
  [Languages.HEBREW]: [],
  [Languages.HINDI]: ['hi'],
  [Languages.HUNGARIAN]: ['hu'],
  [Languages.INDONESIAN]: ['id'],
  [Languages.ITALIAN]: ['it'],
  [Languages.JAPANESE]: ['ja'],
  [Languages.KOREAN]: ['ko'],
  [Languages.LITHUANIAN]: ['lt'],
  [Languages.NORWEGIAN]: ['no'],
  [Languages.POLISH]: ['pl'],
  [Languages.PORTUGUESE_BRAZIL]: ['pt-BR'],
  [Languages.PORTUGUESE_PORTUGAL]: [],
  [Languages.ROMANIAN]: ['ro'],
  [Languages.RUSSIAN]: ['ru'],
  [Languages.SPANISH]: ['es-419', 'es-ES'],
  [Languages.SWEDISH]: ['sv-SE'],
  [Languages.THAI]: ['th'],
  [Languages.TURKISH]: ['tr'],
  [Languages.UKRAINIAN]: ['uk'],
  [Languages.VIETNAMESE]: ['vi'],
});

// TEMPORARY: locales left out of slash command uploads because of issues on discord's end
// the 14 least used of the locales we upload, replies in these languages still work
// empty this to upload them again
export const DiscordLocalesUploadDisabled: ReadonlySet<string> = new Set([
  'bg', 'cs', 'da', 'el', 'fi', 'hi', 'hr', 'hu', 'lt', 'no', 'ro', 'sv-SE', 'th', 'uk',
]);

export function uploadableDiscordLocales(language: Languages): Array<string> {
  return DiscordLocalesForLanguage[language].filter((locale) => !DiscordLocalesUploadDisabled.has(locale));
}


// for slash command `nameLocalizations`/`descriptionLocalizations`
// returns null instead of {} when nothing is translated, so detritus' command hash still matches what discord has
// keys are sorted since detritus compares the json of this against what discord sends back
export function localizations(key: TranslationKey): Record<string, string> | null {
  const entries: Array<[string, string]> = [];
  for (let language of Object.values(Languages)) {
    const text = LanguageTranslations[language][key];
    if (text) {
      for (let locale of uploadableDiscordLocales(language)) {
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
    for (let locale of uploadableDiscordLocales(language)) {
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
