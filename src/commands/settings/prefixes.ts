import * as moment from 'moment';

import { Command } from 'detritus-client';
import { Permissions } from 'detritus-client/lib/constants';
import { Embed, Markup } from 'detritus-client/lib/utils';

import { CommandTypes, EmbedColors } from '../../constants';
import GuildSettingsStore,  { GuildSettingsStored } from '../../stores/guildsettings';

import { BaseCommand } from '../basecommand';


export function formatPrefixes(
  context: Command.Context,
  settings: GuildSettingsStored,
  embed?: Embed,
): Embed {
  if (!embed) {
    embed = new Embed();
  }
  if (settings.prefixes.length) {
    const description = settings.prefixes.map((prefix, i) => {
      const added = moment(prefix.added).fromNow();
      return `${i + 1}. **${Markup.escape.all(prefix.prefix)}** added ${added}`;
    });
    embed.setDescription(description.join('\n'));
  } else {
    const description = Array.from(context.commandClient.prefixes.custom).map((prefix, i) => {
      return `${i + 1}. **${Markup.escape.all(prefix)}**`;
    });

    embed.setDescription([
      'Using the default prefixes:\n',
      description.join('\n'),
    ].join('\n'));
  }
  return embed;
}

export default class PrefixesCommand extends BaseCommand {
  aliases = ['prefix'];
  name = 'prefixes';

  disableDm = true;
  metadata = {
    description: 'Show all current prefixes in the server.',
    type: CommandTypes.SETTINGS,
    usage: 'prefixes',
  };
  permissionsClient = [Permissions.EMBED_LINKS];
  priority = -1;

  async run(context: Command.Context) {
    const guildId = <string> context.guildId;

    const embed = new Embed();
    embed.setAuthor(context.user.toString(), context.user.avatarUrlFormat(null, {size: 1024}), context.user.jumpLink);
    embed.setColor(EmbedColors.DEFAULT);
    embed.setTitle('Showing prefixes');

    const settings = await GuildSettingsStore.getOrFetch(context, guildId);
    if (settings) {
      formatPrefixes(context, settings, embed);
    }

    return context.editOrReply({embed});
  }
}
