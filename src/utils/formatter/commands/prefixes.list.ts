import moment from 'moment';

import { Collections, Command, Interaction } from 'detritus-client';
import { Markup } from 'detritus-client/lib/utils';

import { GuildSettingsPrefix } from '../../../api/structures/guildsettings';
import { getCachedTranslator, getTranslator } from '../../i18n';
import { EmbedColors } from '../../../constants';
import GuildSettingsStore from '../../../stores/guildsettings';
import { DisplayPayload, displayReply } from '../../tools';


export const COMMAND_ID = 'server.prefixes.list';

export function formatPrefixes(
  context: Command.Context | Interaction.InteractionContext,
  prefixes: Collections.BaseCollection<string, GuildSettingsPrefix>,
  payload: DisplayPayload = {},
): DisplayPayload {
  const { language, translate, translateMaybe } = getCachedTranslator(context);
  if (prefixes.length) {
    let i = 1;
    const description = prefixes.map((prefix) => {
      return [
        translate('prefixes_list.added', {addedAtText: moment(prefix.added).locale(language).fromNow(), i: i++, prefix: Markup.escape.all(prefix.prefix)}),
        translate('prefixes_list.by', {userId: prefix.userId}),
      ].join('\n');
    });
    payload.description = description.join('\n');
  } else {
    const description: Array<string> = [];
    if (context.commandClient) {
      const prefixes = Array.from(context.commandClient.prefixes.custom);
      for (let i = 0; i < prefixes.length; i++) {
        const prefix = prefixes[i];
        description.push(`${i + 1}. **${Markup.escape.all(prefix)}**`);
      }
    }

    payload.description = [
      translate('prefixes_list.using_the_default_prefixes'),
      description.join('\n'),
    ].join('\n');
  }
  return payload;
}


export async function createMessage(
  context: Command.Context | Interaction.InteractionContext,
) {
  const { language, translate, translateMaybe } = await getTranslator(context);

  const guildId = context.guildId!;

  const payload: DisplayPayload = {fields: []};
  payload.color = EmbedColors.DEFAULT;
  payload.title = translate('prefixes_list.showing_prefixes');

  const settings = await GuildSettingsStore.getOrFetch(context, guildId);
  if (settings) {
    formatPrefixes(context, settings.prefixes, payload);
  }

  return displayReply(context, payload);
}
