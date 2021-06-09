import { Command, CommandClient } from 'detritus-client';
import { Permissions } from 'detritus-client/lib/constants';

import { CommandTypes, EmbedColors } from '../../constants';
import GuildSettingsStore from '../../stores/guildsettings';
import { Formatter, createUserEmbed, editOrReply } from '../../utils';

import { BaseCommand } from '../basecommand';


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
      Formatter.Commands.SettingsPrefixesList.formatPrefixes(context, settings.prefixes, embed);
    }

    return editOrReply(context, {embed});
  }
}
