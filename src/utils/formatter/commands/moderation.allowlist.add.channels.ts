import { Command, Interaction, Structures } from 'detritus-client';

import { GuildAllowlistTypes } from '../../../constants';

import * as ModerationAllowlist from './moderation.allowlist';
import * as ModerationAllowlistAdd from './moderation.allowlist.add';


export interface CommandArgsBefore {
  channels: Array<Structures.Channel> | null,
}

export interface CommandArgs {
  channels: Array<Structures.Channel>,
}

export const COMMAND_ID = 'allowlist.add.channels';

export async function createMessage(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  const { channels } = args;
  const payloads: Array<{
    item: Structures.Channel,
    type: GuildAllowlistTypes.CHANNEL,
  }> = channels.map((channel) => ({item: channel, type: GuildAllowlistTypes.CHANNEL}));
  const { settings, title } = await ModerationAllowlistAdd.createAllowlist(context, payloads);
  return ModerationAllowlist.createAllowlistEmbed(context, settings.allowlist, {title});
}
