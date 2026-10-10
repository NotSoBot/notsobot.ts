import { Command, Interaction, Structures } from 'detritus-client';

import { GuildBlocklistTypes } from '../../../constants';

import * as ModerationBlocklist from './moderation.blocklist';
import * as ModerationBlocklistAdd from './moderation.blocklist.add';


export interface CommandArgsBefore {
  channels: Array<Structures.Channel> | null,
}

export interface CommandArgs {
  channels: Array<Structures.Channel>,
}

export const COMMAND_ID = 'blocklist.add.channels';

export async function createMessage(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  const { channels } = args;
  const payloads: Array<{
    item: Structures.Channel,
    type: GuildBlocklistTypes.CHANNEL,
  }> = channels.map((channel) => ({item: channel, type: GuildBlocklistTypes.CHANNEL}));
  const { settings, title } = await ModerationBlocklistAdd.createBlocklist(context, payloads);
  return ModerationBlocklist.createBlocklistEmbed(context, settings.blocklist, {title});
}
