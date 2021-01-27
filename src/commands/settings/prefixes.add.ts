import { Command, CommandClient } from 'detritus-client';
import { Permissions } from 'detritus-client/lib/constants';
import { Markup } from 'detritus-client/lib/utils';

import { createGuildPrefix } from '../../api';
import { CommandTypes, EmbedColors } from '../../constants';
import { Parameters, createUserEmbed } from '../../utils';

import { BaseCommand } from '../basecommand';

import { formatPrefixes } from './prefixes';


export interface CommandArgsBefore {
  prefix: string,
}

export interface CommandArgs {
  prefix: string,
}

export const COMMAND_NAME = 'prefixes add';

export default class PrefixesAddCommand extends BaseCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      aliases: ['prefix add'],
      disableDm: true,
      label: 'prefix',
      metadata: {
        description: 'Add a custom prefix to the guild. (Bot Mentions will always override this)',
        examples: [
          `${COMMAND_NAME} ..`,
        ],
        type: CommandTypes.SETTINGS,
        usage: `${COMMAND_NAME} <prefix>`,
      },
      permissionsClient: [Permissions.EMBED_LINKS],
      permissions: [Permissions.MANAGE_GUILD],
      type: Parameters.string({maxLength: 128}),
    });
  }

  onBeforeRun(context: Command.Context, args: CommandArgsBefore) {
    return !!args.prefix;
  }

  onCancelRun(context: Command.Context, args: CommandArgsBefore) {
    return context.editOrReply('⚠ Specify a prefix');
  }

  async run(context: Command.Context, args: CommandArgs) {
    const guildId = context.guildId as string;

    const embed = createUserEmbed(context.user);
    embed.setColor(EmbedColors.DEFAULT);
    embed.setTitle(`Created prefix: **${Markup.escape.all(args.prefix)}**`);

    const prefixes = await createGuildPrefix(context, guildId, args.prefix);
    formatPrefixes(context, prefixes, embed);

    return context.editOrReply({embed});
  }
}
