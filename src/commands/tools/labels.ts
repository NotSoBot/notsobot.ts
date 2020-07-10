import { Command, CommandClient } from 'detritus-client';

import { CommandTypes } from '../../constants';
import { BaseCommand } from '../basecommand';


export interface CommandArgs {
  url: string;
}

export default class LabelsCommand extends BaseCommand<CommandArgs> {
  name = 'labels';
  label = 'url';

  onBefore(context: Command.Context) {
    return context.user.isClientOwner;
  }

  run(context: Command.Context, args: CommandArgs) {
    return context.reply('ok');
  }
}
