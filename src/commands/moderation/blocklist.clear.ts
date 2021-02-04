import { Command, CommandClient } from 'detritus-client';
import { Permissions } from 'detritus-client/lib/constants';

import { editGuildSettings } from '../../api';
import { CommandTypes, EmbedColors, GuildBlocklistTypes } from '../../constants';
import { createUserEmbed } from '../../utils';

import { BaseCommand } from '../basecommand';


export interface CommandArgs {
  only: GuildBlocklistTypes | null,
}

export const COMMAND_NAME = 'blocklist clear';

export default class BlocklistClearCommand extends BaseCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      choices: Object.values(GuildBlocklistTypes),
      default: null,
      disableDm: true,
      help: `Must be one of (${Object.values(GuildBlocklistTypes).join(', ')})`,
      label: 'only',
      metadata: {
        description: 'Clear out Channels/Roles/Users/Server-Wide blocklist.',
        examples: [
          COMMAND_NAME,
          `${COMMAND_NAME} channels`,
        ],
        type: CommandTypes.MODERATION,
        usage: '?<GuildDisableCommandsType>',
      },
      permissionsClient: [Permissions.EMBED_LINKS],
      permissions: [Permissions.ADMINISTRATOR],
      priority: -1,
      type: (value: string) => value.toLowerCase(),
    });
  }

  async run(context: Command.Context, args: CommandArgs) {
    const guildId = context.guildId as string;

    const embed = createUserEmbed(context.user);
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
