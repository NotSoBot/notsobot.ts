import { Command, Interaction } from 'detritus-client';
import { Markup } from 'detritus-client/lib/utils';

import GuildMetadataStore from '../../../stores/guildmetadata';
import { getTranslator } from '../../i18n';

import { fetchUserPremiumServers } from '../../../api';
import { RestResponsesRaw } from '../../../api/types';
import { EmbedColors, StatusEmojis } from '../../../constants';
import { DisplayPayload, displayDetailsLine, displayReply, displayTimestamp } from '../../../utils';


export const COMMAND_ID = 'premium.servers';

// the api's `MAX_SERVER_AI_MESSAGES`, NotSoAI messages every 12 hours each plus ai slot gives a server
export const SERVER_AI_MESSAGES_PER_SLOT = 50;

export interface CommandArgs {

}

// the guild's name when we know it, group dms (and guilds we can't see) only have their id
export function getServerName(
  context: Command.Context | Interaction.InteractionContext,
  serverId: string,
): null | string {
  const guild = context.guilds.get(serverId) || (GuildMetadataStore.get(serverId) || {}).guild;
  if (guild) {
    return guild.name;
  }
  if (context.channelId === serverId && context.channel && context.channel.name) {
    return context.channel.name;
  }
  return null;
}

export async function createPayload(
  context: Command.Context | Interaction.InteractionContext,
  response: RestResponsesRaw.FetchUserPremiumServers,
): Promise<DisplayPayload> {
  const { language, translate } = await getTranslator(context);

  const description: Array<string> = [];
  if (!response.active) {
    description.push(`${StatusEmojis.WARNING} ${translate('premium_servers.not_active')}`, '');
  }
  if (response.items.length) {
    const now = Date.now();
    response.items.forEach((item, index) => {
      const name = getServerName(context, item.server_id);
      description.push(`${Markup.bold(String(index + 1))}: ${(name) ? Markup.escape.all(name) : Markup.codestring(item.server_id)}`);

      const removableAt = new Date(item.removable_at);
      description.push(displayDetailsLine([
        (name) ? item.server_id : null,
        (1 < item.slots) ? translate('premium_servers.slots', {count: item.slots.toLocaleString(language)}) : null,
        translate('premium_servers.added', {time: displayTimestamp(item.created)}),
        (now < removableAt.getTime()) ? translate('premium_servers.removable', {time: displayTimestamp(removableAt)}) : null,
      ], true));
    });
  } else {
    description.push(translate('premium_servers.none_yet'));
  }

  return {
    color: EmbedColors.DEFAULT,
    description: description.join('\n'),
    ephemeral: true,
    footer: translate('premium_servers.footer', {
      count: response.used.toLocaleString(language),
      max: (response.limit === null) ? '\u221E' : response.limit.toLocaleString(language),
    }),
    title: translate('premium_servers.title'),
  };
}

export async function createMessage(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  const response = await fetchUserPremiumServers(context, context.userId);
  return displayReply(context, await createPayload(context, response));
}
