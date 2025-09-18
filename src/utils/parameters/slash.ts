import { Interaction } from 'detritus-client';

import {
  GoogleLocales,
  GoogleLocalesText,
  MLDiffusionModels,
  UserFallbacksMediaImageTypes,
  UserSettingsResponseDisplayTypes,
  UserUploadThresholdTypes,
} from '../../constants';
import { DefaultParameters, toTitleCase } from '../../utils';



export interface OneOfOptions<T> {
  choices: Record<string, T>,
  defaultChoice?: T,
  descriptions?: Record<any, string>,
  doNotSort?: boolean,
  doNotSortDefault?: boolean,
}

export function oneOf<T>(options: OneOfOptions<T>): Array<{name: string, value: number | string}> {
  const entries = (Array.isArray(options.choices)) ? options.choices.map((x) => [x, x]) : Object.entries(options.choices);

  let choices: Array<{name: string, value: number | string}> = [];
  for (let [key, value] of entries) {
    let name: string = ((options.descriptions) ? (options.descriptions as any)[value] : '') || '';
    if (!name) {
      name = toTitleCase(key);
    }
    if (options.defaultChoice && options.defaultChoice === value) {
      name = `${name} (Default)`;
    }
    choices.push({name, value: value as any});
  }
  if (!options.doNotSort) {
    choices = choices.sort((x, y) => {
      return x.name.localeCompare(y.name);
    });
  }
  if (options.defaultChoice && !options.doNotSortDefault) {
    choices = choices.sort((x, y) => (x.value === options.defaultChoice) ? -1 : 0);
  }
  return choices.slice(0, 25);
}


export const GOOGLE_LOCALES = [
  GoogleLocales.ENGLISH,
  GoogleLocales.ARABIC,
  GoogleLocales.CHINESE_SIMPLIFIED,
  GoogleLocales.CHINESE_TRADITIONAL,
  GoogleLocales.DUTCH,
  GoogleLocales.FINNISH,
  GoogleLocales.FRENCH,
  GoogleLocales.GERMAN,
  GoogleLocales.GREEK,
  GoogleLocales.HEBREW,
  GoogleLocales.INDONESIAN,
  GoogleLocales.ITALIAN,
  GoogleLocales.JAPANESE,
  GoogleLocales.KOREAN,
  GoogleLocales.MONGOLIAN,
  GoogleLocales.NORWEGIAN,
  GoogleLocales.POLISH,
  GoogleLocales.PUNJABI,
  GoogleLocales.PORTUGUESE_BRAZIL,
  GoogleLocales.PORTUGUESE_PORTUGAL,
  GoogleLocales.RUSSIAN,
  GoogleLocales.SPANISH,
  GoogleLocales.SWEDISH,
  GoogleLocales.TURKISH,
  GoogleLocales.VIETNAMESE,
].map((x) => ({name: GoogleLocalesText[x], value: x}));


export const USER_FALLBACKS_MEDIA_IMAGE_TYPES = [
  {name: 'Search Google Images', value: UserFallbacksMediaImageTypes.SEARCH_GOOGLE_IMAGES},
  {name: 'Search Duck Duck Go Images', value: UserFallbacksMediaImageTypes.SEARCH_DUCK_DUCK_GO_IMAGES},
  {name: 'Generate Image', value: UserFallbacksMediaImageTypes.IMAGINE},
];


export const USER_SETTINGS_RESPONSE_DISPLAY = [
  {name: 'Latest (Default)', value: UserSettingsResponseDisplayTypes.DEFAULT},
  {name: 'No Embeds (Text Only)', value: UserSettingsResponseDisplayTypes.NO_EMBED},
  {name: 'Legacy (Embeds)', value: UserSettingsResponseDisplayTypes.LEGACY},
];


export const USER_UPLOAD_THRESHOLD_TYPES = [
  {name: 'Exceeds Discord File Size Limits (Default)', value: UserUploadThresholdTypes.EXCEEDS_DISCORD_LIMIT},
  {name: 'Always', value: UserUploadThresholdTypes.ALWAYS},
  {name: 'Never', value: UserUploadThresholdTypes.NEVER},
];


export function safe(value: boolean, context: Interaction.InteractionContext): Boolean {
  if (value) {
    return value;
  }

  const shouldBeSafe = DefaultParameters.safe(context);
  if (shouldBeSafe) {
    throw new Error('Channel doesn\'t support disabling NSFW filtering.');
  }
  return value;
}
