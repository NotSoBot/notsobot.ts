import { Command, Interaction, Structures } from 'detritus-client';

import { GuildAllowlistTypes } from '../../../constants';

import * as ModerationAllowlist from './moderation.allowlist';
import * as ModerationAllowlistAdd from './moderation.allowlist.add';


export interface CommandArgsBefore {
  roles: Array<Structures.Role> | null,
}

export interface CommandArgs {
  roles: Array<Structures.Role>,
}

export const COMMAND_ID = 'server.allowlist.add.roles';

export async function createMessage(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  const { roles } = args;
  const payloads: Array<{
    item: Structures.Role,
    type: GuildAllowlistTypes.ROLE,
  }> = roles.map((role) => ({item: role, type: GuildAllowlistTypes.ROLE}));
  const { settings, title } = await ModerationAllowlistAdd.createAllowlist(context, payloads);
  return ModerationAllowlist.createAllowlistEmbed(context, settings.allowlist, {title});
}
