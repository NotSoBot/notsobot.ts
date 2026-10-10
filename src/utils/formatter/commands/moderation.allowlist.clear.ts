import { Command, Interaction } from 'detritus-client';

import { editGuildSettings } from '../../../api';
import { EmbedColors, GuildAllowlistTypes } from '../../../constants';
import { createUserEmbed, editOrReply } from '../../../utils';


export interface CommandArgs {
  only?: GuildAllowlistTypes | null,
}

export const COMMAND_ID = 'allowlist.clear';

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
    embed.setTitle('Cleared Allowlist');
    embed.setDescription('Cleared out the entire Allowlist of this guild.');
    embed.setFooter('Allowlist');

    const settings = await editGuildSettings(context, guildId, {allowlist: []});
  }

  return editOrReply(context, {embed});
}
