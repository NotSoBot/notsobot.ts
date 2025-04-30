import { Interaction } from 'detritus-client';
import { BaseSet } from 'detritus-client/lib/collections';

import MiniSearch from 'minisearch';

import GuildSettingsStore from '../../stores/guildsettings';
import TagCustomCommandStore from '../../stores/tagcustomcommands';
import UserStore from '../../stores/users';
import UserSettingsStore from '../../stores/usersettings';

import {
  fetchTagsServer,
  fetchUserReminders,
  fetchUserVoices,
  utilitiesLocations,
} from '../../api';
import { RestResponsesRaw } from '../../api/types';
import {
  DateMomentLogFormat,
  GoogleLocales,
  GoogleLocalesText,
  GuildFeatures,
  ImageMemeFonts,
  ImageMemeFontsToText,
  ImageObjectRemovalLabels,
  Mimetypes,
  MimetypesToExtension,
  MLDiffusionModels,
  MLDiffusionModelsToText,
  TagGenerationModels,
  TagGenerationModelsToText,
  TagSearchSortByFilters,
  Timezones,
  TimezonesToText,
  TTSVoices,
  TTSVoicesToText,
  UserFlags,
} from '../../constants';
import {
  createTimestampMomentFromContext,
  getReminderMessage,
  toTitleCase,
} from '../tools';



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
        if (choice.value === MLDiffusionModels.FLUX_SCHNELL) {
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
  storeFields: ['id', 'name'],
  searchOptions: {
    boost: {id: 2},
    fuzzy: true,
    prefix: true,
  },
});
mlLLMModelSearch.addAll(Object.values(TagGenerationModels).map((value) => {
  return {id: value, name: TagGenerationModelsToText[value] || value};
}));

export async function mlLLMModel(context: Interaction.InteractionAutoCompleteContext) {
  let choices: Array<{name: string, value: string}>;
  if (context.value) {
    choices = mlLLMModelSearch.search(context.value).slice(0, 25).map((result) => {
      return {name: result.name, value: result.id};
    });
  } else {
    choices = Object.values(TagGenerationModels).map((value) => {
      return {name: TagGenerationModelsToText[value] || value, value};
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
  const value = (context.value || '').toLowerCase();

  const serverId = context.guildId || null;

  const response = await fetchUserReminders(context, context.userId);
  const reminders = response.reminders.reverse();

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



export async function reminderServer(context: Interaction.InteractionAutoCompleteContext) {
  // check if user is filled out, then filter out by that
  // if user is not filled out, show everything
  // return reminder id
}



export async function tags(context: Interaction.InteractionAutoCompleteContext) {
  let choices: Array<{name: string, value: string}>;
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


export async function tagsToAdd(context: Interaction.InteractionAutoCompleteContext) {
  let choices: Array<{name: string, value: string}> = [];
  if (context.value) {
    // if its a tag directory link or tag id, fetch it and return the name here
  }
  if (context.inDm && context.hasServerPermissions) {
    // we are in our one-on-one dms, we cannot add our own tags into here, only support tag directory
    choices = [];
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
        choices = tags.filter((tag) => !tag.reference_tag).map((tag) => {
          return {name: tag.name, value: tag.id};
        });
      }
    } catch(error) {
      choices = [];
    }
  }
  return context.respond({choices});
}



// needs better sorting
export async function timezone(context: Interaction.InteractionAutoCompleteContext) {
  let choices: Array<{name: string, value: string}>;
  if (context.value) {
    const value = context.value.toLowerCase().replace(/\s\s+/g, ' ');
    const searchKey = value.replace(/\s/g, '_');
    const searchValue = value.replace(/\\/g, ' ')

    const collection = new Set<string>();
    for (let key in TimezonesToText) {
      const keyInsensitive = key.toLowerCase();
      const valueInsensitive = (TimezonesToText as any)[key].toLowerCase();
      if (!valueInsensitive) {
        continue;
      }

      if (keyInsensitive.includes(searchKey) || valueInsensitive.includes(searchValue)) {
        collection.add(key);
      }
    }
    choices = Array.from(collection).map((timezone: string) => {
      return {name: (TimezonesToText as any)[timezone], value: timezone};
    }).sort((x, y) => {
      return x.name.localeCompare(y.name);
    }).slice(0, 25);
  } else {
    choices = Object.entries(TimezonesToText).filter((x) => x[1]).sort((x, y) => {
      return x[1].localeCompare(y[1]);
    }).slice(0, 25).map(([timezone, name]) => {
      return {name, value: timezone};
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


export async function ttsVoices(context: Interaction.InteractionAutoCompleteContext) {
  // add check to see if user has premium
  let voices: Array<{id: string, name: string}> = [];
  try {
    const response = await fetchUserVoices(context, context.userId);
    voices = response.voices;
  } catch(error) {
    
  }

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
      TTSVoices.TIKTOK_EN_MALE_LOBBY,
      TTSVoices.TIKTOK_EN_MALE_NARRATION,
      TTSVoices.TIKTOK_EN_MALE_SUNSHINE_SOON,
      TTSVoices.TIKTOK_EN_UK_MALE_01,
      TTSVoices.TIKTOK_EN_US_C3PO,
      TTSVoices.TIKTOK_EN_US_CHEWBACCA,
      TTSVoices.TIKTOK_EN_US_FEMALE_01,
      TTSVoices.TIKTOK_EN_US_GHOSTFACE,
      TTSVoices.TIKTOK_EN_US_MALE_01,
      TTSVoices.TIKTOK_EN_US_ROCKET,
      TTSVoices.TIKTOK_EN_US_STITCH,
      TTSVoices.TIKTOK_EN_US_STORMTROOPER,
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



export function objectRemovalLabels(context: Interaction.InteractionAutoCompleteContext) {
  let choices: Array<{name: string, value: string}>;
  if (context.value) {
    const values = new BaseSet<ImageObjectRemovalLabels>();

    const value = context.value.toUpperCase().replace(/\s/g, '_');
    for (let key in ImageObjectRemovalLabels) {
      const label = key as ImageObjectRemovalLabels;
      if (label.includes(value)) {
        values.add(label);
      }
    }

    choices = values.toArray().slice(0, 25).map((label) => {
      return {name: toTitleCase(label), value: label};
    });
  } else {
    choices = [
      ImageObjectRemovalLabels.PERSON,
      ImageObjectRemovalLabels.CAT,
      ImageObjectRemovalLabels.DOG,
      ImageObjectRemovalLabels.CAR,
      ImageObjectRemovalLabels.BICYCLE,
      ImageObjectRemovalLabels.AIRPLANE,
      ImageObjectRemovalLabels.MOTORCYCLE,
      ImageObjectRemovalLabels.BUS,
      ImageObjectRemovalLabels.TRUCK
    ].map((x) => ({name: ImageObjectRemovalLabels[x], value: x}));
  }
  return context.respond({choices});
}
