import { Command, Interaction } from 'detritus-client';
import { Embed } from 'detritus-client/lib/utils';

import { editGuildSettings } from '../../../api';
import { EmbedColors } from '../../../constants';

import { createUserEmbed, editOrReply } from '../../tools';

import * as SettingsPrefixesList from './settings.prefixes.list';



export async function createMessage(
context: Command.Context | Interaction.InteractionContext,
) {
  const isFromInteraction = (context instanceof Interaction.InteractionContext);

  const guildId = context.guildId!;

  const embed = (isFromInteraction) ? new Embed() : createUserEmbed(context.user);
  embed.setColor(EmbedColors.DEFAULT);
  embed.setTitle('Cleared prefixes');

  const { prefixes } = await editGuildSettings(context, guildId, {prefixes: []});
  SettingsPrefixesList.formatPrefixes(context, prefixes, embed);

  return editOrReply(context, {embed});
}
