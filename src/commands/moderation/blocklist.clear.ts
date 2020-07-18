import { Command } from 'detritus-client';
import { Permissions } from 'detritus-client/lib/constants';
import { Embed, Markup } from 'detritus-client/lib/utils';

import { editGuildSettings } from '../../api';
import { CommandTypes, EmbedColors, GuildBlocklistTypes } from '../../constants';
import GuildSettingsStore from '../../stores/guildsettings';

import { BaseCommand } from '../basecommand';

import { guildBlocklistType } from './blocklist';


export interface CommandArgs {
  only?: GuildBlocklistTypes,
}

export default class BlocklistClearCommand extends BaseCommand {
  name = 'blocklist clear';

  disableDm = true;
  label = 'only';
  metadata = {
    description: 'Clear out Channels/Roles/Users/Server-Wide blocklist.',
    examples: [
      'blocklist clear',
      'blocklist clear channels',
    ],
    type: CommandTypes.MODERATION,
    usage: 'blocklist clear ?<GuildDisableCommandsType>',
  };
  permissionsClient = [Permissions.EMBED_LINKS];
  permissions = [Permissions.ADMINISTRATOR];
  priority = -1;
  type = guildBlocklistType;

  // add only variable (to only clear that type)
  async run(context: Command.Context, args: CommandArgs) {
    const guildId = context.guildId as string;

    const embed = new Embed();
    embed.setAuthor(String(context.user), context.user.avatarUrl, context.user.jumpLink);
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

    return context.editOrReply({embed});
  }
}
