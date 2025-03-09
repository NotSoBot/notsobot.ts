import { Command, CommandClient } from 'detritus-client';

import { CommandCategories } from '../../../constants';
import { Formatter, Parameters } from '../../../utils';

import { BaseMediaCommand } from '../basecommand';


export const COMMAND_NAME = 'shuffle';

export default class ShuffleCommand extends BaseMediaCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      metadata: {
        category: CommandCategories.IMAGE,
        description: 'Shuffle an Audio/Image/Video file\'s frames around randomly',
        examples: [
          COMMAND_NAME,
          `${COMMAND_NAME} notsobot`,
          `${COMMAND_NAME} notsobot 0.5`,
        ],
        id: Formatter.Commands.MediaAIVManipulationShuffle.COMMAND_ID,
        usage: '?<emoji,user:id|mention|name,url> ?<segment:float>',
      },
      type: [
        {name: 'url', type: Parameters.mediaUrlPositional()},
        {name: 'segment', default: 0.5, type: 'float'},
      ],
    });
  }

  async run(context: Command.Context, args: Formatter.Commands.MediaAIVManipulationShuffle.CommandArgs) {
    return Formatter.Commands.MediaAIVManipulationShuffle.createMessage(context, args);
  }
}
