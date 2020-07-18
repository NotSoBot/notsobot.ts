import { Command } from 'detritus-client';
import { Permissions } from 'detritus-client/lib/constants';
import { Embed, Markup } from 'detritus-client/lib/utils';

import { deleteGuildPrefix } from '../../api';
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

export default class PrefixesRemoveCommand extends BaseCommand {
  aliases = ['prefix remove', 'prefixes delete', 'prefix delete'];
  name = 'prefixes remove';

  disableDm = true;
  label = 'prefix';
  metadata = {
    description: 'Remove a custom prefix from the guild. (Bot Mentions will always override this)',
    examples: [
      'prefixes remove ..',
      'prefix delete ..',
    ],
    type: CommandTypes.SETTINGS,
    usage: 'prefixes remove <prefix>',
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
    embed.setTitle(`Remove prefix: **${Markup.escape.all(args.prefix)}**`);

    const prefixes = await deleteGuildPrefix(context, guildId, args.prefix);
    formatPrefixes(context, prefixes, embed);

    return context.editOrReply({embed});
  }
}
