import { Command, CommandClient } from 'detritus-client';

import { CommandCategories } from '../../../constants';
import { Formatter } from '../../../utils';

import { BaseImageOrVideoCommand } from '../basecommand';


export const COMMAND_NAME = 'pinchpunch';

export default class PinchPunchCommand extends BaseImageOrVideoCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      args: [
        {aliases: ['i'], name: 'intensity', type: 'float', metadata: {description: '-1 (pinch) to 1 (punch)'}},
        {name: 'x', type: 'float', metadata: {description: 'center across, -1 to 2 (0.5 is the middle)'}},
        {name: 'y', type: 'float', metadata: {description: 'center down, -1 to 2 (0.5 is the middle)'}},
        {aliases: ['xs'], label: 'xScale', name: 'xscale', type: 'float', metadata: {description: 'width, 0.01 to 4 (of half the width)'}},
        {aliases: ['ys'], label: 'yScale', name: 'yscale', type: 'float', metadata: {description: 'height, 0.01 to 4 (of half the height)'}},
      ],
      metadata: {
        category: CommandCategories.EFFECTS,
        description: 'Pinch an Image or Video in or punch it out around a point, like VEGAS\' Pinch/Punch',
        examples: [
          COMMAND_NAME,
          `${COMMAND_NAME} notsobot -intensity 1`,
          `${COMMAND_NAME} notsobot -intensity -1 -y 0.35 -xscale 0.4 -yscale 0.4`,
        ],
        id: Formatter.Commands.MediaIVManipulationPinchPunch.COMMAND_ID,
        usage: '?<emoji,user:id|mention|name,url> (-intensity <float>) (-x <float>) (-y <float>) (-xscale <float>) (-yscale <float>)',
      },
    });
  }

  async run(context: Command.Context, args: Formatter.Commands.MediaIVManipulationPinchPunch.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationPinchPunch.createMessage(context, args);
  }
}
