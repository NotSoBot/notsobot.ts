import { Command, CommandClient } from 'detritus-client';

import { CommandCategories } from '../../../constants';
import { Formatter, Parameters } from '../../../utils';

import { BaseImageOrVideoCommand } from '../basecommand';


export const COMMAND_NAME = 'offset';

export default class OffsetCommand extends BaseImageOrVideoCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      metadata: {
        category: CommandCategories.IMAGE,
        description: 'Offset an Image or Video by X or Y amount',
        examples: [
          `${COMMAND_NAME} 100 100`,
          `${COMMAND_NAME} notsobot 100 0`,
        ],
        id: Formatter.Commands.MediaIVToolsOffset.COMMAND_ID,
        usage: '?<emoji,user:id|mention,url> <x,expression> <y,expression>',
      },
      priority: -1,
      type: [
        {name: 'url', type: Parameters.mediaUrlPositional({audio: false})},
        {name: 'x'},
        {name: 'y'},
      ],
    });
  }

  onBeforeRun(context: Command.Context, args: Formatter.Commands.MediaIVToolsOffset.CommandArgs) {
    return !!args.x && !!args.y && super.onBeforeRun(context, args);
  }

  onCancelRun(context: Command.Context, args: Formatter.Commands.MediaIVToolsOffset.CommandArgs) {
    if (!args.x || !args.y) {
      return BaseImageOrVideoCommand.prototype.onCancelRun.call(this, context, args);
    }
    return super.onCancelRun(context, args);
  }

  async run(context: Command.Context, args: Formatter.Commands.MediaIVToolsOffset.CommandArgs) {
    return Formatter.Commands.MediaIVToolsOffset.createMessage(context, args);
  }
}
