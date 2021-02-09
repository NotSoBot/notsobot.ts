import { Command, CommandClient } from 'detritus-client';
import { Permissions } from 'detritus-client/lib/constants';
import { Markup } from 'detritus-client/lib/utils';

import { editGuildSettings } from '../../api';
import { CommandTypes, EmbedColors } from '../../constants';
import { Parameters, createUserEmbed, editOrReply } from '../../utils';

import { BaseCommand } from '../basecommand';


export interface CommandArgsBefore {
  timezone: string,
}

export interface CommandArgs {
  timezone: string,
}

export const COMMAND_NAME = 'set timezone';

export default class SetTimezoneCommand extends BaseCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      disableDm: true,
      label: 'timezone',
      metadata: {
        description: 'Change your guild\'s timezone for commands/logging purposes',
        examples: [
          `${COMMAND_NAME} alaska`,
          `${COMMAND_NAME} mst`,
        ],
        type: CommandTypes.SETTINGS,
        usage: '<timezone>',
      },
      permissionsClient: [Permissions.EMBED_LINKS],
      permissions: [Permissions.MANAGE_GUILD],
      type: Parameters.string({maxLength: 128}),
    });
  }

  onBefore(context: Command.Context) {
    return context.user.isClientOwner;
  }

  onBeforeRun(context: Command.Context, args: CommandArgsBefore) {
    return !!args.timezone;
  }

  async run(context: Command.Context, args: CommandArgs) {
    const guildId = context.guildId as string;

    const embed = createUserEmbed(context.user);
    embed.setColor(EmbedColors.DEFAULT);

    const settings = await editGuildSettings(context, guildId, {timezone: args.timezone});
    embed.setDescription(`Set timezone to ${settings.timezone}`);

    return editOrReply(context, {embed});
  }
}
