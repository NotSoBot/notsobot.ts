import { Command, CommandClient } from 'detritus-client';
import { Permissions } from 'detritus-client/lib/constants';

import { editGuildSettings } from '../../api';
import { CommandTypes, EmbedColors, GuildAllowlistTypes } from '../../constants';
import { createUserEmbed } from '../../utils';

import { BaseCommand } from '../basecommand';


export interface CommandArgs {
  only?: GuildAllowlistTypes,
}

export const COMMAND_NAME = 'allowlist clear';

export default class AllowlistClearCommand extends BaseCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      choices: Object.values(GuildAllowlistTypes),
      default: null,
      disableDm: true,
      help: `Must be one of (${Object.values(GuildAllowlistTypes).join(', ')})`,
      label: 'only',
      metadata: {
        description: 'Clear out Channels/Roles/Users/Server-Wide allowlist.',
        examples: [
          COMMAND_NAME,
          `${COMMAND_NAME} channels`,
        ],
        type: CommandTypes.MODERATION,
        usage: `${COMMAND_NAME} ?<GuildDisableCommandsType>`,
      },
      permissionsClient: [Permissions.EMBED_LINKS],
      permissions: [Permissions.ADMINISTRATOR],
      priority: -1,
      type: (value: string) => value.toLowerCase(),
    });
  }

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
