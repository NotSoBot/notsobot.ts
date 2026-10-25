import { Command, CommandClient } from 'detritus-client';

import { CommandCategories } from '../../../constants';
import { Formatter } from '../../../utils';

import { BaseMediasCommand } from '../basecommand';


export const COMMAND_NAME = 'interpolate';

export default class InterpolateCommand extends BaseMediasCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      aliases: ['interleave'],
      args: [
        {name: 'noloop', aliases: ['nl'], type: Boolean},
        {name: 'segment', aliases: ['s'], type: 'float', metadata: {description: '0.1 to 10, default 0.125'}},
      ],
      metadata: {
        category: CommandCategories.CONVERSION,
        description: 'Cut two medias into small pieces and alternate between them',
        examples: [
          `${COMMAND_NAME} @cakedan @notsobot`,
          `${COMMAND_NAME} @cakedan @notsobot -segment 0.2 -noloop`,
        ],
        id: Formatter.Commands.MediaAIVManipulationInterpolate.COMMAND_ID,
        usage: '?<emoji,user:id|mention|name,url> ?<emoji,user:id|mention|name,url> (-noloop) (-segment <float>)',
      },
      minAmount: 2,
    });
  }

  async run(context: Command.Context, args: Formatter.Commands.MediaAIVManipulationInterpolate.CommandArgs) {
    return Formatter.Commands.MediaAIVManipulationInterpolate.createMessage(context, args);
  }
}
