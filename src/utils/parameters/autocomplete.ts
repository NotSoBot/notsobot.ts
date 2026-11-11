import { Interaction, Structures } from 'detritus-client';
import { BaseSet } from 'detritus-client/lib/collections';

import MiniSearch from 'minisearch';

import GuildSettingsStore from '../../stores/guildsettings';
import SavedFontsStore from '../../stores/savedfonts';
import TagCustomCommandStore from '../../stores/tagcustomcommands';
import UserStore from '../../stores/users';
import UserSettingsStore from '../../stores/usersettings';

import {
  fetchTagId,
  fetchReminders,
  fetchTagsServer,
  fetchUserReminders,
  fetchServerVoices,
  fetchUserVoices,
  mediaIVManipulationXytTemplates,
  utilitiesLocations,
} from '../../api';
import { RestResponsesRaw } from '../../api/types';
import {
  CommandCategories,
  CommandCategoryNames,
  DateMomentLogFormat,
  GoogleLocales,
  GoogleLocalesText,
  GuildFeatures,
  MediaMemeFonts,
  MediaMemeFontsToText,
  Mimetypes,
  MimetypesToExtension,
  MLDiffusionModels,
  MLDiffusionModelsToText,
  TagGenerationModels,
  TagGenerationModelsToText,
  TagGenerationModelsToTextWithTier,
  TagSearchSortByFilters,
  Timezones,
  TimezonesToText,
  TTSVoices,
  TTSVoicesToText,
  UserFlags,
} from '../../constants';
import {
  createTimestampMomentFromContext,
  findCachedTagDirectoryIds,
  getReminderMessage,
  isSnowflake,
  parseTagDirectoryUrl,
  searchTimezones,
  toTitleCase,
} from '../tools';
import { GUILD_RULE_CATEGORIES } from '../guildrules';
import { Languages, getTranslatorForLanguage, languageFromLocale } from '../i18n';

import { normalizeSavedFontName } from './fonts';



const downloadMediaFormatsSearch = new MiniSearch({
  fields: ['id', 'name'],
  storeFields: ['id', 'name'],
  searchOptions: {
    boost: {id: 2},
    fuzzy: true,
    prefix: true,
  },
});
downloadMediaFormatsSearch.addAll(Object.values(Mimetypes).map((value) => {
  return {id: value, name: `.${MimetypesToExtension[value]} (${value})`};
}));

export async function downloadMediaFormats(context: Interaction.InteractionAutoCompleteContext) {
  let choices: Array<{name: string, value: string}>;
  if (context.value) {
    choices = downloadMediaFormatsSearch.search(context.value).slice(0, 25).map((result) => {
      return {name: result.name, value: result.id};
    });
  } else {
    choices = Object.values(Mimetypes).map((value) => {
      return {name: `.${MimetypesToExtension[value]} (${value})`, value};
    }).slice(0, 25);
  }
  return context.respond({choices});
}


const mlDiffusionModelSearch = new MiniSearch({
  fields: ['id', 'name'],
  storeFields: ['id', 'name'],
  searchOptions: {
    boost: {id: 2},
    fuzzy: true,
    prefix: true,
  },
});
mlDiffusionModelSearch.addAll(Object.values(MLDiffusionModels).map((value) => {
  return {id: value, name: MLDiffusionModelsToText[value] || value};
}));

const mediaMemeFontSearch = new MiniSearch({
  fields: ['id', 'name'],
  storeFields: ['id', 'name'],
  searchOptions: {
    boost: {name: 2},
    fuzzy: true,
    prefix: true,
  },
});
mediaMemeFontSearch.addAll(Object.values(MediaMemeFonts).map((value) => {
  return {id: value, name: MediaMemeFontsToText[value] || value};
}));

// the bundled fonts and the caller's saved ones (theirs first, then the server's, `scope` only lists one of them) for
// caption, meme, recaption and the Default Font settings (fixed choices would count towards the command's size). saved
// fonts go by their name, which can't be a bundled font's
function mediaFontChoices(scope?: 'guild' | 'user') {
  return async (context: Interaction.InteractionAutoCompleteContext) => {
    const { translate } = getTranslatorForLanguage(languageFromLocale(context.locale) || Languages.ENGLISH);
    const fonts = await SavedFontsStore.getOrFetch(context);

    let saved: Array<{name: string, value: string}> = [];
    for (let key of (scope) ? [scope] : ['user', 'guild'] as const) {
      // ones without premium can't be used, so they aren't offered
      const scoped = fonts[key];
      if (!scoped || !scoped.premium) {
        continue;
      }
      const label = (key === 'guild') ? 'fonts.autocomplete_server' : 'fonts.autocomplete_user';
      for (let font of scoped.items) {
        if (!saved.some((choice) => choice.value === font.name)) {
          saved.push({name: translate(label, {name: font.name}).slice(0, 100), value: font.name});
        }
      }
    }

    let bundled: Array<{name: string, value: string}>;
    if (context.value) {
      const value = normalizeSavedFontName(context.value);
      saved = saved.filter((choice) => choice.value.includes(value));
      bundled = mediaMemeFontSearch.search(context.value).map((result) => {
        return {name: result.name, value: result.id};
      });
    } else {
      bundled = Object.values(MediaMemeFonts).map((value) => {
        return {name: MediaMemeFontsToText[value] || value, value};
      });
    }
    return context.respond({choices: [...saved, ...bundled].slice(0, 25)});
  };
}

