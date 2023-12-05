import { Command, Interaction } from 'detritus-client';
import { Markup } from 'detritus-client/lib/utils';

import { editGuildSettings } from '../../../api';
import { GuildSettings } from '../../../api/structures/guildsettings';
import { EmbedColors, GuildCommandsAllowlistTypes } from '../../../constants';
import GuildSettingsStore from '../../../stores/guildsettings';
import { createUserEmbed, editOrReply } from '../../../utils';

import { createCommandsAllowlistsEmbed } from './moderation.commands.allowlist';


export const COMMAND_ID = 'moderation.commands.allowlist.clear';

export interface CommandArgs {
  only: GuildCommandsAllowlistTypes | null,
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
    embed.setFooter('Commands Allowlist');
  }
  
  return editOrReply(context, {embed});
}
