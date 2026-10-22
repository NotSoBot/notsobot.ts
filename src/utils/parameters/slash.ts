import { Collections, Interaction, Structures } from 'detritus-client';
import { DiscordRegexNames } from 'detritus-client/lib/constants';
import { regex as discordRegex } from 'detritus-client/lib/utils';

import {
  GoogleLocales,
  GoogleLocalesText,
  MLDiffusionModels,
  SEARCH_PROVIDER_IMAGES_DEFAULT,
  SEARCH_PROVIDER_WEB_DEFAULT,
  TagDirectoryCategories,
  UserSettingsApplicationCommandResponseTypes,
  UserSettingsFallbacksMediaImageTypes,
  GuildSettingsResponseDisplayTypes,
  UserSettingsResponseDisplayTypes,
  UserSettingsSearchProviders,
  UserSettingsUploadThresholdTypes,
  UserSettingsUploadTypes,
} from '../../constants';
import { DefaultParameters, fetchMemberOrUserById, isSnowflake, toTitleCase } from '../../utils';

import {
  uploadableDiscordLocales,
  Languages,
  choiceLocalizations,
  getCachedTranslator,
  getLanguageName,
} from '../i18n';

import type { BanPayload, BanPayloadOptions } from './prefixed';



export interface SlashChoice {
  name: string,
  nameLocalizations?: Record<string, string>,
  value: number | string,
}

// `localizationKey` translates each choice using `${localizationKey}.${value}` (value lowercased)
export function createChoice(
  name: string,
  value: number | string,
  options: {isDefault?: boolean, localizationKey?: string | null} = {},
): SlashChoice {
  const nameLocalizations = choiceLocalizations(name, options.localizationKey, options.isDefault);
  return {
    name: (options.isDefault) ? `${name} (Default)` : name,
    ...(nameLocalizations) ? {nameLocalizations} : {},
    value,
  };
}


export interface OneOfOptions<T> {
  choices: Record<string, T>,
  defaultChoice?: T,
  descriptions?: Record<any, string>,
  doNotSort?: boolean,
  doNotSortDefault?: boolean,
  localizationKey?: string,
}

