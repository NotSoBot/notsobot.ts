import { Command, Interaction, Structures } from 'detritus-client';

import { GuildBlocklistTypes } from '../../../constants';

import * as ModerationBlocklist from './moderation.blocklist';
import * as ModerationBlocklistAdd from './moderation.blocklist.add';


export interface CommandArgsBefore {
  roles: Array<Structures.Role> | null,
}

export interface CommandArgs {
  roles: Array<Structures.Role>,
}

export const COMMAND_ID = 'blocklist.add.roles';

export async function createMessage(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  const { roles } = args;
  const payloads: Array<{
    item: Structures.Role,
    type: GuildBlocklistTypes.ROLE,
  }> = roles.map((role) => ({item: role, type: GuildBlocklistTypes.ROLE}));
  const { settings, title } = await ModerationBlocklistAdd.createBlocklist(context, payloads);
  return ModerationBlocklist.createBlocklistEmbed(context, settings.blocklist, {title});
}
