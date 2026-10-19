import { ClusterClient, Command, Interaction, Structures } from 'detritus-client';
import { Colors } from 'detritus-client/lib/constants';
import { Markup } from 'detritus-client/lib/utils';

import { DateMomentLogFormat, StatusEmojis } from '../../../constants';
import { getTranslator } from '../../i18n';
import {
  DisplayPayload,
  Paginator,
  createTimestampMomentFromGuild,
  isSnowflake,
} from '../../../utils';


export const COMMAND_ID = 'search.discord.emojis';

export interface CommandArgs {
  emojis: Array<Structures.Emoji>,
}

const ELEMENTS_PER_PAGE = 30;
const MAX_DESCRIPTION_LENGTH = 2048;
const MAX_FIELD_LENGTH = 1024;
const MAX_PAGE_LENGTH = 5000;

export async function createMessage(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  const { language, translate, translateMaybe } = await getTranslator(context);
  const { emojis } = args;

  // pack pages by character budget (and at most ELEMENTS_PER_PAGE), entries that don't fit go onto the next page instead of being dropped
  const pages: Array<{description: string, fields: Array<string>}> = [];
  {
    let page: {description: string, fields: Array<string>} = {description: '', fields: []};
    let count = 0;
    let length = 0;
    for (let i = 0; i < emojis.length; i++) {
      const emoji = emojis[i];
      const timestamp = createTimestampMomentFromGuild(emoji.createdAtUnix as number, context.guildId);
      const part = translate('search_discord_emojis.created', {
        emoji: Markup.url(emoji.format, `<${emoji.url}?g=${emoji.guildId}>`),
        number: i + 1,
        timestamp: timestamp.locale(language).fromNow(),
      }) + '\n';

      if (count && (ELEMENTS_PER_PAGE <= count || MAX_PAGE_LENGTH < length + part.length + 1)) {
        pages.push(page);
        page = {description: '', fields: []};
        count = 0;
        length = 0;
      }

      if (!page.fields.length && page.description.length + part.length <= MAX_DESCRIPTION_LENGTH) {
        page.description += part;
        length += part.length;
      } else if (page.fields.length && page.fields[page.fields.length - 1].length + part.length <= MAX_FIELD_LENGTH) {
        page.fields[page.fields.length - 1] += part;
        length += part.length;
      } else {
        // new field, its name is a single zero-width space
        page.fields.push(part);
        length += part.length + 1;
      }
      count++;
    }
    if (count) {
      pages.push(page);
    }
  }

  const pageLimit = pages.length;
  const paginator = new Paginator(context, {
    pageLimit,
    onPage: (pageNumber) => {
      const payload: DisplayPayload = {fields: []};
      payload.color = Colors.BLURPLE;

      const title = translate('search_discord_emojis.emojis_found', {emojis_count: emojis.length.toLocaleString(language)});
      payload.title = title;
      payload.footer = (pageLimit === 1) ? title : translate('search_discord_emojis.page_of', {pageLimit: pageLimit, pageNumber: pageNumber, title: title});

      const page = pages[pageNumber - 1];
      if (page) {
        payload.description = page.description;
        for (let value of page.fields) {
          payload.fields!.push({name: '\u200b', value});
        }
      }
      return {display: payload};
    },
  });
  return await paginator.start();
}


export async function emojisSearch(value: string, context: Command.Context | Interaction.InteractionContext) {
  const { language, translate, translateMaybe } = await getTranslator(context);
  value = value.toLowerCase();
  if (!value) {
    throw new Error(`${StatusEmojis.WARNING} ${translate('search_discord_emojis.please_enter_some_kind_of_emoji_name')}`);
  }
  if (value.length <= 2) {
    throw new Error(`${StatusEmojis.WARNING} ${translate('search_discord_emojis.emoji_names_must_be_longer_than_2')}`);
  }

  let chunks: Array<Array<Structures.Emoji>>;
  if (context.manager) {
    chunks = await context.manager.broadcastEval((cluster: ClusterClient, name: string, isSnowflake: boolean) => {
      const emojis: Array<Structures.Emoji> = [];
      for (let [shardId, shard] of cluster.shards) {
        if (isSnowflake) {
          const emoji = shard.emojis.get(null, name);
          if (emoji) {
            emojis.push(emoji);
          }
        } else {
          for (let [emojiId, emoji] of shard.emojis) {
            if (emoji.name && emoji.name.toLowerCase().includes(name)) {
              emojis.push(emoji);
            }
          }
        }
      }
      return emojis;
    }, value, isSnowflake(value));
  } else {
    chunks = [];
  }
  return chunks.flat().map((raw) => {
    return new Structures.Emoji(context.client, raw);
  }).sort((x, y) => (y.createdAtUnix as number) - (x.createdAtUnix as number));
}
