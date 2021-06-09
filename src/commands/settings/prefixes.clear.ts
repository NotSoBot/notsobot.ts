import { Command, CommandClient } from 'detritus-client';
import { Permissions } from 'detritus-client/lib/constants';

import { editGuildSettings } from '../../api';
import { CommandTypes, EmbedColors } from '../../constants';
import { Formatter, createUserEmbed, editOrReply } from '../../utils';

import { BaseCommand } from '../basecommand';


export const COMMAND_NAME = 'prefixes clear';

export default class PrefixesClearCommand extends BaseCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      aliases: ['prefix clear'],
      disableDm: true,
      metadata: {
        description: 'Clear all custom prefixes from the guild. (Bot Mentions will always override this)',
        examples: [
          COMMAND_NAME,
        ],
        type: CommandTypes.SETTINGS,
        usage: `${COMMAND_NAME}`,
      },
      permissionsClient: [Permissions.EMBED_LINKS],
      permissions: [Permissions.MANAGE_GUILD],
    });
  }

  async run(context: Command.Context) {
    const guildId = context.guildId as string;

    const embed = createUserEmbed(context.user);
    embed.setColor(EmbedColors.DEFAULT);
    embed.setTitle('Cleared prefixes');

    const { prefixes } = await editGuildSettings(context, guildId, {prefixes: []});
    Formatter.Commands.SettingsPrefixesList.formatPrefixes(context, prefixes, embed);

    return editOrReply(context, {embed});
  }
}
