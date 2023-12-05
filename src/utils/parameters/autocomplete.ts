import { Interaction } from 'detritus-client';
import { BaseSet } from 'detritus-client/lib/collections';

import { fetchTagsServer } from '../../api';
import {
  GoogleLocales,
  GoogleLocalesText,
  ImageMemeFonts,
  ImageMemeFontsToText,
  ImageObjectRemovalLabels,
  Timezones,
  TimezonesToText,
} from '../../constants';
import { toTitleCase } from '../tools';
import GuildSettingsStore from '../../stores/guildsettings';


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


export async function reminder(context: Interaction.InteractionAutoCompleteContext) {
  return context.respond({choices: []});
}


export async function tags(context: Interaction.InteractionAutoCompleteContext) {
  let choices: Array<{name: string, value: string}>;
  try {
    const serverId = context.guildId || context.channelId!;
    const { tags } = await fetchTagsServer(context, serverId, {
      name: context.value,
      limit: 25,
    });
    choices = tags.map((tag) => ({name: tag.name, value: tag.name}));
  } catch(error) {
    choices = [];
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
