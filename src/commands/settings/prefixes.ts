import { Collections, Command, CommandClient } from 'detritus-client';
import { Permissions } from 'detritus-client/lib/constants';
import { Embed, Markup } from 'detritus-client/lib/utils';

import { GuildSettingsPrefix } from '../../api/structures/guildsettings';
import { CommandTypes, EmbedColors } from '../../constants';
import GuildSettingsStore from '../../stores/guildsettings';
import { createUserEmbed } from '../../utils';

import { BaseCommand } from '../basecommand';


export function formatPrefixes(
  context: Command.Context,
  prefixes: Collections.BaseCollection<string, GuildSettingsPrefix>,
  embed?: Embed,
): Embed {
  if (!embed) {
    embed = new Embed();
  }
  if (prefixes.length) {
    let i = 1;
    const description = prefixes.map((prefix) => {
      return [
        `${i++}. **${Markup.escape.all(prefix.prefix)}** added ${prefix.addedAtText}`,
        `-> By <@${prefix.userId}>`,
      ].join('\n');
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

export const COMMAND_NAME = 'prefixes';

export default class PrefixesCommand extends BaseCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      aliases: ['prefix'],
      disableDm: true,
      metadata: {
        description: 'Show all current prefixes in the server.',
        examples: [
          COMMAND_NAME,
        ],
        type: CommandTypes.SETTINGS,
        usage: `${COMMAND_NAME}`,
      },
      permissionsClient: [Permissions.EMBED_LINKS],
      priority: -1,
    });
  }

  async run(context: Command.Context) {
    const guildId = context.guildId as string;

    const embed = createUserEmbed(context.user);
    embed.setColor(EmbedColors.DEFAULT);
    embed.setTitle('Showing prefixes');

    const settings = await GuildSettingsStore.getOrFetch(context, guildId);
    if (settings) {
      formatPrefixes(context, settings.prefixes, embed);
    }

    return context.editOrReply({embed});
  }
}
