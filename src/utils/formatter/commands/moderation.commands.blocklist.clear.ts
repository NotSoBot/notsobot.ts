import { Command, Interaction } from 'detritus-client';
import { Markup } from 'detritus-client/lib/utils';

import { editGuildSettings } from '../../../api';
import { GuildSettings } from '../../../api/structures/guildsettings';
import { EmbedColors, GuildCommandsBlocklistTypes } from '../../../constants';
import GuildSettingsStore from '../../../stores/guildsettings';
import { createUserEmbed, editOrReply } from '../../../utils';

import { createCommandsBlocklistsEmbed } from './moderation.commands.blocklist';


export const COMMAND_ID = 'commands.blocklist.clear';

export interface CommandArgs {
  only: GuildCommandsBlocklistTypes | null,
}

export async function createMessage(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  const guildId = context.guildId!;
  
  const embed = createUserEmbed(context.user);
  embed.setColor(EmbedColors.DEFAULT);
  if (args.only) {
    embed.setTitle('WIP');
    embed.setDescription(args.only);
  } else {
    embed.setTitle('WIP');
    embed.setDescription('clear the entire guild');
    embed.setFooter('Commands Blocklist');
  }
  
  return editOrReply(context, {embed});
}
