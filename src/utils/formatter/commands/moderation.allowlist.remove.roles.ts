import { Command, Interaction, Structures } from 'detritus-client';

import { GuildAllowlistTypes } from '../../../constants';

import * as ModerationAllowlist from './moderation.allowlist';
import * as ModerationAllowlistRemove from './moderation.allowlist.remove';


export interface CommandArgsBefore {
  roles: Array<Structures.Role> | null,
}

export interface CommandArgs {
  roles: Array<Structures.Role>,
}

export const COMMAND_ID = 'server.allowlist.remove.roles';

export async function createMessage(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  const { roles } = args;
  const payloads: Array<{
    item: Structures.Role,
    type: GuildAllowlistTypes.ROLE,
  }> = roles.map((role) => ({item: role, type: GuildAllowlistTypes.ROLE}));
  const { settings, title } = await ModerationAllowlistRemove.removeAllowlist(context, payloads);
  return ModerationAllowlist.createAllowlistEmbed(context, settings.allowlist, {title});
}
