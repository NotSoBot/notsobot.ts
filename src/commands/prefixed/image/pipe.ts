import { Command, CommandClient } from 'detritus-client';

import { CommandCategories } from '../../../constants';
import * as ImagePipe from '../../../utils/formatter/commands/image.pipe';
import { Parameters, imageReply } from '../../../utils';

import { BaseCommand, BaseImageCommand } from '../basecommand';


export interface CommandArgsBefore {
  commands: Array<any>,
  url?: null | string,
}

export const COMMAND_NAME = 'pipe';

export default class PipeCommand extends BaseImageCommand<ImagePipe.CommandArgs> {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      metadata: {
        category: CommandCategories.IMAGE,
        description: 'Pipe some Image commands together',
        examples: [
          COMMAND_NAME,
          `${COMMAND_NAME} flip; flop`,
        ],
        id: ImagePipe.COMMAND_ID,
        usage: '<emoji,user:id|mention,url> <...commands>',
      },
      type: [
        {name: 'url', type: Parameters.imageUrlPositional},
        {name: 'commands', type: Parameters.pipingCommands, consume: true},
      ],
    });
  }

  onBeforeRun(context: Command.Context, args: CommandArgsBefore) {
    return !!args.commands.length && super.onBeforeRun(context, args);
  }

  onCancelRun(context: Command.Context, args: CommandArgsBefore) {
    if (!args.commands.length) {
      return BaseCommand.prototype.onCancelRun.call(this, context, args);
    }
    return super.onCancelRun(context, args);
  }

  run(context: Command.Context, args: ImagePipe.CommandArgs) {
    return ImagePipe.createMessage(context, args);
  }
}
