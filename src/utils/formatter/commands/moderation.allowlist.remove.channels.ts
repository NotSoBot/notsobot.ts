import { Command, Interaction, Structures } from 'detritus-client';

import { GuildAllowlistTypes } from '../../../constants';

import * as ModerationAllowlist from './moderation.allowlist';
import * as ModerationAllowlistRemove from './moderation.allowlist.remove';


export interface CommandArgsBefore {
  channels: Array<Structures.Channel> | null,
}

export interface CommandArgs {
  channels: Array<Structures.Channel>,
}

export const COMMAND_ID = 'allowlist.remove.channels';

export async function createMessage(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  const { channels } = args;
  const payloads: Array<{
    item: Structures.Channel,
    type: GuildAllowlistTypes.CHANNEL,
  }> = channels.map((channel) => ({item: channel, type: GuildAllowlistTypes.CHANNEL}));
  const { settings, title } = await ModerationAllowlistRemove.removeAllowlist(context, payloads);
  return ModerationAllowlist.createAllowlistEmbed(context, settings.allowlist, {title});
}
