import { Interaction } from 'detritus-client';
import { BaseSet } from 'detritus-client/lib/collections';

import { fetchTagsServer } from '../../api';
import { GoogleLocales, GoogleLocalesText, ImageMemeFonts, ImageMemeFontsToText } from '../../constants';
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
