import { Command, CommandClient } from 'detritus-client';

import { CommandTypes } from '../../constants';
import { BaseImageCommand } from '../basecommand';


export interface CommandArgs {
  url: string;
}

export const COMMAND_NAME = 'labels';

export default class LabelsCommand extends BaseImageCommand<CommandArgs> {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      metadata: {
        description: 'Get the labels of an image',
        examples: [
          COMMAND_NAME,
          `${COMMAND_NAME} notsobot`,
        ],
        type: CommandTypes.TOOLS,
        usage: `${COMMAND_NAME} ?<emoji,user:id|mention|name,url>`,
      },
    });
  }

  onBefore(context: Command.Context) {
    return context.user.isClientOwner;
  }

  run(context: Command.Context, args: CommandArgs) {
    return context.reply('ok');
  }
}
