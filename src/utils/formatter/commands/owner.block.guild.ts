import { Command, Interaction, Structures } from 'detritus-client';
import { Markup } from 'detritus-client/lib/utils';

import { editGuildSettings } from '../../../api';
import { getTranslator } from '../../i18n';
import { editOrReply } from '../../../utils';


export interface CommandArgsBefore {
  guild: Structures.Guild | null,
}

export interface CommandArgs {
  guild: Structures.Guild,
}


export const COMMAND_ID = 'owner.block.guild';

export async function createMessage(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  const { language, translate, translateMaybe } = await getTranslator(context);
  const { guild } = args;

  const settings = await editGuildSettings(context, guild.id, {blocked: true});
  return editOrReply(context, translate('owner_block_guild.alright_blocked_guild', {guild: guild.id, name: Markup.escape.all(guild.name)}));
}
