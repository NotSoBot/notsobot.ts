import { Command, CommandClient } from 'detritus-client';

import { CommandCategories } from '../../../constants';
import { Formatter, Parameters } from '../../../utils';

import { BaseImageOrVideoCommand } from '../basecommand';


export const COMMAND_NAME = 'gradientmap';

export default class GradientMapCommand extends BaseImageOrVideoCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      metadata: {
        category: CommandCategories.EFFECTS,
        description: 'Recolor an Image or Video by brightness along a gradient, like VEGAS\' Gradient Map (each color is COLOR or COLOR,POSITION from 0 to 1, colors without a position are spread evenly)',
        examples: [
          `${COMMAND_NAME} #000080 #ff8000,0.7 white`,
          `${COMMAND_NAME} notsobot black rgba(255,0,0,128)`,
        ],
        id: Formatter.Commands.MediaIVManipulationGradientMap.COMMAND_ID,
        usage: '?<emoji,user:id|mention,url> <...colors>',
      },
      type: [
        {name: 'url', type: Parameters.mediaUrlPositional({audio: false})},
        {name: 'stops', consume: true},
      ],
    });
  }

  onBeforeRun(context: Command.Context, args: Formatter.Commands.MediaIVManipulationGradientMap.CommandArgs) {
    return !!args.stops && super.onBeforeRun(context, args);
  }

  run(context: Command.Context, args: Formatter.Commands.MediaIVManipulationGradientMap.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationGradientMap.createMessage(context, args);
  }
}
