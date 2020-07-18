import { Command, CommandClient } from 'detritus-client';
import { Permissions } from 'detritus-client/lib/constants';
import { Embed, Markup } from 'detritus-client/lib/utils';

import { CommandTypes, EmbedColors, GuildDisableCommandsTypes } from '../../constants';

import { BaseCommand } from '../basecommand';

import { guildDisableCommandsType } from './commands';


export interface CommandArgs {
  only?: GuildDisableCommandsTypes,
}

export default class CommandsCommand extends BaseCommand {
  aliases = ['cmds clear'];
  name = 'commands clear';

  disableDm = true;
  label = 'only';
  metadata = {
    description: 'Clear out Channels/Roles/Users/Server-Wide disabled commands.',
    examples: [
      'commands clear',
      'commands clear channels',
    ],
    type: CommandTypes.MODERATION,
    usage: 'commands clear ?<GuildDisableCommandsType>',
  };
  permissionsClient = [Permissions.EMBED_LINKS];
  permissions = [Permissions.MANAGE_GUILD];
  type = guildDisableCommandsType;

  async run(context: Command.Context, args: CommandArgs) {
    const guildId = context.guildId as string;

    const embed = new Embed();
    embed.setAuthor(String(context.user), context.user.avatarUrl, context.user.jumpLink);
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
