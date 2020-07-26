import { Command } from 'detritus-client';
import { Permissions } from 'detritus-client/lib/constants';
import { Embed, Markup } from 'detritus-client/lib/utils';

import { editGuildSettings } from '../../api';
import { CommandTypes, EmbedColors, GuildAllowlistTypes } from '../../constants';
import GuildSettingsStore from '../../stores/guildsettings';
import { createUserEmbed } from '../../utils';

import { BaseCommand } from '../basecommand';


export interface CommandArgs {
  only?: GuildAllowlistTypes,
}

export default class AllowlistClearCommand extends BaseCommand {
  name = 'allowlist clear';

  choices = Object.values(GuildAllowlistTypes);
  default = null;
  disableDm = true;
  help = `Must be one of (${Object.values(GuildAllowlistTypes).join(', ')})`;
  label = 'only';
  metadata = {
    description: 'Clear out Channels/Roles/Users/Server-Wide allowlist.',
    examples: [
      'allowlist clear',
      'allowlist clear channels',
    ],
    type: CommandTypes.MODERATION,
    usage: 'allowlist clear ?<GuildDisableCommandsType>',
  };
  permissionsClient = [Permissions.EMBED_LINKS];
  permissions = [Permissions.ADMINISTRATOR];
  priority = -1;
  type = (value: string) => value.toLowerCase();

  // add only variable (to only clear that type)
  async run(context: Command.Context, args: CommandArgs) {
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

    return context.editOrReply({embed});
  }
}
