import { Collections, Interaction, Structures } from 'detritus-client';
import { DiscordRegexNames } from 'detritus-client/lib/constants';
import { regex as discordRegex } from 'detritus-client/lib/utils';

import {
  GoogleLocales,
  GoogleLocalesText,
  MLDiffusionModels,
  UserSettingsApplicationCommandResponseTypes,
  UserSettingsFallbacksMediaImageTypes,
  GuildSettingsResponseDisplayTypes,
  UserSettingsResponseDisplayTypes,
  UserSettingsUploadThresholdTypes,
  UserSettingsUploadTypes,
} from '../../constants';
import { DefaultParameters, fetchMemberOrUserById, isSnowflake, toTitleCase } from '../../utils';

import type { BanPayload, BanPayloadOptions } from './prefixed';



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


export const USER_SETTINGS_APPLICATION_COMMAND_RESPONSE_TYPES = [
  {name: 'Automatic (Default)', value: UserSettingsApplicationCommandResponseTypes.AUTOMATIC},
  {name: 'Ephemeral', value: UserSettingsApplicationCommandResponseTypes.EPHEMERAL},
];


export const USER_SETTINGS_FALLBACKS_MEDIA_IMAGE_TYPES = [
  {name: 'Search Google Images', value: UserSettingsFallbacksMediaImageTypes.SEARCH_GOOGLE_IMAGES},
  {name: 'Search Duck Duck Go Images', value: UserSettingsFallbacksMediaImageTypes.SEARCH_DUCK_DUCK_GO_IMAGES},
  {name: 'Generate Image', value: UserSettingsFallbacksMediaImageTypes.IMAGINE},
];


export const GUILD_SETTINGS_RESPONSE_DISPLAY = [
  {name: 'Latest (Default)', value: GuildSettingsResponseDisplayTypes.DEFAULT},
  {name: 'No Embeds (Text Only)', value: GuildSettingsResponseDisplayTypes.NO_EMBED},
  {name: 'Legacy (Embeds)', value: GuildSettingsResponseDisplayTypes.LEGACY},
];


export const USER_SETTINGS_RESPONSE_DISPLAY = [
  {name: 'Latest (Default)', value: UserSettingsResponseDisplayTypes.DEFAULT},
  {name: 'No Embeds (Text Only)', value: UserSettingsResponseDisplayTypes.NO_EMBED},
  {name: 'Legacy (Embeds)', value: UserSettingsResponseDisplayTypes.LEGACY},
];


export const USER_SETTINGS_UPLOAD_THRESHOLD_TYPES = [
  {name: 'Exceeds Discord File Size Limits (Default)', value: UserSettingsUploadThresholdTypes.EXCEEDS_DISCORD_LIMIT},
  {name: 'Always', value: UserSettingsUploadThresholdTypes.ALWAYS},
  {name: 'Never', value: UserSettingsUploadThresholdTypes.NEVER},
];


export const USER_SETTINGS_UPLOAD_TYPES = [
  {name: 'Automatic (Default)', value: UserSettingsUploadTypes.AUTOMATIC},
  {name: 'Temporary', value: UserSettingsUploadTypes.TEMPORARY},
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


export function banPayload(
  options: BanPayloadOptions = {},
) {
  return async (value: string, context: Interaction.InteractionContext): Promise<BanPayload> => {
    const membersOrUsers = new Collections.BaseCollection<string, Structures.Member | Structures.User>();
    const notFound: Array<string> = [];

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
      text: '',
    };
  };
}
