import { Command } from 'detritus-client';
import { Permissions } from 'detritus-client/lib/constants';
import { Embed, Markup } from 'detritus-client/lib/utils';

import { editGuildSettings } from '../../api';
import { CommandTypes, EmbedColors } from '../../constants';
import GuildSettingsStore from '../../stores/guildsettings';

import { BaseCommand } from '../basecommand';


export default class BlocklistClearCommand extends BaseCommand {
  name = 'blocklist clear';

  disableDm = true;
  metadata = {
    description: 'Clear out the entire guild\'s blocklist.',
    examples: [
      'blocklist clear',
    ],
    type: CommandTypes.MODERATION,
    usage: 'blocklist clear',
  };
  permissionsClient = [Permissions.EMBED_LINKS];
  permissions = [Permissions.MANAGE_GUILD];
  priority = -1;

  async run(context: Command.Context) {
    const guildId = context.guildId as string;

    const embed = new Embed();
    embed.setAuthor(String(context.user), context.user.avatarUrl, context.user.jumpLink);
    embed.setColor(EmbedColors.DEFAULT);
    embed.setTitle('Cleared Blocklist');
    embed.setDescription('Cleared out the entire Blocklist of this guild.');
    embed.setFooter('Blocklist');

    const settings = await editGuildSettings(context, guildId, {blocklist: []});
    GuildSettingsStore.set(guildId, settings);

    return context.editOrReply({embed});
  }
}
