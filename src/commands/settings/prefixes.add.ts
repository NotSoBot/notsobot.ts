import { Command } from 'detritus-client';
import { Permissions } from 'detritus-client/lib/constants';
import { Embed, Markup } from 'detritus-client/lib/utils';

import { createGuildPrefix } from '../../api';
import { CommandTypes, EmbedColors } from '../../constants';
import GuildSettingsStore from '../../stores/guildsettings';
import { Parameters } from '../../utils';

import { BaseCommand } from '../basecommand';

import { formatPrefixes } from './prefixes';


export interface CommandArgsBefore {
  prefix: string,
}

export interface CommandArgs {
  prefix: string,
}

export default class PrefixesAddCommand extends BaseCommand {
  aliases = ['prefix add'];
  name = 'prefixes add';

  disableDm = true;
  label = 'prefix';
  metadata = {
    description: 'Add a custom prefix to the guild. (Bot Mentions will always override this)',
    examples: [
      'prefixes add ..',
      'prefix add !!',
    ],
    type: CommandTypes.SETTINGS,
    usage: 'prefixes add <prefix>',
  };
  permissionsClient = [Permissions.EMBED_LINKS];
  permissions = [Permissions.MANAGE_GUILD];
  type = Parameters.string({maxLength: 128});

  onBeforeRun(context: Command.Context, args: CommandArgsBefore) {
    return !!args.prefix;
  }

  onCancelRun(context: Command.Context, args: CommandArgsBefore) {
    return context.editOrReply('⚠ Specify a prefix');
  }

  async run(context: Command.Context, args: CommandArgs) {
    const guildId = <string> context.guildId;

    const embed = new Embed();
    embed.setAuthor(context.user.toString(), context.user.avatarUrlFormat(null, {size: 1024}), context.user.jumpLink);
    embed.setColor(EmbedColors.DEFAULT);
    embed.setTitle(`Created prefix: **${Markup.escape.all(args.prefix)}**`);

    const prefixes = await createGuildPrefix(context, guildId, args.prefix);
    const settings = GuildSettingsStore.get(guildId);
    if (settings) {
      settings.prefixes = prefixes;
      formatPrefixes(context, settings, embed);
    }

    return context.editOrReply({embed});
  }
}