export function oneOf<T>(options: OneOfOptions<T>): Array<SlashChoice> {
  const entries = (Array.isArray(options.choices)) ? options.choices.map((x) => [x, x]) : Object.entries(options.choices);

  let choices: Array<SlashChoice> = [];
  for (let [key, value] of entries) {
    let name: string = ((options.descriptions) ? (options.descriptions as any)[value] : '') || '';
    if (!name) {
      name = toTitleCase(key);
    }
    choices.push(createChoice(name, value as any, {
      isDefault: !!options.defaultChoice && options.defaultChoice === value,
      localizationKey: (options.localizationKey) ? `${options.localizationKey}.${String(value).toLowerCase()}` : null,
    }));
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
].map((x): SlashChoice => {
  const name = GoogleLocalesText[x];
  // language names come from Intl, so every language gets them without needing translation keys
  const entries: Array<[string, string]> = [];
  for (let language of Object.values(Languages)) {
    const text = getLanguageName(language, x, name, {capitalize: true});
    if (text !== name) {
      for (let locale of uploadableDiscordLocales(language)) {
        entries.push([locale, text]);
      }
    }
  }
  if (!entries.length) {
    return {name, value: x};
  }
  return {name, nameLocalizations: Object.fromEntries(entries.sort(([a], [b]) => (a < b) ? -1 : 1)), value: x};
});


export const USER_SETTINGS_APPLICATION_COMMAND_RESPONSE_TYPES = [
  createChoice('Automatic', UserSettingsApplicationCommandResponseTypes.AUTOMATIC, {isDefault: true, localizationKey: 'choices.settings.app_command_response_type.automatic'}),
  createChoice('Ephemeral', UserSettingsApplicationCommandResponseTypes.EPHEMERAL, {localizationKey: 'choices.settings.app_command_response_type.ephemeral'}),
];


export const USER_SETTINGS_FALLBACKS_MEDIA_IMAGE_TYPES = [
  createChoice('Search Google Images', UserSettingsFallbacksMediaImageTypes.SEARCH_GOOGLE_IMAGES, {localizationKey: 'choices.settings.fallbacks_media_image.search_google_images'}),
  createChoice('Search Duck Duck Go Images', UserSettingsFallbacksMediaImageTypes.SEARCH_DUCK_DUCK_GO_IMAGES, {localizationKey: 'choices.settings.fallbacks_media_image.search_duck_duck_go_images'}),
  createChoice('Generate Image', UserSettingsFallbacksMediaImageTypes.IMAGINE, {localizationKey: 'choices.settings.fallbacks_media_image.imagine'}),
];


export const GUILD_SETTINGS_RESPONSE_DISPLAY = [
  createChoice('Latest', GuildSettingsResponseDisplayTypes.DEFAULT, {isDefault: true, localizationKey: 'choices.settings.response_display.default'}),
  createChoice('No Embeds (Text Only)', GuildSettingsResponseDisplayTypes.NO_EMBED, {localizationKey: 'choices.settings.response_display.no_embed'}),
  createChoice('Legacy (Embeds)', GuildSettingsResponseDisplayTypes.LEGACY, {localizationKey: 'choices.settings.response_display.legacy'}),
];


export const USER_SETTINGS_RESPONSE_DISPLAY = [
  createChoice('Latest', UserSettingsResponseDisplayTypes.DEFAULT, {isDefault: true, localizationKey: 'choices.settings.response_display.default'}),
  createChoice('No Embeds (Text Only)', UserSettingsResponseDisplayTypes.NO_EMBED, {localizationKey: 'choices.settings.response_display.no_embed'}),
  createChoice('Legacy (Embeds)', UserSettingsResponseDisplayTypes.LEGACY, {localizationKey: 'choices.settings.response_display.legacy'}),
];


// brand names, nothing to translate
function createSearchProviderChoices(defaultProvider?: UserSettingsSearchProviders) {
  return [
    createChoice('Bing', UserSettingsSearchProviders.BING, {isDefault: defaultProvider === UserSettingsSearchProviders.BING}),
    createChoice('DuckDuckGo', UserSettingsSearchProviders.DUCK_DUCK_GO, {isDefault: defaultProvider === UserSettingsSearchProviders.DUCK_DUCK_GO}),
    createChoice('Google', UserSettingsSearchProviders.GOOGLE, {isDefault: defaultProvider === UserSettingsSearchProviders.GOOGLE}),
    createChoice('Yandex', UserSettingsSearchProviders.YANDEX, {isDefault: defaultProvider === UserSettingsSearchProviders.YANDEX}),
  ];
}

// users default to the server's setting so there's no "(Default)" on theirs
export const SEARCH_PROVIDERS = createSearchProviderChoices();
export const SEARCH_PROVIDERS_IMAGES = createSearchProviderChoices(SEARCH_PROVIDER_IMAGES_DEFAULT);
export const SEARCH_PROVIDERS_WEB = createSearchProviderChoices(SEARCH_PROVIDER_WEB_DEFAULT);

export const SEARCH_PROVIDERS_CLEAR = [
  createChoice('Web', 'web', {localizationKey: 'choices.settings.search_provider_clear.web'}),
  createChoice('Images', 'images', {localizationKey: 'choices.settings.search_provider_clear.images'}),
  createChoice('Both', 'all', {localizationKey: 'choices.settings.search_provider_clear.all'}),
];


export const USER_SETTINGS_UPLOAD_THRESHOLD_TYPES = [
  createChoice('Exceeds Discord File Size Limits', UserSettingsUploadThresholdTypes.EXCEEDS_DISCORD_LIMIT, {isDefault: true, localizationKey: 'choices.settings.upload_threshold.exceeds_discord_limit'}),
  createChoice('Always', UserSettingsUploadThresholdTypes.ALWAYS, {localizationKey: 'choices.settings.upload_threshold.always'}),
  createChoice('Never', UserSettingsUploadThresholdTypes.NEVER, {localizationKey: 'choices.settings.upload_threshold.never'}),
];


export const USER_SETTINGS_UPLOAD_TYPES = [
  createChoice('Automatic', UserSettingsUploadTypes.AUTOMATIC, {isDefault: true, localizationKey: 'choices.settings.upload_types.automatic'}),
  createChoice('Temporary', UserSettingsUploadTypes.TEMPORARY, {localizationKey: 'choices.settings.upload_types.temporary'}),
];


// alphabetical, except `Other` goes last
export const TAG_DIRECTORY_CATEGORIES = [
  createChoice('AI', TagDirectoryCategories.AI, {localizationKey: 'choices.tag_directory_categories.ai'}),
  createChoice('Clips', TagDirectoryCategories.CLIPS, {localizationKey: 'choices.tag_directory_categories.clips'}),
  createChoice('Filters', TagDirectoryCategories.FILTERS, {localizationKey: 'choices.tag_directory_categories.filters'}),
  createChoice('Games', TagDirectoryCategories.GAMES, {localizationKey: 'choices.tag_directory_categories.games'}),
  createChoice('Logo Editing', TagDirectoryCategories.LOGO_EDITING, {localizationKey: 'choices.tag_directory_categories.logo_editing'}),
  createChoice('Memes', TagDirectoryCategories.MEMES, {localizationKey: 'choices.tag_directory_categories.memes'}),
  createChoice('Utility', TagDirectoryCategories.UTILITY, {localizationKey: 'choices.tag_directory_categories.utility'}),
  createChoice('Other', TagDirectoryCategories.OTHER, {localizationKey: 'choices.tag_directory_categories.other'}),
];


export function safe(value: boolean, context: Interaction.InteractionContext): Boolean {
  // the safe option can't be turned off anymore, ignore whatever the user picked
  return DefaultParameters.safe(context);
}


export function banPayload(
  options: BanPayloadOptions = {},
) {
  return async (value: string, context: Interaction.InteractionContext): Promise<BanPayload> => {
    const membersOrUsers = new Collections.BaseCollection<string, Structures.Member | Structures.User>();
    const notFound: Array<string> = [];
    // ids looked up (found or not), `notFound` also has the words that weren't ids
    let lookups = 0;
    let overLimit = false;

    for (let text of value.split(/\s+/).filter((x) => x)) {
      let searchValue = text;
      {
        const { matches } = discordRegex(DiscordRegexNames.MENTION_USER, searchValue) as {matches: Array<{id: string}>};
        if (matches.length && isSnowflake(matches[0].id)) {
          searchValue = matches[0].id;
        }
      }

      if (!isSnowflake(searchValue)) {
        notFound.push(text);
        continue;
      }
      if (membersOrUsers.has(searchValue)) {
        continue;
      }
      if (options.limit !== undefined && options.limit <= lookups) {
        overLimit = true;
        break;
      }

      lookups++;
      const member = await fetchMemberOrUserById(context, searchValue, options.membersOnly);
      if (member) {
        membersOrUsers.set(member.id, member);
      } else {
        notFound.push(text);
      }
    }

    let membersOrUsersArray = membersOrUsers.toArray();
    if (!options.allowBots && options.allowBots !== undefined) {
      membersOrUsersArray = membersOrUsersArray.filter((memberOrUser) => !memberOrUser.bot);
    }
    return {
      membersOrUsers: membersOrUsersArray,
      notFound,
      overLimit,
      text: '',
    };
  };
}