export const mediaFont = mediaFontChoices();
export const mediaFontServer = mediaFontChoices('guild');
export const mediaFontUser = mediaFontChoices('user');


// one of the saved fonts to rename or remove, the caller's own (`fonts`) or the server's (`server fonts`)
function savedFontChoices(scope: 'guild' | 'user') {
  return async (context: Interaction.InteractionAutoCompleteContext) => {
    const fonts = await SavedFontsStore.getOrFetch(context);
    const scoped = fonts[scope];
    let names = (scoped) ? scoped.items.map((font) => font.name) : [];
    if (context.value) {
      const value = normalizeSavedFontName(context.value);
      names = names.filter((name) => name.includes(value));
    }
    return context.respond({choices: names.slice(0, 25).map((name) => ({name, value: name}))});
  };
}

export const savedFontServer = savedFontChoices('guild');
export const savedFontUser = savedFontChoices('user');

export async function mlDiffusionModel(context: Interaction.InteractionAutoCompleteContext) {
  let choices: Array<{name: string, value: string}>;
  if (context.value) {
    choices = mlDiffusionModelSearch.search(context.value).slice(0, 25).map((result) => {
      return {name: result.name, value: result.id};
    });
  } else {
    choices = Object.values(MLDiffusionModels).map((value) => {
      return {name: MLDiffusionModelsToText[value] || value, value};
    });

    let hasDefault = false;

    const userSettings = await UserSettingsStore.getOrFetch(context, context.userId);
    if (userSettings && userSettings.ml_diffusion_model) {
      for (let choice of choices) {
        if (choice.value === userSettings.ml_diffusion_model) {
          hasDefault = true;
          choice.name = `${choice.name} (Default for You)`;
          break;
        }
      }
    } else if (context.guildId) {
      const guildSettings = await GuildSettingsStore.getOrFetch(context, context.guildId);
      if (guildSettings && guildSettings.settings.mlDiffusionModel) {
        for (let choice of choices) {
          if (choice.value === guildSettings.settings.mlDiffusionModel) {
            hasDefault = true;
            choice.name = `${choice.name} (Default for this Server)`;
            break;
          }
        }
      }
    }

    if (!hasDefault) {
      for (let choice of choices) {
        if (choice.value === MLDiffusionModels.FLUX_KLEIN) {
          choice.name = `${choice.name} (Default)`;
          break;
        }
      }
    }
  }
  return context.respond({choices});
}


const mlLLMModelSearch = new MiniSearch({
  fields: ['id', 'name'],
  storeFields: ['id', 'label'],
  searchOptions: {
    boost: {id: 2},
    fuzzy: true,
    prefix: true,
  },
});
// search the plain name so the tier text doesn't match everything
mlLLMModelSearch.addAll(Object.values(TagGenerationModels).map((value) => {
  return {id: value, name: TagGenerationModelsToText[value] || value, label: TagGenerationModelsToTextWithTier[value]};
}));

export async function mlLLMModel(context: Interaction.InteractionAutoCompleteContext) {
  let choices: Array<{name: string, value: string}>;
  if (context.value) {
    choices = mlLLMModelSearch.search(context.value).slice(0, 25).map((result) => {
      return {name: result.label, value: result.id};
    });
  } else {
    choices = Object.values(TagGenerationModels).map((value) => {
      return {name: TagGenerationModelsToTextWithTier[value], value};
    });

    let hasDefault = false;

    const userSettings = await UserSettingsStore.getOrFetch(context, context.userId);
    if (userSettings && userSettings.ml_llm_model) {
      for (let choice of choices) {
        if (choice.value === userSettings.ml_llm_model) {
          hasDefault = true;
          choice.name = `${choice.name} (Default for You)`;
          break;
        }
      }
    }

    /*
    // change this so itll see what their default will be here in this servee
    if (!hasDefault) {
      for (let choice of choices) {
        if (choice.value === TagGenerationModels.OPENAI_CHATGPT_4O) {
          choice.name = `${choice.name} (Default)`;
          break;
        }
      }
    }
    */
  }
  return context.respond({choices});
}


