import { Command, Constants } from 'detritus-client';
const { Permissions } = Constants;

import { createGuildDisabledCommand, deleteGuildDisabledCommand } from '../../api';
import { CommandTypes, GuildDisableCommandsTypes } from '../../constants';

import { BaseCommand } from '../basecommand';


export default class CommandAllCommand extends BaseCommand {
  aliases = ['cmd all'];
  name = 'command all';

  disableDm = true;
  metadata = {
    description: 'Enable all disabled commands (WIP)',
    examples: [
      'command all',
    ],
    type: CommandTypes.MODERATION,
    usage: 'command all',
  };
  permissions = [Permissions.MANAGE_GUILD];
  priority = 1;

  async run(context: Command.Context) {
    return context.reply('WIP');
  }
}
