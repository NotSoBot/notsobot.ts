import { Command, CommandClient } from 'detritus-client';

import { CommandCategories } from '../../../constants';
import { Formatter } from '../../../utils';

import { BaseMediasCommand } from '../basecommand';


export const COMMAND_NAME = 'wrap';

export default class WrapCommand extends BaseMediasCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      args: [
        {name: 'light', aliases: ['l'], type: 'float', metadata: {description: '0 to 2, how much of the surface\'s lighting it takes (1 by default)'}},
        {name: 'noclip', aliases: ['nc'], type: Boolean, metadata: {description: 'let it go past the surface\'s outline and sharp edges'}},
        {name: 'relief', aliases: ['r'], type: 'float', metadata: {description: '0 to 3, how much it follows the shape, 0 is flat (0.6 by default)'}},
        {name: 'rotate', aliases: ['rot'], type: 'float', metadata: {description: 'degrees clockwise, on the surface'}},
        {name: 'size', aliases: ['s'], type: 'float', metadata: {description: '0.05 to 2, its width of the shorter side (0.4 by default)'}},
        {name: 'x', type: 'float', metadata: {description: '0 to 1, where its center goes across (0.5 by default)'}},
        {name: 'y', type: 'float', metadata: {description: '0 to 1, where its center goes down (0.5 by default)'}},
      ],
      metadata: {
        category: CommandCategories.EFFECTS,
        description: 'Put a second media (a logo, text, a picture) onto the first one\'s surface, bent over its shape and lit like it\'s printed there',
        examples: [
          `${COMMAND_NAME} https://cdn.nsb.gg/assets/samples/face.png @notsobot`,
          `${COMMAND_NAME} https://cdn.nsb.gg/assets/samples/face.png @notsobot -y 0.85 -size 0.3`,
          `${COMMAND_NAME} https://cdn.nsb.gg/assets/samples/face.png @notsobot -rotate -15 -relief 1.2`,
        ],
        id: Formatter.Commands.MediaIVManipulationWrap.COMMAND_ID,
        usage: '<emoji,user:id|mention|name,url> <emoji,user:id|mention|name,url> (-light <float>) (-noclip) (-relief <float>) (-rotate <float>) (-size <float>) (-x <float>) (-y <float>)',
      },
      maxAmount: 2,
      minAmount: 2,
    });
  }

  async run(context: Command.Context, args: Formatter.Commands.MediaIVManipulationWrap.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationWrap.createMessage(context, args);
  }
}
