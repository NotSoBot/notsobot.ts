import { Command, CommandClient } from 'detritus-client';
import { Permissions } from 'detritus-client/lib/constants';

import { CommandCategories, EmbedColors, GuildDisableCommandsTypes } from '../../../constants';
import { createUserEmbed } from '../../../utils';

import { BaseCommand } from '../basecommand';


export interface CommandArgs {
  only: GuildDisableCommandsTypes | null,
}

export const COMMAND_NAME = 'commands clear';

export default class CommandsCommand extends BaseCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      aliases: ['cmds clear'],
      choices: Object.values(GuildDisableCommandsTypes),
      default: null,
      disableDm: true,
      help: `Must be one of (${Object.values(GuildDisableCommandsTypes).join(', ')})`,
      label: 'only',
      metadata: {
        description: 'Clear out Channels/Roles/Users/Server-Wide disabled commands.',
        examples: [
          COMMAND_NAME,
          `${COMMAND_NAME} channels`,
        ],
        category: CommandCategories.MODERATION,
        usage: '?<GuildDisableCommandsType>',
      },
      permissionsClient: [Permissions.EMBED_LINKS],
      permissions: [Permissions.MANAGE_GUILD],
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
      embed.setTitle('WIP');
      embed.setDescription('clear the entire guild');
      embed.setFooter('Disabled Commands');
    }

    return context.editOrReply({embed});
  }
}