export function googleLocales(context: Interaction.InteractionAutoCompleteContext) {
  let choices: Array<{name: string, value: string}>;
  if (context.value) {
    const values = new BaseSet<GoogleLocales>();

    const value = context.value.toLowerCase().replace(/_/g, ' ');
    for (let key in GoogleLocalesText) {
      const locale = key as GoogleLocales;
      const text = GoogleLocalesText[locale].toLowerCase();
      if (locale === value || text.includes(value)) {
        values.add(locale);
      }
    }

    choices = values.toArray().slice(0, 25).map((locale) => {
      return {name: GoogleLocalesText[locale], value: locale};
    });
  } else {
    choices = [
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
  }
  return context.respond({choices});
}



export async function locations(context: Interaction.InteractionAutoCompleteContext) {
  let choices: Array<{name: string, value: string}>;
  if (context.value) {
    const { count, results } = await utilitiesLocations(context, {query: context.value, limit: 25});
    choices = results.map((location) => {
      let name = location.name;
      if (location.name_official && location.name_official !== location.name && !location.name_official.toLowerCase().includes(location.name.toLowerCase())) {
        name = `${location.name_official} (${location.name})`;
      }
      return {name: name.slice(0, 100), value: location.address.full.slice(0, 100)};
    });
  } else {
    choices = [
      'North America',
      'South America',
      'Europe',
      'Africa',
      'Antarctica',
      'Asia',
      'Australia',
      'Iceland',
      'Hawaii',
      'North Korea',
    ].map((name) => {
      return {name, value: name};
    });
  }
  return context.respond({choices});
}



export async function prefix(context: Interaction.InteractionAutoCompleteContext) {
  if (!context.inDm) {
    const guildId = context.guildId!;
    const settings = await GuildSettingsStore.getOrFetch(context, guildId);
    if (settings) {
      let prefixes = settings.prefixes.map(({prefix}) => prefix);
      if (context.value) {
        const value = context.value.toLowerCase();
        prefixes = prefixes.filter((prefix) => prefix.toLowerCase().startsWith(value));
      }
      const choices = prefixes.slice(0, 25).map((prefix) => ({name: prefix, value: prefix}));
      return context.respond({choices});
    }
  }
  return context.respond({choices: []});
}



// what a server rule covers: everything, a category or a command, values are what `parseGuildRuleCoverage` reads
export async function guildRuleCoverage(context: Interaction.InteractionAutoCompleteContext) {
  const { translate } = getTranslatorForLanguage(languageFromLocale(context.locale) || Languages.ENGLISH);
  const value = (context.value || '').trim().toLowerCase();
  const choices: Array<{name: string, value: string}> = [];

  const everything = translate('rules.covers.everything_choice');
  if (!value || everything.toLowerCase().includes(value) || 'everything'.startsWith(value)) {
    choices.push({name: everything, value: 'everything'});
  }
  for (let category of GUILD_RULE_CATEGORIES) {
    const name = CommandCategoryNames[category];
    if (!value || name.toLowerCase().includes(value) || category.toLowerCase().startsWith(value)) {
      choices.push({name: translate('rules.covers.category_choice', {category: name}), value: `category:${category}`});
    }
  }
  if (context.commandClient) {
    const seen = new BaseSet<string>();
    for (let command of context.commandClient.commands) {
      const metadata = command.metadata;
      if (!metadata || !metadata.id || metadata.category === CommandCategories.OWNER || seen.has(metadata.id)) {
        continue;
      }
      if (value && !command.names.some((name) => name.toLowerCase().startsWith(value)) && !metadata.id.startsWith(value)) {
        continue;
      }
      seen.add(metadata.id);
      choices.push({name: translate('rules.covers.command_choice', {command: command.name}).slice(0, 100), value: `command:${metadata.id}`});
      if (25 <= choices.length) {
        break;
      }
    }
  }
  return context.respond({choices: choices.slice(0, 25)});
}



// the server's discord AutoMod rules by name, the value is the rule's id (needs manage server, nothing without it)
export async function guildAutomodRules(context: Interaction.InteractionAutoCompleteContext) {
  const value = (context.value || '').trim().toLowerCase();
  const choices: Array<{name: string, value: string}> = [];
  if (context.guildId) {
    try {
      const rules = await context.rest.fetchGuildAutoModerationRules(context.guildId);
      for (let [ruleId, rule] of rules) {
        if (!value || rule.name.toLowerCase().includes(value) || ruleId.startsWith(value)) {
          choices.push({name: rule.name.slice(0, 100), value: ruleId});
        }
      }
    } catch(error) {
      // no manage server
    }
  }
  return context.respond({choices: choices.slice(0, 25)});
}

interface StoredReminder {
  content?: string,
  guild_id: null | string,
  id: string,
  location?: string,
  position: number,
  timestamp_start: string,
}

const REMINDER_TIMESTAMP_FORMAT = 'MM/DD/YYYY, h:mm:ss a z';
const REMINDER_TIMESTAMP_FILTER_FORMAT = 'dddd, MMMM Do YYYY, MM/DD/YY, h:mm:ss a z';

export async function reminder(context: Interaction.InteractionAutoCompleteContext) {
  const response = await fetchUserReminders(context, context.userId);
  return respondWithReminders(context, response.reminders.reverse());
}


// the value of another option filled out alongside the focused one (looks inside subcommands too)
function getSiblingOptionValue(context: Interaction.InteractionAutoCompleteContext, name: string): string | null {
  const search = (options: Iterable<[string, Structures.InteractionDataApplicationCommandOption]> | null | undefined): string | null => {
    if (options) {
      for (let [ optionName, option ] of options) {
        if (option.options) {
          const found = search(option.options);
          if (found !== null) {
            return found;
          }
        } else if (optionName === name && !option.focused && option.value !== undefined) {
          return String(option.value);
        }
      }
    }
    return null;
  };
  return search(context.options);
}


// a user's reminders in this server, for `reminder delete server`
export async function reminderServer(context: Interaction.InteractionAutoCompleteContext) {
  const userId = getSiblingOptionValue(context, 'user');
  if (!userId) {
    return context.respond({choices: []});
  }
  const serverId = context.guildId || null;
  if (!serverId && userId !== context.userId) {
    return context.respond({choices: []});
  }
  const response = await fetchReminders(context, {guildId: serverId || 0, userId});
  return respondWithReminders(context, response.reminders.reverse());
}


async function respondWithReminders(context: Interaction.InteractionAutoCompleteContext, reminders: Array<RestResponsesRaw.Reminder>) {
  const value = (context.value || '').toLowerCase();
  const serverId = context.guildId || null;

  let filtered: Array<StoredReminder>;
  if (value) {
    const search = new MiniSearch({
      extractField: (document, field) => {
        switch (field) {
          case 'content': {
            if (!document.content) {
              return getReminderMessage(document.id);
            }
          }; break;
          case 'location': {
            let location: string;
            if (document.guild_id === serverId) {
              location = 'in here';
            } else if (!document.guild_id) {
              location = 'in DMs';
            } else {
              location = 'in another server';
            }
            return location;
          }; break;
          case 'timestamp': {
            const date = new Date(document.timestamp_start);
            const timestamp = createTimestampMomentFromContext(document.timestamp_start, context);
            return `${timestamp.fromNow()} ${timestamp.format(REMINDER_TIMESTAMP_FILTER_FORMAT)}`;
          }; break;
        }
        return document[field];
      },
      fields: ['content', 'location', 'position', 'timestamp'],
      storeFields: ['content', 'guild_id', 'id', 'location', 'position', 'timestamp_start'],
      searchOptions: {
        boost: {position: 2},
        combineWith: 'AND',
        fuzzy: (term) => (Number.isNaN(parseInt(term)) ? 0.2 : false),
        prefix: true,
        weights: {fuzzy: 0.2, prefix: 1},
      },
    });
    search.addAll(reminders);

    filtered = search.search(value).slice(0, 25) as unknown as Array<StoredReminder>;
  } else {
    filtered = reminders.slice(0, 25);
  }

  const choices = filtered.map((reminder) => {
    const date = new Date(reminder.timestamp_start);
    const timestamp = createTimestampMomentFromContext(reminder.timestamp_start, context);
    const timestampText = `${timestamp.fromNow()} at ${timestamp.format(REMINDER_TIMESTAMP_FORMAT)}`;

    let content = `${reminder.position}. ${timestampText}`;
    if (reminder.location) {
      content = `${content} ${reminder.location}`;
    } else {
      if (reminder.guild_id === serverId) {
        content = `${content} in here`;
      } else if (!reminder.guild_id) {
        content = `${content} in DMs`;
      } else {
        content = `${content} in another server`;
      }
    }

    if (!reminder.content) {
      content = `${content} (${getReminderMessage(reminder.id)})`;
    } else if (100 < content.length + 3 + reminder.content.length) {
      const sliceAmount = 100 - content.length - 6;
      content = `${content} (${reminder.content.slice(0, sliceAmount)})`;
    } else {
      content = `${content} (${reminder.content})`;
    }

    return {name: content, value: String(reminder.position)};
  });
  return context.respond({choices});
}



export async function tags(context: Interaction.InteractionAutoCompleteContext) {
  let choices: Array<{name: string, value: string}> = [];
  if (context.value) {
    const maybeTagId = parseTagDirectoryUrl(context.value) || context.value;
    if (isSnowflake(maybeTagId)) {
      try {
        const tag = await fetchTagId(context, maybeTagId);
        if (tag.is_on_directory) {
          choices.push({name: tag.name, value: tag.id});
        }
      } catch(error) {
        
      }
    }
  }

  if (!choices.length) {
    try {
      const serverId = context.guildId || context.channelId!;
      const { tags } = await fetchTagsServer(context, serverId, {
        name: context.value,
        limit: 25,
        sortBy: TagSearchSortByFilters.LAST_USED,
      });
      choices = tags.map((tag) => ({name: tag.name, value: tag.name}));
    } catch(error) {
      choices = [];
    }
  }
  return context.respond({choices});
}


export async function tagsCustomCommands(context: Interaction.InteractionAutoCompleteContext) {
  const sortBy = TagSearchSortByFilters.LAST_USED;

  let choices: Array<{name: string, value: string}> = [];
  if (context.value) {
    let search = new MiniSearch({
      fields: ['id', 'name'],
      storeFields: ['id', 'name', 'last_used'],
      searchOptions: {
        boost: {id: 2},
        fuzzy: true,
        prefix: true,
      },
    });
    if (context.guildId) {
      const tags = await TagCustomCommandStore.maybeGetOrFetchGuildCommands(context, context.guildId);
      if (tags) {
        search.addAll(tags.map((tag) => {
          return {id: tag.id, last_used: tag.last_used, name: tag.name};
        }));
      }
    }
    {
      const tags = await TagCustomCommandStore.maybeGetOrFetchUserCommands(context, context.userId);
      if (tags) {
        search.addAll(tags.map((tag) => {
          return {id: tag.id, last_used: tag.last_used, name: tag.name};
        }));
      }
    }
    choices = search.search(context.value).sort((x, y) => {
      switch (sortBy) {
        case TagSearchSortByFilters.LAST_USED: {
          const lastUsedX = (x.last_used) ? (new Date(x.last_used)).getTime() : 0;
          const lastUsedY = (y.last_used) ? (new Date(y.last_used)).getTime() : 0;
          return lastUsedY - lastUsedX;
        }; break;
      }
    }).slice(0, 25).map((result) => {
      return {name: result.name.slice(0, 100), value: result.id};
    });
  } else {
    // search user custom commands first, then server
    let allTags: Array<RestResponsesRaw.Tag> | undefined;
    {
      const tags = await TagCustomCommandStore.maybeGetOrFetchUserCommands(context, context.userId);
      if (tags) {
        allTags = (allTags) ? allTags.concat(tags.toArray()) : tags.toArray();
      }
    }
    if (context.guildId) {
      const tags = await TagCustomCommandStore.maybeGetOrFetchGuildCommands(context, context.guildId);
      if (tags) {
        allTags = (allTags) ? allTags.concat(tags.toArray()) : tags.toArray();
      }
    }
    if (allTags) {
      allTags = allTags.sort((x, y) => {
        switch (sortBy) {
          case TagSearchSortByFilters.LAST_USED: {
            const lastUsedX = (x.last_used) ? (new Date(x.last_used)).getTime() : 0;
            const lastUsedY = (y.last_used) ? (new Date(y.last_used)).getTime() : 0;
            return lastUsedY - lastUsedX;
          }; break;
        }
      }).slice(0, 25);
      for (let tag of allTags) {
        choices.push({name: tag.name.slice(0, 100), value: tag.id});
      }
    }
  }
  return context.respond({choices});
}


// how many tag directory links from the channel to suggest, each one is a tag fetch
const TAGS_TO_GET_LINKED_MAX = 3;

// the tag directory tags linked in the channel's cached messages, newest first
async function linkedTagDirectoryChoices(
  context: Interaction.InteractionAutoCompleteContext,
): Promise<Array<{name: string, value: string}>> {
  const tags = await Promise.all(findCachedTagDirectoryIds(context, TAGS_TO_GET_LINKED_MAX).map((tagId) => {
    return fetchTagId(context, tagId).catch(() => null);
  }));
  const choices: Array<{name: string, value: string}> = [];
  for (const tag of tags) {
    if (tag && tag.is_on_directory) {
      choices.push({name: `${tag.name.slice(0, 80)} (linked in chat)`, value: tag.id});
    }
  }
  return choices;
}


// for `tag show`: with nothing typed yet, the tag directory links posted in the channel come before the server's tags
export async function tagsToShow(context: Interaction.InteractionAutoCompleteContext) {
  if (context.value) {
    return tags(context);
  }

  const choices = await linkedTagDirectoryChoices(context);
  try {
    const serverId = context.guildId || context.channelId!;
    const { tags } = await fetchTagsServer(context, serverId, {
      name: context.value,
      limit: 25,
      sortBy: TagSearchSortByFilters.LAST_USED,
    });
    for (const tag of tags) {
      choices.push({name: tag.name, value: tag.name});
    }
  } catch(error) {
    // keep the linked tags
  }
  return context.respond({choices: choices.slice(0, 25)});
}

export async function tagsToGet(context: Interaction.InteractionAutoCompleteContext) {
  let choices: Array<{name: string, value: string}> = [];
  if (context.value) {
    const maybeTagId = parseTagDirectoryUrl(context.value) || context.value;
    if (isSnowflake(maybeTagId)) {
      try {
        const tag = await fetchTagId(context, maybeTagId);
        if (tag.is_on_directory) {
          choices.push({name: tag.name, value: tag.id});
        }
      } catch(error) {
        
      }
    }
  } else {
    // nothing typed yet: tag directory links posted in the channel first (newest first), like the "Add to Server"
    // embed on notsobot.com/tags/directory/<id> links
    choices = await linkedTagDirectoryChoices(context);
  }

  if (!choices.length || !context.value) {
    if (context.inDm && context.isBotPresent) {
      // we are in our one-on-one dms, we cannot add our own tags into here, only support tag directory
    } else {
      try {
        const user = await UserStore.getOrFetch(context, context.userId);
        if (user && user.channelId) {
          const serverId = user.channelId;
          // add filter to not allow aliases
          const { tags } = await fetchTagsServer(context, serverId, {
            name: context.value,
            limit: 25,
            sortBy: TagSearchSortByFilters.LAST_USED,
          });
          // after the linked tags, if there are any
          for (const tag of tags) {
            if (!tag.reference_tag && !choices.some((choice) => choice.value === tag.id)) {
              choices.push({name: tag.name, value: tag.id});
            }
          }
        }
      } catch(error) {
        // keep the linked tags
      }
    }
  }
  return context.respond({choices: choices.slice(0, 25)});
}



// your own tags from your dms with the bot that aren't on the tag directory yet, for `tag directory add`
export async function tagsToAddToDirectory(context: Interaction.InteractionAutoCompleteContext) {
  let choices: Array<{name: string, value: string}> = [];
  try {
    let dmChannelId: string | null = null;
    if (context.inDm && context.isBotPresent) {
      // we are in our one-on-one dms with the bot
      dmChannelId = context.channelId!;
    } else {
      const user = await UserStore.getOrFetch(context, context.userId);
      dmChannelId = (user && user.channelId) || null;
    }

    if (dmChannelId) {
      if (context.value && isSnowflake(context.value)) {
        try {
          const tag = await fetchTagId(context, context.value);
          if (tag.user.id === context.userId && tag.server_id === dmChannelId && !tag.is_on_directory && !tag.reference_tag) {
            choices.push({name: tag.name, value: tag.id});
          }
        } catch(error) {

        }
      }

      if (!choices.length) {
        const { tags } = await fetchTagsServer(context, dmChannelId, {
          name: context.value,
          limit: 25,
          sortBy: TagSearchSortByFilters.LAST_USED,
          userId: context.userId,
        });
        choices = tags.filter((tag) => !tag.reference_tag && !tag.is_on_directory).map((tag) => {
          return {name: tag.name, value: tag.id};
        });
      }
    }
  } catch(error) {
    choices = [];
  }
  return context.respond({choices});
}


// your own tags that are on the tag directory, for `tag directory edit`
export async function tagsOnDirectoryToEdit(context: Interaction.InteractionAutoCompleteContext) {
  let choices: Array<{name: string, value: string}> = [];
  if (context.value) {
    const maybeTagId = parseTagDirectoryUrl(context.value) || context.value;
    if (isSnowflake(maybeTagId)) {
      try {
        const tag = await fetchTagId(context, maybeTagId);
        if (tag.is_on_directory && tag.user.id === context.userId) {
          choices.push({name: tag.name, value: tag.id});
        }
      } catch(error) {
        
      }
    }
  }

  if (!choices.length) {
    try {
      // directory tags are added from the user's dms with the bot
      const user = await UserStore.getOrFetch(context, context.userId);
      if (user && user.channelId) {
        const { tags } = await fetchTagsServer(context, user.channelId, {
          name: context.value,
          limit: 25,
          sortBy: TagSearchSortByFilters.LAST_USED,
          userId: context.userId,
        });
        choices = tags.filter((tag) => tag.is_on_directory).map((tag) => {
          return {name: tag.name, value: tag.id};
        });
      }
    } catch(error) {
      choices = [];
    }
  }
  return context.respond({choices});
}


// shown before anything is typed, one well known zone per hour so the whole -11 to +13 range is visible
// (discord only shows 25 choices, with the user's/server's current timezone pinned above these)
const timezonesDefaultChoices: Array<string> = [
  Timezones.PACIFIC_MIDWAY,
  Timezones.PACIFIC_HONOLULU,
  Timezones.AMERICA_ANCHORAGE,
  Timezones.AMERICA_LOS_ANGELES,
  Timezones.AMERICA_DENVER,
  Timezones.AMERICA_CHICAGO,
  Timezones.AMERICA_NEW_YORK,
  Timezones.AMERICA_HALIFAX,
  Timezones.AMERICA_SAO_PAULO,
  Timezones.ATLANTIC_AZORES,
  Timezones.EUROPE_LONDON,
  Timezones.EUROPE_PARIS,
  Timezones.EUROPE_ATHENS,
  Timezones.EUROPE_MOSCOW,
  Timezones.ASIA_DUBAI,
  Timezones.ASIA_KARACHI,
  Timezones.ASIA_KOLKATA,
  Timezones.ASIA_DHAKA,
  Timezones.ASIA_BANGKOK,
  Timezones.ASIA_SHANGHAI,
  Timezones.ASIA_TOKYO,
  Timezones.AUSTRALIA_SYDNEY,
  Timezones.PACIFIC_AUCKLAND,
  Timezones.PACIFIC_TONGATAPU,
];

export async function timezone(context: Interaction.InteractionAutoCompleteContext) {
  let choices: Array<{name: string, value: string}>;
  if (context.value) {
    choices = searchTimezones(context.value).slice(0, 25);
  } else {
    const pinned: Array<string> = [];
    const userSettings = UserSettingsStore.get(context.userId);
    if (userSettings && userSettings.timezone) {
      pinned.push(userSettings.timezone);
    }
    if (context.guildId) {
      const guildSettings = GuildSettingsStore.get(context.guildId);
      if (guildSettings && guildSettings.timezone) {
        pinned.push(guildSettings.timezone);
      }
    }

    const timezones = new Set<string>([...pinned, ...timezonesDefaultChoices]);
    choices = Array.from(timezones).filter((timezone) => timezone in TimezonesToText).slice(0, 25).map((timezone) => {
      return {name: (TimezonesToText as any)[timezone], value: timezone};
    });
  }
  return context.respond({choices});
}



const ttsVoiceSearch = new MiniSearch({
  fields: ['id', 'name'],
  storeFields: ['id', 'name'],
  searchOptions: {
    boost: {id: 2},
    fuzzy: true,
    prefix: true,
  },
});
ttsVoiceSearch.addAll(Object.entries(TTSVoicesToText).filter((x) => {
  return x[0] !== TTSVoices.CLONED;
}).map(([key, name]) => {
  return {id: key, name};
}));


// the user's own cloned voices and the server's (marked as the server's), the server's are left out in dms
async function fetchUsableVoices(context: Interaction.InteractionAutoCompleteContext): Promise<Array<{id: string, name: string}>> {
  const voices: Array<{id: string, name: string}> = [];
  try {
    const response = await fetchUserVoices(context, context.userId);
    voices.push(...response.voices);
  } catch(error) {

  }
  if (context.guildId || (context.channel && context.channel.ownerId)) {
    try {
      const response = await fetchServerVoices(context);
      const { translate } = getTranslatorForLanguage(languageFromLocale(context.locale) || Languages.ENGLISH);
      voices.push(...response.voices.map((voice) => ({id: voice.id, name: translate('voice_server.label', {name: voice.name})})));
    } catch(error) {

    }
  }
  return voices;
}


export async function ttsVoices(context: Interaction.InteractionAutoCompleteContext) {
  const voices = await fetchUsableVoices(context);

  let choices: Array<{name: string, value: string}>;
  if (context.value) {
    let search = ttsVoiceSearch;

    if (voices.length) {
      // clone search and add this
      search = new MiniSearch({
        fields: ['id', 'name'],
        storeFields: ['id', 'name'],
        searchOptions: {
          boost: {id: 2},
          fuzzy: true,
          prefix: true,
        },
      });
      search.addAll(voices.map((voice) => {
        return {id: `${TTSVoices.CLONED}.${voice.id}`, name: voice.name};
      }));
      search.addAll(Object.entries(TTSVoicesToText).filter((x) => {
        return x[0] !== TTSVoices.CLONED;
      }).map(([key, name]) => {
        return {id: key, name};
      }));
    }
    choices = search.search(context.value).slice(0, 25).map((result) => {
      return {name: result.name.slice(0, 100), value: result.id};
    });
  } else {
    choices = [
      TTSVoices.TIKTOK_BR_MALE_01,
      TTSVoices.TIKTOK_DE_FEMALE_01,
      TTSVoices.TIKTOK_DE_MALE_01,
      TTSVoices.TIKTOK_EN_AU_FEMALE,
      TTSVoices.TIKTOK_EN_AU_MALE,
      TTSVoices.TIKTOK_EN_MALE_FUNNY,
      TTSVoices.TIKTOK_EN_MALE_NARRATION,
      TTSVoices.TIKTOK_EN_SING_MALE_SUNSHINE_SOON,
      TTSVoices.TIKTOK_EN_SING_MALE_TENOR,
      TTSVoices.TIKTOK_EN_UK_MALE_01,
      TTSVoices.TIKTOK_EN_US_DISNEY_C3PO,
      TTSVoices.TIKTOK_EN_US_DISNEY_CHEWBACCA,
      TTSVoices.TIKTOK_EN_US_DISNEY_GHOSTFACE,
      TTSVoices.TIKTOK_EN_US_DISNEY_ROCKET,
      TTSVoices.TIKTOK_EN_US_DISNEY_STITCH,
      TTSVoices.TIKTOK_EN_US_DISNEY_STORMTROOPER,
      TTSVoices.TIKTOK_EN_US_FEMALE_01,
      TTSVoices.TIKTOK_EN_US_MALE_01,
      TTSVoices.TIKTOK_ES_MALE_01,
      TTSVoices.TIKTOK_FR_MALE_01,
      TTSVoices.TIKTOK_ID_FEMALE_01,
      TTSVoices.TIKTOK_JP_FEMALE_01,
      TTSVoices.TIKTOK_JP_MALE_01,
      TTSVoices.TIKTOK_KR_FEMALE_01,
      TTSVoices.TIKTOK_KR_MALE_01,
    ].map((x) => ({name: TTSVoicesToText[x], value: x}));
    if (voices.length) {
      choices = [
        ...voices.map((x) => ({name: x.name.slice(0, 100), value: `${TTSVoices.CLONED}.${x.id}`})),
        ...choices,
      ].slice(0, 25);
    }
  }
  return context.respond({choices});
}


// only the user's cloned voices, the value is the voice id (`findVoice` takes names or ids)
export async function clonedVoices(context: Interaction.InteractionAutoCompleteContext) {
  let voices: Array<{id: string, name: string}> = [];
  try {
    const response = await fetchUserVoices(context, context.userId);
    voices = response.voices;
  } catch(error) {

  }

  if (context.value && voices.length) {
    const search = new MiniSearch({
      fields: ['name'],
      storeFields: ['id', 'name'],
      searchOptions: {fuzzy: true, prefix: true},
    });
    search.addAll(voices);
    voices = search.search(context.value) as any;
  }
  const choices = voices.slice(0, 25).map((voice) => ({name: voice.name.slice(0, 100), value: voice.id}));
  return context.respond({choices});
}


// only the server's cloned voices (`/tts voice-server`), the value is the voice id
export async function serverVoices(context: Interaction.InteractionAutoCompleteContext) {
  let voices: Array<{id: string, name: string}> = [];
  try {
    const response = await fetchServerVoices(context);
    voices = response.voices;
  } catch(error) {

  }

  if (context.value && voices.length) {
    const search = new MiniSearch({
      fields: ['name'],
      storeFields: ['id', 'name'],
      searchOptions: {fuzzy: true, prefix: true},
    });
    search.addAll(voices);
    voices = search.search(context.value) as any;
  }
  const choices = voices.slice(0, 25).map((voice) => ({name: voice.name.slice(0, 100), value: voice.id}));
  return context.respond({choices});
}


// the api's template library only changes when it's deployed, so its names are kept for a bit
const XYT_TEMPLATES_EXPIRE = 10 * 60 * 1000;
// when the api couldn't be asked, before it's asked again
const XYT_TEMPLATES_RETRY = 60 * 1000;
const XYT_TEMPLATE_KINDS: Record<string, string> = {effect: 'Effect', filter: 'Filter', overlay: 'Overlay'};

interface XytTemplateChoices {
  // every template by title, the ones VivaVideo never named (their id is their title) last
  choices: Array<{name: string, value: string}>,
  expires: number,
  search: MiniSearch,
}

let xytTemplateChoices: null | XytTemplateChoices = null;
let xytTemplateChoicesPromise: null | Promise<null | XytTemplateChoices> = null;

async function fetchXytTemplateChoices(context: Interaction.InteractionAutoCompleteContext): Promise<null | XytTemplateChoices> {
  if (xytTemplateChoices && Date.now() < xytTemplateChoices.expires) {
    return xytTemplateChoices;
  }
  if (!xytTemplateChoicesPromise) {
    xytTemplateChoicesPromise = (async () => {
      try {
        const { templates } = await mediaIVManipulationXytTemplates(context);

        const titleCounts = new Map<string, number>();
        for (let template of templates) {
          const key = template.title.toLowerCase();
          titleCounts.set(key, (titleCounts.get(key) || 0) + 1);
        }

        const documents = templates.map((template) => {
          const details = [template.title, XYT_TEMPLATE_KINDS[template.kind] || toTitleCase(template.kind)];
          if (template.music) {
            details.push('Music');
          }
          // a name only finds the first of the templates sharing it, the id tells them apart
          if (1 < (titleCounts.get(template.title.toLowerCase()) || 0)) {
            details.push(template.id);
          }
          return {
            id: template.id,
            name: details.filter(Boolean).join(' • ').slice(0, 100),
            named: template.title.toLowerCase() !== template.id.toLowerCase(),
            title: template.title,
            titles: template.titles.join(' '),
          };
        });

        const search = new MiniSearch({
          fields: ['id', 'title', 'titles'],
          storeFields: ['id', 'name'],
          searchOptions: {
            boost: {title: 2},
            fuzzy: true,
            prefix: true,
          },
        });
        search.addAll(documents);

        const choices = documents.sort((x, y) => {
          if (x.named !== y.named) {
            return (x.named) ? -1 : 1;
          }
          return x.title.localeCompare(y.title) || x.id.localeCompare(y.id);
        }).map((document) => ({name: document.name, value: document.id}));

        xytTemplateChoices = {choices, expires: Date.now() + XYT_TEMPLATES_EXPIRE, search};
      } catch(error) {
        // the names it had are still real templates, and without any an id or a name can still be typed
        if (xytTemplateChoices) {
          xytTemplateChoices.expires = Date.now() + XYT_TEMPLATES_RETRY;
        }
      } finally {
        xytTemplateChoicesPromise = null;
      }
      return xytTemplateChoices;
    })();
  }
  return xytTemplateChoicesPromise;
}


// `xyt`'s built-in templates (the api's VivaVideo template library), the value is the template's id since some share
// a name. What's typed is still sent as it is when nothing is picked (the api takes ids and names)
export async function xytTemplates(context: Interaction.InteractionAutoCompleteContext) {
  const templates = await fetchXytTemplateChoices(context);

  let choices: Array<{name: string, value: string}> = [];
  if (templates) {
    if (context.value) {
      choices = templates.search.search(context.value).slice(0, 25).map((result) => {
        return {name: result.name, value: result.id};
      });
    } else {
      choices = templates.choices.slice(0, 25);
    }
  }
  return context.respond({choices});
}
