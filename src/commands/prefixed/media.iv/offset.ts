import { Command, CommandClient } from 'detritus-client';

import { CommandCategories } from '../../../constants';
import { Formatter, Parameters } from '../../../utils';

import { BaseImageOrVideoCommand } from '../basecommand';


export const COMMAND_NAME = 'offset';

export default class OffsetCommand extends BaseImageOrVideoCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      args: [
        {name: 'background', aliases: ['b', 'bg'], metadata: {description: 'color, mostused or transparent, moves without wrapping around'}},
      ],
      metadata: {
        category: CommandCategories.EFFECTS,
        description: 'Offset an Image or Video by X or Y amount (positive is right and down), wrapping around or onto a background',
        examples: [
          `${COMMAND_NAME} 100 100`,
          `${COMMAND_NAME} notsobot 100 0`,
          `${COMMAND_NAME} notsobot 100 -50 -background transparent`,
          `${COMMAND_NAME} notsobot 0 64 -bg red`,
        ],
        id: Formatter.Commands.MediaIVManipulationOffset.COMMAND_ID,
        usage: '?<emoji,user:id|mention,url> <x,expression> <y,expression> (-background <color|mostused|transparent>)',
      },
      priority: -1,
      type: [
        {name: 'url', type: Parameters.mediaUrlPositional({audio: false})},
        {name: 'x'},
        {name: 'y'},
      ],
    });
  }

  onBeforeRun(context: Command.Context, args: Formatter.Commands.MediaIVManipulationOffset.CommandArgs) {
    return !!args.x && !!args.y && super.onBeforeRun(context, args);
  }

  onCancelRun(context: Command.Context, args: Formatter.Commands.MediaIVManipulationOffset.CommandArgs) {
    if (!args.x || !args.y) {
      return BaseImageOrVideoCommand.prototype.onCancelRun.call(this, context, args);
    }
    return super.onCancelRun(context, args);
  }

  async run(context: Command.Context, args: Formatter.Commands.MediaIVManipulationOffset.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationOffset.createMessage(context, args);
  }
}
