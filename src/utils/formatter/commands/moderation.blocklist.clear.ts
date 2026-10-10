import { Command, Interaction } from 'detritus-client';

import { editGuildSettings } from '../../../api';
import { EmbedColors, GuildBlocklistTypes } from '../../../constants';
import { createUserEmbed, editOrReply } from '../../../utils';


export interface CommandArgs {
  only?: GuildBlocklistTypes | null,
}

export const COMMAND_ID = 'blocklist.clear';

export async function createMessage(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  const guildId = context.guildId as string;

  const embed = createUserEmbed(context.user);
  embed.setColor(EmbedColors.DEFAULT);
  if (args.only) {
    embed.setTitle('WIP');
    embed.setDescription(args.only);
  } else {
    embed.setTitle('Cleared Blocklist');
    embed.setDescription('Cleared out the entire Blocklist of this guild.');
    embed.setFooter('Blocklist');

    const settings = await editGuildSettings(context, guildId, {blocklist: []});
  }

  return editOrReply(context, {embed});
}
