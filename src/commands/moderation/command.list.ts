import { Command, Constants } from 'detritus-client';
const { Permissions } = Constants;

import { createGuildDisabledCommand, deleteGuildDisabledCommand } from '../../api';
import { CommandTypes, GuildDisableCommandsTypes } from '../../constants';

import { BaseCommand } from '../basecommand';


export default class CommandListCommand extends BaseCommand {
  aliases = ['cmd list'];
  name = 'command list';

  disableDm = true;
  metadata = {
    description: 'List all disabled commands (and their associated type)',
    examples: [
      'command list',
    ],
    type: CommandTypes.MODERATION,
    usage: 'command list',
  };
  permissionsClient = [Permissions.EMBED_LINKS];
  priority = 1;

  async run(context: Command.Context) {
    const guildId = <string> context.guildId;
    return context.editOrReply('ok lol');
  }
}
