import { Command, CommandClient } from 'detritus-client';
import { Permissions } from 'detritus-client/lib/constants';
import { Markup } from 'detritus-client/lib/utils';

import { editGuildSettings } from '../../api';
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

export const COMMAND_NAME = 'prefixes replace';

export default class PrefixesReplaceCommand extends BaseCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      aliases: ['prefix replace', 'prefixes set', 'prefix set'],
      disableDm: true,
      label: 'prefix',
      metadata: {
        description: 'Replace all custom prefixes in the guild. (Bot Mentions will always override this)',
        examples: [
          `${COMMAND_NAME} ..`,
        ],
        type: CommandTypes.SETTINGS,
        usage: '<prefix>',
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
    embed.setTitle(`Replaced prefixes with **${Markup.escape.all(args.prefix)}**`);

    const { prefixes } = await editGuildSettings(context, guildId, {prefixes: [args.prefix]});
    formatPrefixes(context, prefixes, embed);

    return context.editOrReply({embed});
  }
}
