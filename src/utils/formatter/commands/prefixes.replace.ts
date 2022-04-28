import { Command, Interaction } from 'detritus-client';
import { Embed, Markup } from 'detritus-client/lib/utils';

import { editGuildSettings } from '../../../api';
import { EmbedColors } from '../../../constants';

import { createUserEmbed, editOrReply } from '../../tools';

import * as PrefixesList from './prefixes.list';


export const COMMAND_ID = 'prefixes.replace';

export interface CommandArgs {
  prefix: string,
}

export async function createMessage(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  const isFromInteraction = (context instanceof Interaction.InteractionContext);

  const guildId = context.guildId as string;

  const embed = (isFromInteraction) ? new Embed() : createUserEmbed(context.user);
  embed.setColor(EmbedColors.DEFAULT);
  embed.setTitle(`Replaced prefixes with **${Markup.escape.all(args.prefix)}**`);

  const { prefixes } = await editGuildSettings(context, guildId, {prefixes: [args.prefix]});
  PrefixesList.formatPrefixes(context, prefixes, embed);

  return editOrReply(context, {embed});
}
