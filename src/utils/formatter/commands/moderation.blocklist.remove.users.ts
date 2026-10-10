import { Command, Interaction, Structures } from 'detritus-client';

import { GuildBlocklistTypes } from '../../../constants';

import * as ModerationBlocklist from './moderation.blocklist';
import * as ModerationBlocklistRemove from './moderation.blocklist.remove';


export interface CommandArgsBefore {
  users: Array<Structures.Member | Structures.User> | null,
}

export interface CommandArgs {
  users: Array<Structures.Member | Structures.User>,
}

export const COMMAND_ID = 'moderation.blocklist.remove.users';

export async function createMessage(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  const { users } = args;
  const payloads: Array<{
    item: Structures.User,
    type: GuildBlocklistTypes.USER,
  }> = users.map((user) => ({item: user, type: GuildBlocklistTypes.USER}));
  const { settings, title } = await ModerationBlocklistRemove.removeBlocklist(context, payloads);
  return ModerationBlocklist.createBlocklistEmbed(context, settings.blocklist, {title});
}
