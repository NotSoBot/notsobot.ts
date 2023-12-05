import { Command, Interaction } from 'detritus-client';
import { Embed, Markup } from 'detritus-client/lib/utils';

import { deleteGuildPrefix } from '../../../api';
import { EmbedColors } from '../../../constants';

import { createUserEmbed, editOrReply } from '../../tools';

import * as PrefixesList from './prefixes.list';


export const COMMAND_ID = 'prefixes.remove';

export interface CommandArgs {
  prefix: string,
}

export async function createMessage(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  const isFromInteraction = (context instanceof Interaction.InteractionContext);

  const guildId = context.guildId!;

  const embed = (isFromInteraction) ? new Embed() : createUserEmbed(context.user);
  embed.setColor(EmbedColors.DEFAULT);
  embed.setTitle(`Remove prefix: **${Markup.escape.all(args.prefix)}**`);

  const prefixes = await deleteGuildPrefix(context, guildId, args.prefix);
  PrefixesList.formatPrefixes(context, prefixes, embed);

  return editOrReply(context, {embed});
}
