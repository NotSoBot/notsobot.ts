import { Command, Interaction, Structures } from 'detritus-client';

import { GuildBlocklistTypes } from '../../../constants';

import * as ModerationBlocklist from './moderation.blocklist';
import * as ModerationBlocklistRemove from './moderation.blocklist.remove';


export interface CommandArgsBefore {
  roles: Array<Structures.Role> | null,
}

export interface CommandArgs {
  roles: Array<Structures.Role>,
}

export const COMMAND_ID = 'server.blocklist.remove.roles';

export async function createMessage(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  const { roles } = args;
  const payloads: Array<{
    item: Structures.Role,
    type: GuildBlocklistTypes.ROLE,
  }> = roles.map((role) => ({item: role, type: GuildBlocklistTypes.ROLE}));
  const { settings, title } = await ModerationBlocklistRemove.removeBlocklist(context, payloads);
  return ModerationBlocklist.createBlocklistEmbed(context, settings.blocklist, {title});
}
