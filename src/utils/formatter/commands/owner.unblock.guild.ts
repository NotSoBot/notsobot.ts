import { Command, Interaction, Structures } from 'detritus-client';
import { Markup } from 'detritus-client/lib/utils';

import { editGuildSettings } from '../../../api';
import { editOrReply } from '../../../utils';


export interface CommandArgsBefore {
  guild: Structures.Guild | null,
}

export interface CommandArgs {
  guild: Structures.Guild,
}


export const COMMAND_ID = 'owner.unblock.guild';

export async function createMessage(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  const { guild } = args;

  const settings = await editGuildSettings(context, guild.id, {blocked: false});
  return editOrReply(context, `Alright, unblocked guild ${Markup.escape.all(guild.name)} (${guild.id})}.`);
}
