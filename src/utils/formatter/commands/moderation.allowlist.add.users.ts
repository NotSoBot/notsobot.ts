import { Command, Interaction, Structures } from 'detritus-client';

import { GuildAllowlistTypes } from '../../../constants';

import * as ModerationAllowlist from './moderation.allowlist';
import * as ModerationAllowlistAdd from './moderation.allowlist.add';


export interface CommandArgsBefore {
  users: Array<Structures.Member | Structures.User> | null,
}

export interface CommandArgs {
  users: Array<Structures.Member | Structures.User>,
}

export const COMMAND_ID = 'moderation.allowlist.add.users';

export async function createMessage(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  const { users } = args;
  const payloads: Array<{
    item: Structures.User,
    type: GuildAllowlistTypes.USER,
  }> = users.map((user) => ({item: user, type: GuildAllowlistTypes.USER}));
  const { settings, title } = await ModerationAllowlistAdd.createAllowlist(context, payloads);
  return ModerationAllowlist.createAllowlistEmbed(context, settings.allowlist, {title});
}
